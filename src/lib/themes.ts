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

export const THEMES: ThemeDef[] = [
  {
    id: "paper",
    label: "Paper",
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
    label: "Chalkboard",
    scheme: "dark",
    family: "slate",
    preview: {
      bg: "#0E1322",
      surface: "#1F2740",
      ink: "#ECEEF4",
      accent: "#58C4DD",
    },
  },
  {
    id: "3b1b-light",
    label: "3B1B Light",
    scheme: "light",
    family: "3b1b",
    preview: {
      bg: "#F7F3EA",
      surface: "#FFFDF7",
      ink: "#1F2328",
      accent: "#236B8E",
    },
  },
  {
    id: "3b1b-dark",
    label: "3B1B Dark",
    scheme: "dark",
    family: "3b1b",
    preview: {
      bg: "#101214",
      surface: "#1C2227",
      ink: "#F2EFE6",
      accent: "#58C4DD",
    },
  },
  {
    id: "manuscript",
    label: "Manuscript",
    scheme: "light",
    family: "sepia",
    preview: {
      bg: "#F4EFE6",
      surface: "#FBF8F1",
      ink: "#211D18",
      accent: "#A8431D",
    },
  },
  {
    id: "nocturne",
    label: "Nocturne",
    scheme: "dark",
    family: "sepia",
    preview: {
      bg: "#16140F",
      surface: "#2A261E",
      ink: "#ECE4D4",
      accent: "#E08A4F",
    },
  },
  {
    id: "lagoon",
    label: "Lagoon",
    scheme: "light",
    family: "aqua",
    preview: {
      bg: "#EFF6F6",
      surface: "#FFFFFF",
      ink: "#0C2A2E",
      accent: "#0E7C86",
    },
  },
  {
    id: "deepsea",
    label: "Deepsea",
    scheme: "dark",
    family: "aqua",
    preview: {
      bg: "#0A1A1F",
      surface: "#163840",
      ink: "#E4EEF0",
      accent: "#5CD0B3",
    },
  },
  {
    id: "blossom",
    label: "Blossom",
    scheme: "light",
    family: "rose",
    preview: {
      bg: "#FBF1F3",
      surface: "#FFFBFC",
      ink: "#2C1620",
      accent: "#BE2D5A",
    },
  },
  {
    id: "aubergine",
    label: "Aubergine",
    scheme: "dark",
    family: "rose",
    preview: {
      bg: "#18101C",
      surface: "#2F2237",
      ink: "#ECE2F0",
      accent: "#E07AC0",
    },
  },
  {
    id: "prism",
    label: "Prism",
    scheme: "light",
    family: "spectrum",
    preview: {
      bg: "#F7F8FA",
      surface: "#FFFFFF",
      ink: "#14151A",
      accent: "#4F46E5",
    },
  },
  {
    id: "neon",
    label: "Neon",
    scheme: "dark",
    family: "spectrum",
    preview: {
      bg: "#0A0A0E",
      surface: "#1C1C23",
      ink: "#F2F3F7",
      accent: "#22D3EE",
    },
  },
  {
    id: "lemma",
    label: "Lemma",
    scheme: "light",
    family: "lemma",
    preview: {
      bg: "#F4EFE0",
      surface: "#FFFDF8",
      ink: "#1A1814",
      accent: "#C2410C",
    },
  },
  {
    id: "lemma-dark",
    label: "Lemma Dark",
    scheme: "dark",
    family: "lemma",
    preview: {
      bg: "#15130F",
      surface: "#1C1A15",
      ink: "#F0EAD8",
      accent: "#E26B30",
    },
  },
  {
    id: "journal",
    label: "Journal",
    scheme: "light",
    family: "academic",
    preview: {
      bg: "#FBFAF7",
      surface: "#FFFFFF",
      ink: "#1C1B18",
      accent: "#1F3A5F",
    },
  },
  {
    id: "seminar",
    label: "Seminar",
    scheme: "dark",
    family: "academic",
    preview: {
      bg: "#1A1815",
      surface: "#2C2A25",
      ink: "#ECEAE3",
      accent: "#7FA8DC",
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
  const sib = THEMES.find(
    (t) => t.family === theme.family && t.scheme !== theme.scheme,
  );
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
