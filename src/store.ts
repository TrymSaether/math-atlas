import { create } from "zustand";
import { DEFAULT_MAP_ID, isMapId, type MapId } from "./data/mapRegistry";

export type ViewMode = "dependency" | "cluster";
export type HighlightMode = "immediate" | "full";
export type SearchScope = "all" | "title";

function currentParams() {
  return new URLSearchParams(window.location.search);
}

function readInitialMapId(): MapId {
  const value = currentParams().get("map");
  return isMapId(value) ? value : DEFAULT_MAP_ID;
}

function readInitialNodeId(): string | null {
  return currentParams().get("node");
}

function setUrlParam(key: string, value: string | null) {
  const params = currentParams();
  if (value) params.set(key, value);
  else params.delete(key);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

interface State {
  mapId: MapId;
  setMapId: (id: MapId) => void;

  view: ViewMode;
  setView: (v: ViewMode) => void;

  search: string;
  setSearch: (s: string) => void;
  searchScope: SearchScope;
  setSearchScope: (s: SearchScope) => void;

  kinds: Set<string>;
  toggleKind: (k: string) => void;
  resetKinds: () => void;

  topics: Set<string>;
  toggleTopic: (t: string) => void;
  resetTopics: () => void;

  relations: Set<string>;
  toggleRelation: (r: string) => void;
  resetRelations: () => void;

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
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

export const useStore = create<State>((set) => ({
  mapId: readInitialMapId(),
  setMapId: (mapId) => {
    setUrlParam("map", mapId);
    setUrlParam("node", null);
    set({
      mapId,
      selectedId: null,
      pathTargetId: null,
      search: "",
      kinds: new Set(),
      topics: new Set(),
      relations: new Set(),
    });
  },

  view: "dependency",
  setView: (v) => set({ view: v }),

  search: "",
  setSearch: (s) => set({ search: s }),
  searchScope: "all",
  setSearchScope: (s) => set({ searchScope: s }),

  kinds: new Set(),
  toggleKind: (k) => set((s) => ({ kinds: toggle(s.kinds, k) })),
  resetKinds: () => set({ kinds: new Set() }),

  topics: new Set(),
  toggleTopic: (t) => set((s) => ({ topics: toggle(s.topics, t) })),
  resetTopics: () => set({ topics: new Set() }),

  relations: new Set(),
  toggleRelation: (r) => set((s) => ({ relations: toggle(s.relations, r) })),
  resetRelations: () => set({ relations: new Set() }),

  selectedId: readInitialNodeId(),
  select: (id) => {
    setUrlParam("node", id);
    set({ selectedId: id });
  },

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
