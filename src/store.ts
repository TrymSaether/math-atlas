import { create } from "zustand";
import { DEFAULT_MAP_ID, loadMap, type LoadedMap, type MapId } from "./data";
import type { NodeKind, Relation } from "./types";

export type SearchScope = "all" | "title";
export type Theme = "light" | "dark";
export type LayoutMode = "overview" | "dependency" | "cluster";
export type HighlightMode = "immediate" | "full";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") return attr;
  return "light";
}

interface State {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

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

  selectedId: string | null;
  select: (id: string | null) => void;

  layoutMode: LayoutMode;
  setLayoutMode: (m: LayoutMode) => void;
  focusDomainId: string | null;
  expandCluster: (domainId: string) => void;
  collapseToOverview: () => void;

  highlight: HighlightMode;
  setHighlight: (h: HighlightMode) => void;
  showOrphans: boolean;
  setShowOrphans: (v: boolean) => void;

  focusMode: boolean;
  toggleFocusMode: () => void;
  focusDepth: number;
  setFocusDepth: (d: number) => void;

  hiddenTopics: Set<string>;
  toggleTopicVisibility: (t: string) => void;
  showAllTopics: () => void;

  routeFrom: string | null;
  routeTo: string | null;
  setRouteFrom: (id: string | null) => void;
  setRouteTo: (id: string | null) => void;
  routePlanned: boolean;
  routeNonce: number;
  planRoute: () => void;
  resetRoute: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;
}

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v); else next.add(v);
  return next;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("math-map-theme", theme);
  } catch {
    /* ignore */
  }
}

export const useStore = create<State>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

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
            loadingMapId: state.loadingMapId === mapId ? null : state.loadingMapId,
          };
        }

        return {
          loadedMaps,
          loadingMapId: null,
          mapError: null,
          kinds: new Set(map.kinds),
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
      kinds: map ? new Set(map.kinds) : new Set(),
      topics: new Set(),
      relations: map ? new Set(map.relations) : new Set(),
      selectedId: null,
      layoutMode: "overview",
      focusDomainId: null,
      focusMode: false,
      hiddenTopics: new Set(),
      routeFrom: null,
      routeTo: null,
      routePlanned: false,
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

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  layoutMode: "overview",
  setLayoutMode: (layoutMode) => set({ layoutMode, focusDomainId: layoutMode === "overview" ? null : get().focusDomainId }),
  focusDomainId: null,
  expandCluster: (domainId) => set({ layoutMode: "dependency", focusDomainId: domainId, selectedId: null }),
  collapseToOverview: () => set({ layoutMode: "overview", focusDomainId: null, selectedId: null }),

  highlight: "immediate",
  setHighlight: (highlight) => set({ highlight }),
  showOrphans: false,
  setShowOrphans: (showOrphans) => set({ showOrphans }),

  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  focusDepth: 1,
  setFocusDepth: (focusDepth) => set({ focusDepth }),

  hiddenTopics: new Set(),
  toggleTopicVisibility: (topic) => set((s) => ({ hiddenTopics: toggle(s.hiddenTopics, topic) })),
  showAllTopics: () => set({ hiddenTopics: new Set() }),

  routeFrom: null,
  routeTo: null,
  setRouteFrom: (routeFrom) => set({ routeFrom, routePlanned: false }),
  setRouteTo: (routeTo) => set({ routeTo, routePlanned: false }),
  routePlanned: false,
  routeNonce: 0,
  planRoute: () => set((s) => ({ routePlanned: true, routeNonce: s.routeNonce + 1 })),
  resetRoute: () => set({ routeFrom: null, routeTo: null, routePlanned: false }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),
}));
