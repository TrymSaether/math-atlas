import { create } from "zustand";
import { DEFAULT_MAP_ID, isMapId, loadMap, MAPS, type LoadedMap, type MapId } from "./data";
import { applyTheme, readStoredTheme, schemeFor } from "./lib/themes";
import { defaultVisibleKinds } from "./lib/nodeCategory";
import type { NodeKind, Relation } from "./types";
import type { SourceGraph } from "./data/sourceSchema";
import type { AuthorableRelation } from "./data/relations";
import type { RouteKind } from "./lib/route";
import { buildLoadedMapFromSource, loadShippedMap } from "./data/loadMap";
import { graphDataToSource } from "./data/toSource";
import { clearOverlay, hasOverlay, writeOverlay } from "./data/edits";
import {
  addEdge as addSourceEdge,
  applyDraft,
  removeEdge as removeSourceEdge,
  updateEdge as updateSourceEdge,
  slugify,
  uniqueSlug,
  type NodeDraft,
} from "./data/authoring";

/** Result of an authoring mutation; `error` is a human-facing validation message. */
export interface EditResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** What the node editor dialog is doing, if open. */
export type NodeEditorState = { mode: "create" } | { mode: "edit"; nodeId: string } | null;

export type SearchScope = "all" | "title";
export type ViewMode = "dependency" | "cluster";
export type EdgeStyle = "smooth" | "straight" | "bezier";
/** How edge relationship labels read on hover/selection. */
export type EdgeLabelStyle = "prose" | "terse";
/** Which surface is shown: the graph canvas, the dictionary reading view, the flashcard study mode, or the geometric sandbox. */
export type Surface = "atlas" | "dictionary" | "flashcards" | "sandbox";

const APP_STATE_STORAGE_KEY = "math-atlas-state-v1";
const PERSISTED_STATE_VERSION = 1;

interface PersistedMapState {
  search?: string;
  kinds?: NodeKind[];
  topics?: string[];
  relations?: Relation[];
  selectedId?: string | null;
  routeFrom?: string | null;
  routeTo?: string | null;
}

interface PersistedState {
  version: typeof PERSISTED_STATE_VERSION;
  mapId?: MapId;
  searchScope?: SearchScope;
  view?: ViewMode;
  showSoftDeps?: boolean;
  edgeStyle?: EdgeStyle;
  edgeLabelStyle?: EdgeLabelStyle;
  focusMode?: boolean;
  focusDepth?: number;
  showGrid?: boolean;
  showRegions?: boolean;
  showMinimap?: boolean;
  surface?: Surface;
  routeKind?: RouteKind;
  routeIncludeProof?: boolean;
  maps?: Partial<Record<MapId, PersistedMapState>>;
}

interface State {
  /** Active theme id (see src/lib/themes.ts). */
  theme: string;
  setTheme: (id: string) => void;
  /** Light/dark of the active theme — drives scheme-dependent UI. */
  scheme: () => "light" | "dark";

  mapId: MapId;
  setMap: (mapId: MapId) => void;
  loadedMaps: Partial<Record<MapId, LoadedMap>>;
  loadingMapId: MapId | null;
  mapError: string | null;
  ensureMapLoaded: (mapId?: MapId) => Promise<void>;

  search: string;
  setSearch: (s: string) => void;
  searchScope: SearchScope;
  setSearchScope: (s: SearchScope) => void;

  kinds: Set<NodeKind>;
  toggleKind: (k: NodeKind) => void;

  topics: Set<string>;
  toggleTopic: (t: string) => void;
  resetTopics: () => void;

  relations: Set<Relation>;
  toggleRelation: (r: Relation) => void;

  view: ViewMode;
  setView: (v: ViewMode) => void;
  /** Pedagogical "learn-this-first" edges — hidden by default to cut the spaghetti. */
  showSoftDeps: boolean;
  toggleSoftDeps: () => void;
  /** Edge routing for the dependency graph. */
  edgeStyle: EdgeStyle;
  setEdgeStyle: (s: EdgeStyle) => void;
  /** Wording of the relationship label shown on hover/selection. */
  edgeLabelStyle: EdgeLabelStyle;
  setEdgeLabelStyle: (s: EdgeLabelStyle) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  focusDepth: number;
  setFocusDepth: (d: number) => void;

  /** Canvas "Map layers" toggles (driven by the floating Layers control). */
  showGrid: boolean;
  toggleGrid: () => void;
  showRegions: boolean;
  toggleRegions: () => void;
  /** Floating atlas overlays. */
  showMinimap: boolean;
  toggleMinimap: () => void;

  selectedId: string | null;
  select: (id: string | null) => void;

  /**
   * Directions. Two build modes over the dependency DAG:
   *   • prereq — upstream cone of a single goal (`routeTo`); `routeFrom` unused.
   *   • path   — every dependency path between `routeFrom` and `routeTo`.
   */
  routeKind: RouteKind;
  setRouteKind: (kind: RouteKind) => void;
  /** When true, routes also include proof-only prerequisites (the proof overlay). */
  routeIncludeProof: boolean;
  setRouteIncludeProof: (on: boolean) => void;
  routeMode: boolean;
  routeFrom: string | null;
  routeTo: string | null;
  /** Bumped to replay the traversal animation. */
  routeRunKey: number;
  /** Enter/cancel route planning (clears any in-progress pick). */
  toggleRouteMode: () => void;
  /** Click handler while planning: prereq sets the goal; path picks start→stop. */
  pickRoutePoint: (id: string) => void;
  setRouteEndpoint: (endpoint: "from" | "to", id: string | null) => void;
  swapRouteEndpoints: () => void;
  clearRoute: () => void;
  replayRoute: () => void;
  /** Current route's study order, mirrored here so the tour can walk it. */
  routeSequence: string[];
  setRouteSequence: (ids: string[]) => void;
  /** Guided tour: index into `routeSequence`, or null when not touring. */
  tourIndex: number | null;
  startTour: () => void;
  tourStep: (delta: number) => void;
  endTour: () => void;

  surface: Surface;
  setSurface: (s: Surface) => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;

  /* ---- Authoring ---------------------------------------------------- */
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
  addNodeEdge: (edge: {
    source: string;
    target: string;
    relation: AuthorableRelation;
    notes?: string;
  }) => EditResult;
  /** Edit an existing edge's relation and/or notes, keyed by its semantic key. */
  updateNodeEdge: (
    key: string,
    patch: { relation?: AuthorableRelation; notes?: string },
  ) => EditResult;
  /** Remove an edge by its semantic key (see authoring.edgeKey). */
  removeNodeEdge: (key: string) => EditResult;
  /** Current working source for the active map (for export), or null. */
  currentEditSource: () => SourceGraph | null;
  /** Replace the active map from an imported source graph. */
  importSource: (source: unknown) => EditResult;
  /** Discard local edits for the active map and restore the built-in. */
  revertMap: () => Promise<EditResult>;
}

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPersistedState(): unknown | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== PERSISTED_STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore private-mode / quota failures */
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function isSearchScope(value: unknown): value is SearchScope {
  return value === "all" || value === "title";
}

function isViewMode(value: unknown): value is ViewMode {
  return value === "dependency" || value === "cluster";
}

function isEdgeStyle(value: unknown): value is EdgeStyle {
  return value === "smooth" || value === "straight" || value === "bezier";
}

function isEdgeLabelStyle(value: unknown): value is EdgeLabelStyle {
  return value === "prose" || value === "terse";
}

function isSurface(value: unknown): value is Surface {
  return (
    value === "atlas" || value === "dictionary" || value === "flashcards" || value === "sandbox"
  );
}

function normalizedFocusDepth(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(3, Math.max(1, Math.round(value)));
}

function normalizePersistedMapState(value: unknown): PersistedMapState | undefined {
  if (!isRecord(value)) return undefined;
  return {
    search: asString(value.search),
    kinds: asStringArray(value.kinds),
    topics: asStringArray(value.topics),
    relations: asStringArray(value.relations),
    selectedId: asNullableString(value.selectedId),
    routeFrom: asNullableString(value.routeFrom),
    routeTo: asNullableString(value.routeTo),
  };
}

function normalizePersistedState(value: unknown | null): PersistedState | null {
  if (!isRecord(value)) return null;
  const maps: Partial<Record<MapId, PersistedMapState>> = {};
  if (isRecord(value.maps)) {
    for (const [key, mapState] of Object.entries(value.maps)) {
      if (!isMapId(key)) continue;
      const normalized = normalizePersistedMapState(mapState);
      if (normalized) maps[key] = normalized;
    }
  }
  return {
    version: PERSISTED_STATE_VERSION,
    mapId: typeof value.mapId === "string" && isMapId(value.mapId) ? value.mapId : undefined,
    searchScope: isSearchScope(value.searchScope) ? value.searchScope : undefined,
    view: isViewMode(value.view) ? value.view : undefined,
    showSoftDeps: asBoolean(value.showSoftDeps),
    edgeStyle: isEdgeStyle(value.edgeStyle) ? value.edgeStyle : undefined,
    edgeLabelStyle: isEdgeLabelStyle(value.edgeLabelStyle) ? value.edgeLabelStyle : undefined,
    focusMode: asBoolean(value.focusMode),
    focusDepth: normalizedFocusDepth(value.focusDepth),
    showGrid: asBoolean(value.showGrid),
    showRegions: asBoolean(value.showRegions),
    showMinimap: asBoolean(value.showMinimap),
    surface: isSurface(value.surface) ? value.surface : undefined,
    routeKind:
      value.routeKind === "prereq" || value.routeKind === "path" ? value.routeKind : undefined,
    routeIncludeProof: asBoolean(value.routeIncludeProof),
    maps,
  };
}

const persistedState = normalizePersistedState(readPersistedState());
const persistedMaps: Partial<Record<MapId, PersistedMapState>> = {
  ...(persistedState?.maps ?? {}),
};

function rememberMapState(state: State): void {
  if (!state.loadedMaps[state.mapId]) return;
  persistedMaps[state.mapId] = {
    search: state.search,
    kinds: [...state.kinds],
    topics: [...state.topics],
    relations: [...state.relations],
    selectedId: state.selectedId,
    routeFrom: state.routeFrom,
    routeTo: state.routeTo,
  };
}

function persistedStateFor(state: State): PersistedState {
  return {
    version: PERSISTED_STATE_VERSION,
    mapId: state.mapId,
    searchScope: state.searchScope,
    view: state.view,
    showSoftDeps: state.showSoftDeps,
    edgeStyle: state.edgeStyle,
    edgeLabelStyle: state.edgeLabelStyle,
    focusMode: state.focusMode,
    focusDepth: state.focusDepth,
    showGrid: state.showGrid,
    showRegions: state.showRegions,
    showMinimap: state.showMinimap,
    surface: state.surface,
    routeKind: state.routeKind,
    routeIncludeProof: state.routeIncludeProof,
    maps: persistedMaps,
  };
}

function setFromPersisted<T extends string>(
  saved: T[] | undefined,
  validValues: Iterable<T>,
  fallback: Iterable<T>,
): Set<T> {
  if (!saved) return new Set(fallback);
  const valid = new Set(validValues);
  return new Set(saved.filter((value) => valid.has(value)));
}

function mapStateForLoadedMap(map: LoadedMap, saved: PersistedMapState | undefined) {
  const validNodeIds = new Set(map.data.nodes.map((node) => node.id));
  const selectedId =
    saved?.selectedId && validNodeIds.has(saved.selectedId) ? saved.selectedId : null;

  return {
    search: saved?.search ?? "",
    kinds: setFromPersisted(saved?.kinds, map.kinds, defaultVisibleKinds(map.kinds)),
    topics: setFromPersisted(
      saved?.topics,
      map.data.domains.map((domain) => domain.id),
      [],
    ),
    relations: setFromPersisted(saved?.relations, map.relations, map.relations),
    selectedId,
    // Routes are transient exploration state — never restored, so the map opens
    // on the fit-all overview rather than a highlighted cone.
    routeMode: false,
    routeFrom: null,
    routeTo: null,
  };
}

function initialEditedMaps(): Set<MapId> {
  const edited = new Set<MapId>();
  for (const id of Object.keys(MAPS) as MapId[]) {
    if (hasOverlay(id)) edited.add(id);
  }
  return edited;
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
  selectId?: string,
): EditResult {
  const result = buildLoadedMapFromSource(candidate);
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
  writeOverlay(mapId, {
    baseVersion: normalized.version,
    updated: normalized.updated,
    source: normalized,
  });
  return { ok: true, id: selectId };
}

export const useStore = create<State>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (id) => {
    applyTheme(id);
    set({ theme: id });
  },
  scheme: () => schemeFor(get().theme),

  mapId: persistedState?.mapId ?? DEFAULT_MAP_ID,
  loadedMaps: {},
  loadingMapId: null,
  mapError: null,
  ensureMapLoaded: async (mapId = get().mapId) => {
    if (get().loadedMaps[mapId]) return;

    set({ loadingMapId: mapId, mapError: null });
    try {
      const map = await loadMap(mapId);
      set((state) => {
        const loadedMaps = { ...state.loadedMaps, [mapId]: map };
        if (state.mapId !== mapId) {
          return {
            loadedMaps,
            loadingMapId: state.loadingMapId === mapId ? null : state.loadingMapId,
          };
        }

        return {
          loadedMaps,
          loadingMapId: null,
          mapError: null,
          ...mapStateForLoadedMap(map, persistedMaps[mapId]),
        };
      });
    } catch (error) {
      set({
        loadingMapId: null,
        mapError: error instanceof Error ? error.message : String(error),
      });
    }
  },
  setMap: (mapId) => {
    rememberMapState(get());
    const map = get().loadedMaps[mapId];
    set({
      mapId,
      ...(map
        ? mapStateForLoadedMap(map, persistedMaps[mapId])
        : {
            search: persistedMaps[mapId]?.search ?? "",
            kinds: new Set<NodeKind>(),
            topics: new Set<string>(),
            relations: new Set<Relation>(),
            selectedId: null,
            routeFrom: null,
            routeTo: null,
          }),
      routeMode: false,
      tourIndex: null,
      routeSequence: [],
    });
    void get().ensureMapLoaded(mapId);
  },

  search: persistedMaps[persistedState?.mapId ?? DEFAULT_MAP_ID]?.search ?? "",
  setSearch: (s) => set({ search: s }),
  searchScope: persistedState?.searchScope ?? "all",
  setSearchScope: (s) => set({ searchScope: s }),

  kinds: new Set(),
  toggleKind: (k) => set((s) => ({ kinds: toggle(s.kinds, k) })),

  topics: new Set(),
  toggleTopic: (t) => set((s) => ({ topics: toggle(s.topics, t) })),
  resetTopics: () => set({ topics: new Set() }),

  relations: new Set(),
  toggleRelation: (r) => set((s) => ({ relations: toggle(s.relations, r) })),

  view: persistedState?.view ?? "dependency",
  setView: (view) =>
    set({
      view,
      edgeStyle: view === "cluster" ? "bezier" : "smooth",
    }),
  showSoftDeps: persistedState?.showSoftDeps ?? false,
  toggleSoftDeps: () => set((s) => ({ showSoftDeps: !s.showSoftDeps })),
  edgeStyle:
    persistedState?.edgeStyle ?? (persistedState?.view === "cluster" ? "bezier" : "smooth"),
  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),
  edgeLabelStyle: persistedState?.edgeLabelStyle ?? "prose",
  setEdgeLabelStyle: (edgeLabelStyle) => set({ edgeLabelStyle }),
  focusMode: persistedState?.focusMode ?? false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  focusDepth: persistedState?.focusDepth ?? 1,
  setFocusDepth: (d) => set({ focusDepth: Math.min(3, Math.max(1, d)) }),

  showGrid: persistedState?.showGrid ?? true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  showRegions: persistedState?.showRegions ?? true,
  toggleRegions: () => set((s) => ({ showRegions: !s.showRegions })),
  showMinimap: persistedState?.showMinimap ?? true,
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  routeKind: persistedState?.routeKind ?? "prereq",
  setRouteKind: (routeKind) =>
    set((s) => ({
      routeKind,
      // Switching modes invalidates an in-progress pick and any active tour.
      routeMode: true,
      routeFrom: null,
      routeTo: routeKind === "prereq" ? s.selectedId : null,
      tourIndex: null,
      routeRunKey: s.routeRunKey + 1,
    })),
  routeIncludeProof: persistedState?.routeIncludeProof ?? false,
  setRouteIncludeProof: (routeIncludeProof) =>
    set((s) => ({ routeIncludeProof, tourIndex: null, routeRunKey: s.routeRunKey + 1 })),
  routeMode: false,
  routeFrom: null,
  routeTo: null,
  routeRunKey: 0,
  toggleRouteMode: () =>
    set((s) =>
      s.routeMode
        ? { routeMode: false, routeFrom: null, routeTo: null, tourIndex: null }
        : s.routeKind === "prereq"
          ? { routeMode: true, routeFrom: null, routeTo: s.selectedId, tourIndex: null }
          : { routeMode: true, routeFrom: s.selectedId, routeTo: null, tourIndex: null },
    ),
  pickRoutePoint: (id) =>
    set((s) => {
      if (s.routeKind === "prereq") {
        // One pick = the goal; its prerequisite cone resolves immediately.
        return {
          routeTo: id,
          routeFrom: null,
          routeMode: false,
          tourIndex: null,
          routeRunKey: s.routeRunKey + 1,
        };
      }
      if (!s.routeFrom) {
        if (s.routeTo && id !== s.routeTo) {
          return {
            routeFrom: id,
            routeMode: false,
            tourIndex: null,
            routeRunKey: s.routeRunKey + 1,
          };
        }
        return { routeFrom: id, routeTo: null };
      }
      if (id === s.routeFrom) return {};
      return { routeTo: id, routeMode: false, tourIndex: null, routeRunKey: s.routeRunKey + 1 };
    }),
  setRouteEndpoint: (endpoint, id) =>
    set((s) => {
      const nextFrom = endpoint === "from" ? id : s.routeFrom;
      const nextTo = endpoint === "to" ? id : s.routeTo;
      const dedupedTo = nextFrom && nextTo === nextFrom ? null : nextTo;
      const complete = Boolean(nextFrom && dedupedTo);
      return {
        routeFrom: nextFrom,
        routeTo: dedupedTo,
        routeMode: !complete,
        tourIndex: null,
        routeRunKey: complete ? s.routeRunKey + 1 : s.routeRunKey,
      };
    }),
  swapRouteEndpoints: () =>
    set((s) => {
      const complete = Boolean(s.routeFrom && s.routeTo);
      return {
        routeFrom: s.routeTo,
        routeTo: s.routeFrom,
        routeMode: !complete,
        tourIndex: null,
        routeRunKey: complete ? s.routeRunKey + 1 : s.routeRunKey,
      };
    }),
  clearRoute: () =>
    set({ routeMode: false, routeFrom: null, routeTo: null, tourIndex: null, routeSequence: [] }),
  replayRoute: () => set((s) => ({ routeRunKey: s.routeRunKey + 1 })),

  routeSequence: [],
  setRouteSequence: (ids) =>
    set((s) => {
      // Keep an active tour in bounds when the underlying sequence changes.
      if (s.tourIndex === null) return { routeSequence: ids };
      if (ids.length === 0) return { routeSequence: ids, tourIndex: null };
      return { routeSequence: ids, tourIndex: Math.min(s.tourIndex, ids.length - 1) };
    }),
  tourIndex: null,
  startTour: () =>
    set((s) => {
      if (s.routeSequence.length === 0) return {};
      return { tourIndex: 0, selectedId: s.routeSequence[0] };
    }),
  tourStep: (delta) =>
    set((s) => {
      if (s.tourIndex === null || s.routeSequence.length === 0) return {};
      const next = Math.max(0, Math.min(s.routeSequence.length - 1, s.tourIndex + delta));
      return { tourIndex: next, selectedId: s.routeSequence[next] };
    }),
  endTour: () => set({ tourIndex: null }),

  surface: persistedState?.surface ?? "atlas",
  setSurface: (surface) => set({ surface }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),

  /* ---- Authoring ---------------------------------------------------- */
  editMode: false,
  toggleEditMode: () =>
    set((s) => ({
      editMode: !s.editMode,
      // Leaving edit mode closes any open editor.
      nodeEditor: s.editMode ? null : s.nodeEditor,
      editError: null,
    })),
  editedMaps: initialEditedMaps(),
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
    const result = commitCandidate(get, set, { ...base, concepts }, id);
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
    const result = commitCandidate(get, set, candidate);
    if (result.ok && get().selectedId === id) set({ selectedId: null });
    if (result.ok && get().nodeEditor?.mode === "edit") set({ nodeEditor: null });
    return result;
  },

  addNodeEdge: (edge) => {
    const base = workingSource(get());
    if (!base) return { ok: false, error: "Map not loaded." };
    return commitCandidate(get, set, addSourceEdge(base, edge));
  },

  updateNodeEdge: (key, patch) => {
    const base = workingSource(get());
    if (!base) return { ok: false, error: "Map not loaded." };
    return commitCandidate(get, set, updateSourceEdge(base, key, patch));
  },

  removeNodeEdge: (key) => {
    const base = workingSource(get());
    if (!base) return { ok: false, error: "Map not loaded." };
    return commitCandidate(get, set, removeSourceEdge(base, key));
  },

  currentEditSource: () => workingSource(get()),

  importSource: (source) => commitCandidate(get, set, source),

  revertMap: async () => {
    const mapId = get().mapId;
    clearOverlay(mapId);
    try {
      const map = await loadShippedMap(mapId);
      set((s) => {
        const editSources = { ...s.editSources };
        delete editSources[mapId];
        const editedMaps = new Set(s.editedMaps);
        editedMaps.delete(mapId);
        const validIds = new Set(map.data.nodes.map((n) => n.id));
        return {
          editSources,
          editedMaps,
          loadedMaps: { ...s.loadedMaps, [mapId]: map },
          selectedId: s.selectedId && validIds.has(s.selectedId) ? s.selectedId : null,
          nodeEditor: null,
          editError: null,
        };
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ editError: message });
      return { ok: false, error: message };
    }
  },
}));

useStore.subscribe((state) => {
  rememberMapState(state);
  writePersistedState(persistedStateFor(state));
});
