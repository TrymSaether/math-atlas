import { create } from "zustand";
import { DEFAULT_MAP_ID, loadMap, type LoadedMap, type MapId } from "./data";
import type { NodeKind, Relation } from "./types";

export type ViewMode = "dependency" | "cluster";
export type HighlightMode = "immediate" | "full";
export type SearchScope = "all" | "title";

interface State {
  mapId: MapId;
  setMap: (mapId: MapId) => void;
  loadedMaps: Partial<Record<MapId, LoadedMap>>;
  loadingMapId: MapId | null;
  mapError: string | null;
  ensureMapLoaded: (mapId?: MapId) => Promise<void>;

  view: ViewMode;
  setView: (v: ViewMode) => void;

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

  highlight: HighlightMode;
  setHighlight: (h: HighlightMode) => void;

  showOrphans: boolean;
  setShowOrphans: (v: boolean) => void;

  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;

  pathTargetId: string | null;
  setPathTarget: (id: string | null) => void;

  panelCollapsed: boolean;
  setPanelCollapsed: (v: boolean) => void;
}

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v); else next.add(v);
  return next;
}

export const useStore = create<State>((set, get) => ({
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
          pathTargetId: null,
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
      pathTargetId: null,
    });
    void get().ensureMapLoaded(mapId);
  },

  view: "dependency",
  setView: (v) => set({ view: v }),

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

  highlight: "immediate",
  setHighlight: (h) => set({ highlight: h }),

  showOrphans: false,
  setShowOrphans: (v) => set({ showOrphans: v }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),

  pathTargetId: null,
  setPathTarget: (id) => set({ pathTargetId: id }),

  panelCollapsed: false,
  setPanelCollapsed: (v) => set({ panelCollapsed: v }),
}));
