import { create } from "zustand";
import { DEFAULT_MAP_ID, isMapId, type MapId } from "./data/mapRegistry";
import { loadPerMap, savePerMap } from "./lib/persist";

export type AppView = "atlas" | "workspace";
export type LayoutMode = "overview" | "dependency" | "cluster";
export type HighlightMode = "immediate" | "full";
export type SearchScope = "all" | "title";
export type LearningState = "learned" | "in-progress" | "not-started" | "locked";
export type RailSection = "explore" | "plan" | "filter" | "progress";

const LEARNING_CYCLE: LearningState[] = ["not-started", "in-progress", "learned", "locked"];

export interface SavedPath {
  id: string;
  title: string;
  fromId: string;
  toId: string;
  nodeIds: string[];
  createdAt: number;
}

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

function readInitialAppView(): AppView {
  const v = currentParams().get("view");
  return v === "workspace" ? "workspace" : "atlas";
}

function readInitialLayoutMode(): LayoutMode {
  const v = currentParams().get("layout");
  if (v === "dependency" || v === "cluster" || v === "overview") return v;
  return "overview";
}

function readInitialFocusDomain(): string | null {
  return currentParams().get("domain");
}

function setUrlParam(key: string, value: string | null) {
  const params = currentParams();
  if (value) params.set(key, value);
  else params.delete(key);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

interface PerMapState {
  learningStates: Record<string, LearningState>;
  notes: Record<string, string>;
  savedPaths: SavedPath[];
  hiddenTopics: string[];
}

function readPerMap(mapId: MapId): PerMapState {
  return {
    learningStates: loadPerMap<Record<string, LearningState>>(mapId, "learningStates", {}),
    notes: loadPerMap<Record<string, string>>(mapId, "notes", {}),
    savedPaths: loadPerMap<SavedPath[]>(mapId, "savedPaths", []),
    hiddenTopics: loadPerMap<string[]>(mapId, "hiddenTopics", []),
  };
}

interface State {
  /* -------- Top-level navigation -------- */
  appView: AppView;
  setAppView: (v: AppView) => void;
  openMap: (id: MapId) => void;
  goToAtlas: () => void;

  mapId: MapId;
  setMapId: (id: MapId) => void;

  /* -------- Graph layout -------- */
  layoutMode: LayoutMode;
  setLayoutMode: (m: LayoutMode) => void;
  focusDomainId: string | null;
  expandCluster: (domainId: string) => void;
  collapseToOverview: () => void;

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

  /* -------- Focus mode -------- */
  focusMode: boolean;
  toggleFocusMode: () => void;
  focusDepth: number;
  setFocusDepth: (d: number) => void;

  /* -------- Route planner -------- */
  routeFrom: string | null;
  routeTo: string | null;
  setRouteFrom: (id: string | null) => void;
  setRouteTo: (id: string | null) => void;
  routePlanned: boolean;
  routeNonce: number;
  planRoute: () => void;
  resetRoute: () => void;

  /* -------- Legend (topic visibility) -------- */
  hiddenTopics: Set<string>;
  toggleTopicVisibility: (t: string) => void;
  showAllTopics: () => void;

  /* -------- Rail (left-side panel) -------- */
  railSection: RailSection | null;
  setRailSection: (s: RailSection | null) => void;
  toggleRailSection: (s: RailSection) => void;

  /* -------- Learning state (persisted per map) -------- */
  learningStates: Record<string, LearningState>;
  setLearningState: (id: string, state: LearningState) => void;
  cycleLearningState: (id: string) => void;

  /* -------- Notes (persisted per map) -------- */
  notes: Record<string, string>;
  setNote: (id: string, text: string) => void;

  /* -------- Saved paths (persisted per map) -------- */
  savedPaths: SavedPath[];
  addSavedPath: (path: Omit<SavedPath, "id" | "createdAt">) => void;
  removeSavedPath: (id: string) => void;
}

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

const initialMapId = readInitialMapId();
const initialPerMap = readPerMap(initialMapId);

export const useStore = create<State>((set, get) => ({
  appView: readInitialAppView(),
  setAppView: (v) => {
    setUrlParam("view", v);
    if (v === "atlas") {
      setUrlParam("node", null);
      setUrlParam("domain", null);
      setUrlParam("layout", null);
    }
    set({ appView: v });
  },
  openMap: (id) => {
    setUrlParam("view", "workspace");
    setUrlParam("map", id);
    setUrlParam("node", null);
    setUrlParam("domain", null);
    setUrlParam("layout", "overview");
    const perMap = readPerMap(id);
    set({
      appView: "workspace",
      mapId: id,
      layoutMode: "overview",
      focusDomainId: null,
      selectedId: null,
      pathTargetId: null,
      search: "",
      kinds: new Set(),
      topics: new Set(),
      relations: new Set(),
      routeFrom: null,
      routeTo: null,
      routePlanned: false,
      focusMode: false,
      railSection: null,
      learningStates: perMap.learningStates,
      notes: perMap.notes,
      savedPaths: perMap.savedPaths,
      hiddenTopics: new Set(perMap.hiddenTopics),
    });
  },
  goToAtlas: () => {
    setUrlParam("view", "atlas");
    setUrlParam("node", null);
    setUrlParam("domain", null);
    setUrlParam("layout", null);
    set({ appView: "atlas", selectedId: null, railSection: null });
  },

  mapId: initialMapId,
  setMapId: (mapId) => {
    setUrlParam("map", mapId);
    setUrlParam("node", null);
    setUrlParam("domain", null);
    const perMap = readPerMap(mapId);
    set({
      mapId,
      layoutMode: "overview",
      focusDomainId: null,
      selectedId: null,
      pathTargetId: null,
      search: "",
      kinds: new Set(),
      topics: new Set(),
      relations: new Set(),
      routeFrom: null,
      routeTo: null,
      routePlanned: false,
      focusMode: false,
      learningStates: perMap.learningStates,
      notes: perMap.notes,
      savedPaths: perMap.savedPaths,
      hiddenTopics: new Set(perMap.hiddenTopics),
    });
  },

  layoutMode: readInitialLayoutMode(),
  setLayoutMode: (m) => {
    setUrlParam("layout", m);
    set({ layoutMode: m });
  },
  focusDomainId: readInitialFocusDomain(),
  expandCluster: (domainId) => {
    setUrlParam("layout", "dependency");
    setUrlParam("domain", domainId);
    set({ layoutMode: "dependency", focusDomainId: domainId });
  },
  collapseToOverview: () => {
    setUrlParam("layout", "overview");
    setUrlParam("domain", null);
    set({ layoutMode: "overview", focusDomainId: null });
  },

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

  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  focusDepth: 1,
  setFocusDepth: (d) => set({ focusDepth: d }),

  routeFrom: null,
  routeTo: null,
  setRouteFrom: (id) => set({ routeFrom: id, routePlanned: false }),
  setRouteTo: (id) => set({ routeTo: id, routePlanned: false }),
  routePlanned: false,
  routeNonce: 0,
  planRoute: () => set((s) => ({ routePlanned: true, routeNonce: s.routeNonce + 1 })),
  resetRoute: () => set({ routePlanned: false }),

  hiddenTopics: new Set(initialPerMap.hiddenTopics),
  toggleTopicVisibility: (t) =>
    set((s) => {
      const next = toggle(s.hiddenTopics, t);
      savePerMap(s.mapId, "hiddenTopics", [...next]);
      return { hiddenTopics: next };
    }),
  showAllTopics: () =>
    set((s) => {
      savePerMap(s.mapId, "hiddenTopics", []);
      return { hiddenTopics: new Set<string>() };
    }),

  railSection: null,
  setRailSection: (s) => set({ railSection: s }),
  toggleRailSection: (section) =>
    set((s) => ({ railSection: s.railSection === section ? null : section })),

  learningStates: initialPerMap.learningStates,
  setLearningState: (id, state) =>
    set((s) => {
      const next = { ...s.learningStates, [id]: state };
      savePerMap(s.mapId, "learningStates", next);
      return { learningStates: next };
    }),
  cycleLearningState: (id) => {
    const cur = get().learningStates[id] ?? "not-started";
    const idx = LEARNING_CYCLE.indexOf(cur);
    get().setLearningState(id, LEARNING_CYCLE[(idx + 1) % LEARNING_CYCLE.length]);
  },

  notes: initialPerMap.notes,
  setNote: (id, text) =>
    set((s) => {
      const next = { ...s.notes };
      if (text.trim()) next[id] = text;
      else delete next[id];
      savePerMap(s.mapId, "notes", next);
      return { notes: next };
    }),

  savedPaths: initialPerMap.savedPaths,
  addSavedPath: (path) =>
    set((s) => {
      const entry: SavedPath = { ...path, id: `path-${Date.now()}`, createdAt: Date.now() };
      const next = [entry, ...s.savedPaths];
      savePerMap(s.mapId, "savedPaths", next);
      return { savedPaths: next };
    }),
  removeSavedPath: (id) =>
    set((s) => {
      const next = s.savedPaths.filter((p) => p.id !== id);
      savePerMap(s.mapId, "savedPaths", next);
      return { savedPaths: next };
    }),
}));
