import { create } from "zustand";
import { DEFAULT_MAP_ID, isMapId, type CatalogEntry, type LoadedMap, type MapId } from "@/maps";
import { mapService, type MapMeta } from "@/maps/service";
import { applyTheme, readStoredTheme, schemeFor } from "./themes";
import { defaultVisibleKinds } from "@shared/maps/nodeCategory";
import type { NodeKind, Relation } from "@/maps/types";
import { createAtlasSlice, type AtlasSlice } from "@/atlas/state";
import { createAuthoringSlice, type AuthoringSlice } from "@/authoring/state";
import {
  PERSISTED_STATE_VERSION,
  normalizePersistedState,
  readPersistedState,
  writePersistedState,
  type PersistedMapState,
  type PersistedState,
} from "./storage";
import { createMapWorkflowSlice, type MapWorkflowSlice, type RestoredMapState } from "@/maps/state";
import { createProgressSlice, type ProgressSlice } from "@/progress/state";

export type SearchScope = "all" | "title";
export type ViewMode = "dependency" | "cluster";
export type EdgeStyle = "smooth" | "straight" | "bezier";
/** How edge relationship labels read on hover/selection. */
export type EdgeLabelStyle = "prose" | "terse";
/** Which surface is shown: the graph canvas, reading/study tools, or sandbox. */
export type Surface = "atlas" | "dictionary" | "flashcards" | "sandbox";
export interface State extends MapWorkflowSlice, ProgressSlice, AtlasSlice, AuthoringSlice {
  /** Active theme id (see app/themes.ts). */
  theme: string;
  setTheme: (id: string) => void;
  /** Light/dark of the active theme — drives scheme-dependent UI. */
  scheme: () => "light" | "dark";

  mapId: MapId;
  loadedMaps: Partial<Record<MapId, LoadedMap>>;
  loadingMapId: MapId | null;
  mapError: string | null;

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
  /** Recently selected concept ids for the active map, most-recent first. */
  recents: string[];
  /** Clear the active map's recents list. */
  clearRecents: () => void;

  surface: Surface;
  setSurface: (s: Surface) => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;

  /* ---- Account / sync ---------------------------------------------- */
  /* ---- Account / catalog -------------------------------------------- */
  /** Signed-in user id, or null. */
  userId: string | null;
  setUserId: (id: string | null) => void;
  /** Maps the caller can open (one entry per slug; best access wins). */
  catalog: CatalogEntry[];
  /** Per-slug map entity meta (id / role / saved version), set when a map loads. */
  mapMeta: Partial<Record<MapId, MapMeta>>;
  /** Active map changed on the server (conflict or a collaborator's save). */
  staleMap: MapId | null;
}

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function isSurface(value: unknown): value is Surface {
  return value === "atlas" || value === "dictionary" || value === "flashcards" || value === "sandbox";
}

/** Cap on the active map's remembered recents list. */
const RECENTS_LIMIT = 15;

const persistedState = normalizePersistedState(readPersistedState());
const persistedMaps: Partial<Record<MapId, PersistedMapState>> = {
  ...(persistedState?.maps ?? {}),
};

/**
 * Deep link: URL query params (?map=&node=&view=) take precedence over persisted
 * state on first load, so a shared link opens the exact map / concept / surface
 * it encodes. The node is injected into the per-map state so it survives the
 * map-load reset in `mapStateForLoadedMap` (which validates it against the map).
 */
function readUrlState(): { mapId?: MapId; node?: string; surface?: Surface } {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const map = p.get("map");
  const node = p.get("node");
  const view = p.get("view");
  return {
    mapId: map && isMapId(map) ? map : undefined,
    node: node || undefined,
    surface: isSurface(view) ? view : undefined,
  };
}
const urlState = readUrlState();
const initialMapId: MapId = urlState.mapId ?? persistedState?.mapId ?? DEFAULT_MAP_ID;
const initialSurface: Surface = urlState.surface ?? persistedState?.surface ?? "atlas";
if (urlState.node) {
  persistedMaps[initialMapId] = { ...(persistedMaps[initialMapId] ?? {}), selectedId: urlState.node };
}

function rememberMapState(state: State): void {
  if (!state.loadedMaps[state.mapId]) return;
  persistedMaps[state.mapId] = {
    search: state.search,
    kinds: [...state.kinds],
    topics: [...state.topics],
    relations: [...state.relations],
    selectedId: state.selectedId,
    recents: [...state.recents],
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
    mode: state.mode,
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

function mapStateForLoadedMap(map: LoadedMap, saved: PersistedMapState | undefined): RestoredMapState {
  const validNodeIds = new Set(map.data.nodes.map((node) => node.id));
  const selectedId = saved?.selectedId && validNodeIds.has(saved.selectedId) ? saved.selectedId : null;
  const recents = (saved?.recents ?? []).filter((id) => validNodeIds.has(id));

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
    recents,
    // Routes are transient exploration state — never restored, so the map opens
    // on the fit-all overview rather than a highlighted cone.
    routeMode: false,
    routeFrom: null,
    routeTo: null,
  };
}

export const useStore = create<State>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (id) => {
    applyTheme(id);
    set({ theme: id });
  },
  scheme: () => schemeFor(get().theme),

  mapId: initialMapId,
  loadedMaps: {},
  loadingMapId: null,
  mapError: null,

  search: persistedMaps[initialMapId]?.search ?? "",
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
  edgeStyle: persistedState?.edgeStyle ?? (persistedState?.view === "cluster" ? "bezier" : "smooth"),
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
  select: (id) =>
    set((s) => ({
      selectedId: id,
      recents: id ? [id, ...s.recents.filter((r) => r !== id)].slice(0, RECENTS_LIMIT) : s.recents,
    })),
  recents: [],
  clearRecents: () => set({ recents: [] }),

  surface: initialSurface,
  setSurface: (surface) => set({ surface }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),

  userId: null,
  setUserId: (id) => set({ userId: id }),

  catalog: mapService.cachedCatalog() ?? [],
  mapMeta: {},
  staleMap: null,

  ...createAtlasSlice(set, {
    routeKind: persistedState?.routeKind ?? "prereq",
    routeIncludeProof: persistedState?.routeIncludeProof ?? false,
    mode: persistedState?.mode ?? "explore",
  }),
  ...createAuthoringSlice(set, get),
  ...createProgressSlice(set, get),
  ...createMapWorkflowSlice(set, get, {
    persistedMaps,
    rememberMapState,
    mapStateForLoadedMap,
  }),
}));

useStore.subscribe((state) => {
  rememberMapState(state);
  writePersistedState(persistedStateFor(state));
});
