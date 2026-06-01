import { create } from "zustand";
import { DEFAULT_MAP_ID, loadMap, type LoadedMap, type MapId } from "./data";
import { applyTheme, readStoredTheme, schemeFor } from "./lib/themes";
import { defaultVisibleKinds } from "./lib/nodeCategory";
import type { NodeKind, Relation } from "./types";

export type SearchScope = "all" | "title";
export type ViewMode = "dependency" | "cluster";
export type EdgeStyle = "smooth" | "straight" | "bezier";
/** Which surface is shown: the graph canvas, the dictionary reading view, the flashcard study mode, or the geometric sandbox. */
export type Surface = "atlas" | "dictionary" | "flashcards" | "sandbox";

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
  showNodePanel: boolean;
  toggleNodePanel: () => void;
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

export const useStore = create<State>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (id) => {
    applyTheme(id);
    set({ theme: id });
  },
  scheme: () => schemeFor(get().theme),

  mapId: DEFAULT_MAP_ID,
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
          kinds: new Set(defaultVisibleKinds(map.kinds)),
          topics: new Set(),
          relations: new Set(map.relations),
          selectedId: null,
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
    const map = get().loadedMaps[mapId];
    set({
      mapId,
      search: "",
      kinds: map ? new Set(defaultVisibleKinds(map.kinds)) : new Set(),
      topics: new Set(),
      relations: map ? new Set(map.relations) : new Set(),
      selectedId: null,
      routeMode: false,
      routeFrom: null,
      routeTo: null,
    });
    void get().ensureMapLoaded(mapId);
  },

  search: "",
  setSearch: (s) => set({ search: s }),
  searchScope: "all",
  setSearchScope: (s) => set({ searchScope: s }),

  kinds: new Set(),
  toggleKind: (k) => set((s) => ({ kinds: toggle(s.kinds, k) })),

  topics: new Set(),
  toggleTopic: (t) => set((s) => ({ topics: toggle(s.topics, t) })),
  resetTopics: () => set({ topics: new Set() }),

  relations: new Set(),
  toggleRelation: (r) => set((s) => ({ relations: toggle(s.relations, r) })),

  view: "dependency",
  setView: (view) =>
    set({
      view,
      edgeStyle: view === "cluster" ? "bezier" : "smooth",
    }),
  showSoftDeps: false,
  toggleSoftDeps: () => set((s) => ({ showSoftDeps: !s.showSoftDeps })),
  edgeStyle: "smooth",
  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  focusDepth: 1,
  setFocusDepth: (d) => set({ focusDepth: Math.min(3, Math.max(1, d)) }),

  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  showRegions: true,
  toggleRegions: () => set((s) => ({ showRegions: !s.showRegions })),
  showNodePanel: true,
  toggleNodePanel: () => set((s) => ({ showNodePanel: !s.showNodePanel })),
  showMinimap: true,
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

  surface: "atlas",
  setSurface: (surface) => set({ surface }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),
}));
