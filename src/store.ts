import { create } from "zustand";
import { DEFAULT_MAP_ID, loadMap, type LoadedMap, type MapId } from "./data";
import type { NodeKind, Relation } from "./types";

export type SearchScope = "all" | "title";
export type Theme = "light" | "dark";
export type ViewMode = "dependency" | "cluster";
export type EdgeStyle = "smooth" | "straight" | "bezier";

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

  view: ViewMode;
  setView: (v: ViewMode) => void;
  /** Exercises are practice, not concept structure — hidden from the map by default. */
  showExercises: boolean;
  toggleExercises: () => void;
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

  selectedId: string | null;
  select: (id: string | null) => void;

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
  setView: (v) => set({ view: v }),
  showExercises: false,
  toggleExercises: () => set((s) => ({ showExercises: !s.showExercises })),
  showSoftDeps: false,
  toggleSoftDeps: () => set((s) => ({ showSoftDeps: !s.showSoftDeps })),
  edgeStyle: "smooth",
  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  focusDepth: 1,
  setFocusDepth: (d) => set({ focusDepth: Math.min(3, Math.max(1, d)) }),

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  paletteOpen: false,
  setPaletteOpen: (o) => set({ paletteOpen: o }),
}));
