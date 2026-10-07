/**
 * Theme registry shared by the atlas app and the dictionary page. Both surfaces
 * write the chosen theme id to `data-theme` on <html> and persist it under the
 * same localStorage key, so a theme picked on one page carries to the other.
 */

export type ColorScheme = "light" | "dark";

export interface ThemePreview {
  bg: string;
  surface: string;
  ink: string;
  accent: string;
}

export interface ThemeDef {
  id: string;
  label: string;
  scheme: ColorScheme;
  /** Themes pair up by family; the scheme toggle flips between siblings. */
  family: string;
  /** Real colors for the picker thumbnail. */
  preview: ThemePreview;
}

/**
 * The signature pair. The redesign ships one Apple-grade Light + Dark theme
 * (plus the system-follow toggle in the UI); the prototype's other palettes are
 * retired. Ids stay `paper`/`chalkboard` so persisted prefs and the existing
 * `[data-theme]` CSS blocks keep resolving; only the labels change.
 */
export const THEMES: ThemeDef[] = [
  {
    id: "paper",
    label: "Light",
    scheme: "light",
    family: "slate",
    preview: {
      bg: "#F8FAFC",
      surface: "#FFFFFF",
      ink: "#0F172A",
      accent: "#2563EB",
    },
  },
  {
    id: "chalkboard",
    label: "Dark",
    scheme: "dark",
    family: "slate",
    preview: {
      bg: "#0E1322",
      surface: "#1F2740",
      ink: "#ECEEF4",
      accent: "#58C4DD",
    },
  },
];

export const DEFAULT_THEME_ID = "paper";
export const THEME_STORAGE_KEY = "math-map-theme";

const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function resolveThemeId(value: string | null | undefined): string {
  if (value && THEME_BY_ID.has(value)) return value;
  // Back-compat: the old store persisted bare "light"/"dark".
  if (value === "light") return "paper";
  if (value === "dark") return "chalkboard";
  return DEFAULT_THEME_ID;
}

export function schemeFor(themeId: string): ColorScheme {
  return THEME_BY_ID.get(themeId)?.scheme ?? "light";
}

/**
 * The opposite-scheme theme in the same family (Paper↔Chalkboard,
 * Manuscript↔Nocturne). Used by the quick light/dark toggle so flipping the
 * scheme keeps the chosen palette family.
 */
export function siblingOf(themeId: string): string {
  const theme = THEME_BY_ID.get(themeId);
  if (!theme) return DEFAULT_THEME_ID;
  const sib = THEMES.find((t) => t.family === theme.family && t.scheme !== theme.scheme);
  return sib?.id ?? themeId;
}

/** Read the persisted theme id (falling back to the default). */
export function readStoredTheme(): string {
  if (typeof document === "undefined") return DEFAULT_THEME_ID;
  const attr = document.documentElement.dataset.theme;
  if (attr && THEME_BY_ID.has(attr)) return attr;
  try {
    return resolveThemeId(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_ID;
  }
}

/** Apply a theme id to the document and persist it. */
export function applyTheme(themeId: string): void {
  if (typeof document === "undefined") return;
  const id = resolveThemeId(themeId);
  document.documentElement.dataset.theme = id;
  document.documentElement.classList.toggle("dark", schemeFor(id) === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* ignore private-mode / quota failures */
  }
}
