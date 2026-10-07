import { create } from "zustand";
import { DEFAULT_MAP_ID, isMapId, loadMap, type LoadedMap, type MapId } from "./data";
import { applyTheme, readStoredTheme, schemeFor } from "./lib/themes";
import { defaultVisibleKinds } from "./lib/nodeCategory";
import type { NodeKind, Relation } from "./types";

export type SearchScope = "all" | "title";
export type ViewMode = "dependency" | "cluster";
export type EdgeStyle = "smooth" | "straight" | "bezier";
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
  focusMode?: boolean;
  focusDepth?: number;
  showGrid?: boolean;
  showRegions?: boolean;
  showMinimap?: boolean;
  surface?: Surface;
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

  /** Route planner: trace a dependency path between two concepts. */
  routeMode: boolean;
  routeFrom: string | null;
  routeTo: string | null;
  /** Bumped to replay the traversal animation. */
  routeRunKey: number;
  /** Enter/cancel route planning (clears any in-progress pick). */
  toggleRouteMode: () => void;
  /** Click handler while planning: picks start, then destination. */
  pickRoutePoint: (id: string) => void;
  clearRoute: () => void;
  replayRoute: () => void;

  surface: Surface;
  setSurface: (s: Surface) => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;
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

function isSurface(value: unknown): value is Surface {
  return value === "atlas" || value === "dictionary" || value === "flashcards" || value === "sandbox";
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
    focusMode: asBoolean(value.focusMode),
    focusDepth: normalizedFocusDepth(value.focusDepth),
    showGrid: asBoolean(value.showGrid),
    showRegions: asBoolean(value.showRegions),
    showMinimap: asBoolean(value.showMinimap),
    surface: isSurface(value.surface) ? value.surface : undefined,
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
    focusMode: state.focusMode,
    focusDepth: state.focusDepth,
    showGrid: state.showGrid,
    showRegions: state.showRegions,
    showMinimap: state.showMinimap,
    surface: state.surface,
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
  const selectedId = saved?.selectedId && validNodeIds.has(saved.selectedId) ? saved.selectedId : null;
  const routeFrom = saved?.routeFrom && validNodeIds.has(saved.routeFrom) ? saved.routeFrom : null;
  const routeTo = saved?.routeTo && validNodeIds.has(saved.routeTo) ? saved.routeTo : null;

  return {
    search: saved?.search ?? "",
    kinds: setFromPersisted(saved?.kinds, map.kinds, defaultVisibleKinds(map.kinds)),
    topics: setFromPersisted(saved?.topics, map.data.domains.map((domain) => domain.id), []),
    relations: setFromPersisted(saved?.relations, map.relations, map.relations),
    selectedId,
    routeMode: false,
    routeFrom,
    routeTo,
  };
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
            loadingMapId:
              state.loadingMapId === mapId ? null : state.loadingMapId,
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
  edgeStyle: persistedState?.edgeStyle ?? (persistedState?.view === "cluster" ? "bezier" : "smooth"),
  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),
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

  routeMode: false,
  routeFrom: null,
  routeTo: null,
  routeRunKey: 0,
  toggleRouteMode: () =>
    set((s) =>
      s.routeMode
        ? { routeMode: false, routeFrom: null, routeTo: null }
        : { routeMode: true, routeFrom: null, routeTo: null },
    ),
  pickRoutePoint: (id) =>
    set((s) => {
      if (!s.routeFrom) return { routeFrom: id, routeTo: null };
      if (id === s.routeFrom) return {};
      return { routeTo: id, routeMode: false, routeRunKey: s.routeRunKey + 1 };
    }),
  clearRoute: () => set({ routeMode: false, routeFrom: null, routeTo: null }),
  replayRoute: () => set((s) => ({ routeRunKey: s.routeRunKey + 1 })),

  surface: persistedState?.surface ?? "atlas",
  setSurface: (surface) => set({ surface }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),
}));

useStore.subscribe((state) => {
  rememberMapState(state);
  writePersistedState(persistedStateFor(state));
});
