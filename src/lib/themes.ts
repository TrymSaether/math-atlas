/**
 * Theme registry shared by the atlas app and the dictionary page. Both surfaces
 * write the chosen theme id to `data-theme` on <html> and persist it under the
 * same localStorage key, so a theme picked on one page carries to the other.
 *
 * Each theme id has a matching `:root[data-theme="<id>"]` token block in
 * `src/index.css` (atlas) and `src/topology-dictionary/styles.css` (dictionary).
 */

export type ColorScheme = "light" | "dark";

export interface ThemeDef {
  id: string;
  label: string;
  scheme: ColorScheme;
  /** Tiny preview swatch for the picker: [surface, ink, accent]. */
  swatch: [string, string, string];
}

export const THEMES: ThemeDef[] = [
  { id: "paper", label: "Paper", scheme: "light", swatch: ["#FFFFFF", "#0F172A", "#2563EB"] },
  { id: "chalkboard", label: "Chalkboard", scheme: "dark", swatch: ["#161D2F", "#ECEEF4", "#58C4DD"] },
  { id: "manuscript", label: "Manuscript", scheme: "light", swatch: ["#FBF8F1", "#211D18", "#A8431D"] },
  { id: "nocturne", label: "Nocturne", scheme: "dark", swatch: ["#1F1C16", "#ECE4D4", "#E08A4F"] },
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
