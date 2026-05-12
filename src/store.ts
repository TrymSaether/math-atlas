import { create } from "zustand";
import type { NodeKind, Relation } from "./types";
import { DEFAULT_SELECTED_ID } from "./atlas";
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_THEME_ID,
  isColorMode,
  isThemeId,
  type ColorMode,
  type ThemeId,
} from "./themes";

export type ViewMode = "dependency" | "cluster";
export type HighlightMode = "immediate" | "full";
export type SearchScope = "all" | "title";

interface State {
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

  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ALL_KINDS: NodeKind[] = ["definition", "theorem", "lemma", "example", "proposition", "corollary"];
const ALL_RELATIONS: Relation[] = ["statement", "proof", "illustration"];
const THEME_STORAGE_KEY = "topology-map.theme";
const COLOR_MODE_STORAGE_KEY = "topology-map.color-mode";

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v); else next.add(v);
  return next;
}

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

function readStoredColorMode(): ColorMode {
  if (typeof window === "undefined") return DEFAULT_COLOR_MODE;
  const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  return isColorMode(value) ? value : DEFAULT_COLOR_MODE;
}

function persistTheme(themeId: ThemeId) {
  if (typeof window !== "undefined") window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

function persistColorMode(colorMode: ColorMode) {
  if (typeof window !== "undefined") window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
}

export const useStore = create<State>((set) => ({
  view: "dependency",
  setView: (v) => set({ view: v }),

  search: "",
  setSearch: (s) => set({ search: s }),
  searchScope: "all",
  setSearchScope: (s) => set({ searchScope: s }),

  kinds: new Set(ALL_KINDS),
  toggleKind: (k) => set((s) => ({ kinds: toggle(s.kinds, k) })),

  topics: new Set(),
  toggleTopic: (t) => set((s) => ({ topics: toggle(s.topics, t) })),
  resetTopics: () => set({ topics: new Set() }),

  relations: new Set(ALL_RELATIONS),
  toggleRelation: (r) => set((s) => ({ relations: toggle(s.relations, r) })),

  selectedId: DEFAULT_SELECTED_ID,
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

  themeId: readStoredTheme(),
  setThemeId: (themeId) => {
    persistTheme(themeId);
    set({ themeId });
  },
  colorMode: readStoredColorMode(),
  setColorMode: (colorMode) => {
    persistColorMode(colorMode);
    set({ colorMode });
  },
  toggleColorMode: () =>
    set((s) => {
      const colorMode = s.colorMode === "light" ? "dark" : "light";
      persistColorMode(colorMode);
      return { colorMode };
    }),
}));
