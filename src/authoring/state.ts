import type { StoreApi } from "zustand";

import type { State } from "@/app/store";
import { mapSaveScheduler } from "@/maps/saveScheduler";
import { mapService } from "@/maps/service";
import { buildAtlasMapFromSource } from "@/atlas/model";
import { graphDataToSource } from "@/maps/serialize";
import type { CatalogEntry, MapId } from "@/maps";
import type { SourceGraph } from "@shared/maps/source";
import type { AuthorableRelation } from "@shared/maps/relations";
import {
  addEdge as addSourceEdge,
  applyDraft,
  removeEdge as removeSourceEdge,
  updateEdge as updateSourceEdge,
  slugify,
  uniqueSlug,
  type NodeDraft,
} from "./model";

/** Result of an authoring mutation; error is a human-facing validation message. */
export interface EditResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export type NodeEditorState = { mode: "create" } | { mode: "edit"; nodeId: string } | null;

export interface AuthoringSlice {
  /** Whether authoring affordances are shown. */
  editMode: boolean;
  toggleEditMode: () => void;
  /** Maps with a saved local edit overlay (drives the "edited" badge). */
  editedMaps: Set<MapId>;
  /** Session working source per map; lazily derived from the loaded map. */
  editSources: Partial<Record<MapId, SourceGraph>>;
  /** Open node editor dialog (create or edit), or null. */
  nodeEditor: NodeEditorState;
  /** Last authoring validation error, for inline display. */
  editError: string | null;
  openNodeEditor: (state: NonNullable<NodeEditorState>) => void;
  closeNodeEditor: () => void;
  /** Create or update a node from a draft. Returns ok + new id (create). */
  commitNode: (draft: NodeDraft) => EditResult;
  /** Delete a node and all edges (and proof refs) touching it. */
  deleteNode: (id: string) => EditResult;
  /** Add a forward-relation edge, with optional author-only notes. */
  addNodeEdge: (edge: { source: string; target: string; relation: AuthorableRelation; notes?: string }) => EditResult;
  /** Edit an existing edge's relation and/or notes, keyed by its semantic key. */
  updateNodeEdge: (key: string, patch: { relation?: AuthorableRelation; notes?: string }) => EditResult;
  /** Remove an edge by its semantic key (see authoring.edgeKey). */
  removeNodeEdge: (key: string) => EditResult;
  /** Current working source for the active map (for export), or null. */
  currentEditSource: () => SourceGraph | null;
  /** Replace the active map from an imported source graph. */
  importSource: (source: unknown) => EditResult;
  /** Discard local edits for the active map and restore the built-in. */
  revertMap: () => Promise<EditResult>;
}

/** Replace (or add) a catalog entry for a slug, preserving its title. */
function upsertCatalog(catalog: CatalogEntry[], next: CatalogEntry): CatalogEntry[] {
  const i = catalog.findIndex((e) => e.slug === next.slug);
  if (i === -1) return [...catalog, next];
  const copy = [...catalog];
  copy[i] = { ...catalog[i], ...next };
  return copy;
}

type Setter = (partial: Partial<State> | ((s: State) => Partial<State>)) => void;

export interface AuthoringDependencies {
  service: Pick<typeof mapService, "saveMap" | "revertOwnedMap">;
  schedule: (slug: MapId, task: () => Promise<void>, delayMs: number) => void;
}

const defaultDependencies: AuthoringDependencies = {
  service: mapService,
  schedule: (slug, task, delayMs) => mapSaveScheduler.schedule(slug, task, delayMs),
};

function scheduleSave(
  slug: MapId,
  get: () => State,
  set: Setter,
  dependencies: AuthoringDependencies,
  delayMs = 800,
): void {
  dependencies.schedule(slug, () => saveMapToServer(slug, get, set, dependencies), delayMs);
}

/** Persist a slug's working source: fork the public map first if needed, then PUT. */
async function saveMapToServer(
  slug: MapId,
  get: () => State,
  set: Setter,
  dependencies: AuthoringDependencies,
): Promise<void> {
  if (!get().userId) return; // editing requires sign-in to persist
  const source = get().editSources[slug];
  if (!source) return;
  try {
    const outcome = await dependencies.service.saveMap({
      slug,
      source,
      meta: get().mapMeta[slug],
      catalog: get().catalog,
      onForked: (meta, entry) => {
        set((state) => ({
          mapMeta: { ...state.mapMeta, [slug]: meta },
          catalog: upsertCatalog(state.catalog, entry),
        }));
      },
    });
    if (outcome.status === "conflict") set({ staleMap: slug });
    if (outcome.status === "saved") {
      set((state) => ({ mapMeta: { ...state.mapMeta, [slug]: outcome.meta } }));
    }
  } catch (e) {
    console.warn(`[math-atlas] save failed for "${slug}":`, e);
  }
}

/** The active map's working source: the session copy, else derived from the loaded map. */
function workingSource(state: State): SourceGraph | null {
  const map = state.loadedMaps[state.mapId];
  if (!map) return null;
  return state.editSources[state.mapId] ?? graphDataToSource(map.data);
}

/**
 * Validate + build a candidate source graph, and on success swap it into the
 * active map, persist the overlay, and flag the map as edited. The working
 * source is re-normalized from the built map so it always matches what renders.
 */
function commitCandidate(
  get: () => State,
  set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void,
  candidate: unknown,
  dependencies: AuthoringDependencies,
  selectId?: string,
): EditResult {
  const result = buildAtlasMapFromSource(candidate);
  if (!result.ok) {
    set({ editError: result.error });
    return { ok: false, error: result.error };
  }
  const mapId = get().mapId;
  const normalized = graphDataToSource(result.map.data);
  set((s) => ({
    loadedMaps: { ...s.loadedMaps, [mapId]: result.map },
    editSources: { ...s.editSources, [mapId]: normalized },
    editedMaps: new Set(s.editedMaps).add(mapId),
    editError: null,
  }));
  // Persist to the server (debounced); forks the public map first if needed.
  scheduleSave(mapId, get, set, dependencies);
  return { ok: true, id: selectId };
}

export function createAuthoringSlice(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  dependencies: AuthoringDependencies = defaultDependencies,
): AuthoringSlice {
  return {
    editMode: false,
    toggleEditMode: () =>
      set((s) => ({
        editMode: !s.editMode,
        // Leaving edit mode closes any open editor.
        nodeEditor: s.editMode ? null : s.nodeEditor,
        editError: null,
      })),
    editedMaps: new Set(),
    editSources: {},
    nodeEditor: null,
    editError: null,
    openNodeEditor: (nodeEditor) => set({ nodeEditor, editError: null }),
    closeNodeEditor: () => set({ nodeEditor: null, editError: null }),

    commitNode: (draft) => {
      if (!draft.label.trim()) {
        const error = "A label is required.";
        set({ editError: error });
        return { ok: false, error };
      }
      const base = workingSource(get());
      if (!base) return { ok: false, error: "Map not loaded." };

      let id = draft.id;
      let concepts: SourceGraph["concepts"];
      if (id) {
        const existing = base.concepts.find((c) => c.id === id);
        const concept = applyDraft(draft, id, existing);
        concepts = base.concepts.map((c) => (c.id === id ? concept : c));
      } else {
        const taken = new Set(base.concepts.map((c) => c.id));
        id = uniqueSlug(slugify(draft.label), taken);
        concepts = [...base.concepts, applyDraft(draft, id)];
      }
      const result = commitCandidate(get, set, { ...base, concepts }, dependencies, id);
      if (result.ok) set({ selectedId: id, nodeEditor: null });
      return result;
    },

    deleteNode: (id) => {
      const base = workingSource(get());
      if (!base) return { ok: false, error: "Map not loaded." };
      const candidate: SourceGraph = {
        ...base,
        // Cascade: drop the concept, its edges, and any proof step that referenced it.
        concepts: base.concepts
          .filter((c) => c.id !== id)
          .map((c) =>
            c.proof
              ? {
                  ...c,
                  proof: {
                    steps: c.proof.steps.map((step) => ({
                      ...step,
                      uses: step.uses.filter((u) => u !== id),
                    })),
                  },
                }
              : c,
          ),
        edges: base.edges.filter((e) => e.source !== id && e.target !== id),
      };
      const result = commitCandidate(get, set, candidate, dependencies);
      if (result.ok && get().selectedId === id) set({ selectedId: null });
      if (result.ok && get().nodeEditor?.mode === "edit") set({ nodeEditor: null });
      return result;
    },

    addNodeEdge: (edge) => {
      const base = workingSource(get());
      if (!base) return { ok: false, error: "Map not loaded." };
      return commitCandidate(get, set, addSourceEdge(base, edge), dependencies);
    },

    updateNodeEdge: (key, patch) => {
      const base = workingSource(get());
      if (!base) return { ok: false, error: "Map not loaded." };
      return commitCandidate(get, set, updateSourceEdge(base, key, patch), dependencies);
    },

    removeNodeEdge: (key) => {
      const base = workingSource(get());
      if (!base) return { ok: false, error: "Map not loaded." };
      return commitCandidate(get, set, removeSourceEdge(base, key), dependencies);
    },

    currentEditSource: () => workingSource(get()),

    importSource: (source) => commitCandidate(get, set, source, dependencies),

    revertMap: async () => {
      const mapId = get().mapId;
      const meta = get().mapMeta[mapId];
      // Discard the owned fork on the server (revert = back to the public map).
      if (meta?.role === "owner") {
        try {
          await dependencies.service.revertOwnedMap(meta);
        } catch (e) {
          console.warn(`[math-atlas] revert delete failed for "${mapId}":`, e);
        }
      }
      set((s) => {
        const editSources = { ...s.editSources };
        delete editSources[mapId];
        const editedMaps = new Set(s.editedMaps);
        editedMaps.delete(mapId);
        const loadedMaps = { ...s.loadedMaps };
        delete loadedMaps[mapId];
        const mapMeta = { ...s.mapMeta };
        delete mapMeta[mapId];
        return { editSources, editedMaps, loadedMaps, mapMeta, nodeEditor: null, editError: null };
      });
      try {
        await get().loadCatalog();
        await get().ensureMapLoaded(mapId);
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ editError: message });
        return { ok: false, error: message };
      }
    },
  };
}
