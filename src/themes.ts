import type { NodeKind, Relation } from "./types";

export type ThemeId = "academic" | "metro";
export type ColorMode = "light" | "dark";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
}

export interface LanePalette {
  fill: string;
  border: string;
  label: string;
}

export interface ThemePalette {
  kindColors: Record<NodeKind, string>;
  routeColors: Record<Relation, string>;
  lanes: LanePalette[];
  miniMapMask: string;
  miniMapBackground: string;
  miniMapBorder: string;
}

export const DEFAULT_THEME_ID: ThemeId = "academic";
export const DEFAULT_COLOR_MODE: ColorMode = "light";

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "academic",
    label: "Academic",
    description: "Warm paper, serif details, and low-contrast study-map colors.",
  },
  {
    id: "metro",
    label: "Metro",
    description: "Vibrant transit-map colors inspired by the visual mockup.",
  },
];

export const COLOR_MODE_OPTIONS: { id: ColorMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const THEME_IDS = THEME_OPTIONS.map((theme) => theme.id) as ThemeId[];
export const COLOR_MODES = COLOR_MODE_OPTIONS.map((mode) => mode.id) as ColorMode[];

const academicLight: ThemePalette = {
  kindColors: {
    definition: "#2F5D8C",
    theorem: "#8A3B3B",
    lemma: "#47715D",
    example: "#9A6B16",
    proposition: "#7A4E7A",
    corollary: "#A05A2C",
  },
  routeColors: {
    statement: "#006BA6",
    proof: "#7A4D98",
    illustration: "#D97904",
  },
  lanes: [
    { fill: "rgba(26, 115, 232, 0.07)", border: "rgba(26, 115, 232, 0.44)", label: "rgba(26, 70, 135, 0.42)" },
    { fill: "rgba(15, 157, 88, 0.07)", border: "rgba(15, 157, 88, 0.44)", label: "rgba(23, 96, 62, 0.42)" },
    { fill: "rgba(251, 140, 0, 0.075)", border: "rgba(251, 140, 0, 0.46)", label: "rgba(143, 83, 13, 0.44)" },
    { fill: "rgba(126, 87, 194, 0.07)", border: "rgba(126, 87, 194, 0.44)", label: "rgba(83, 58, 136, 0.42)" },
    { fill: "rgba(219, 68, 55, 0.07)", border: "rgba(219, 68, 55, 0.44)", label: "rgba(132, 54, 46, 0.42)" },
    { fill: "rgba(0, 172, 193, 0.07)", border: "rgba(0, 172, 193, 0.44)", label: "rgba(18, 103, 115, 0.42)" },
    { fill: "rgba(121, 85, 72, 0.07)", border: "rgba(121, 85, 72, 0.44)", label: "rgba(90, 65, 56, 0.42)" },
  ],
  miniMapMask: "rgba(255,253,246,0.55)",
  miniMapBackground: "rgba(255,253,246,0.85)",
  miniMapBorder: "1px solid rgba(74,62,45,0.10)",
};

const academicDark: ThemePalette = {
  kindColors: {
    definition: "#7AB7FF",
    theorem: "#F08C8C",
    lemma: "#8ED7B2",
    example: "#F2C56B",
    proposition: "#D3A5E8",
    corollary: "#F3A66D",
  },
  routeColors: {
    statement: "#55B9FF",
    proof: "#C69DFF",
    illustration: "#FFB65C",
  },
  lanes: [
    { fill: "rgba(85, 185, 255, 0.06)", border: "rgba(85, 185, 255, 0.30)", label: "rgba(171, 213, 255, 0.32)" },
    { fill: "rgba(142, 215, 178, 0.055)", border: "rgba(142, 215, 178, 0.30)", label: "rgba(179, 232, 203, 0.30)" },
    { fill: "rgba(255, 182, 92, 0.06)", border: "rgba(255, 182, 92, 0.32)", label: "rgba(247, 213, 159, 0.32)" },
    { fill: "rgba(198, 157, 255, 0.06)", border: "rgba(198, 157, 255, 0.30)", label: "rgba(218, 197, 255, 0.32)" },
    { fill: "rgba(240, 140, 140, 0.055)", border: "rgba(240, 140, 140, 0.30)", label: "rgba(252, 190, 190, 0.32)" },
    { fill: "rgba(88, 214, 226, 0.055)", border: "rgba(88, 214, 226, 0.30)", label: "rgba(166, 234, 240, 0.30)" },
    { fill: "rgba(199, 184, 160, 0.05)", border: "rgba(199, 184, 160, 0.24)", label: "rgba(221, 209, 189, 0.28)" },
  ],
  miniMapMask: "rgba(13,18,27,0.62)",
  miniMapBackground: "rgba(14,21,31,0.90)",
  miniMapBorder: "1px solid rgba(230,220,200,0.12)",
};

const metroLight: ThemePalette = {
  kindColors: {
    definition: "#2563EB",
    theorem: "#EF4444",
    lemma: "#22C55E",
    example: "#F97316",
    proposition: "#A855F7",
    corollary: "#14B8A6",
  },
  routeColors: {
    statement: "#2563EB",
    proof: "#A855F7",
    illustration: "#F97316",
  },
  lanes: [
    { fill: "rgba(37, 99, 235, 0.065)", border: "rgba(37, 99, 235, 0.42)", label: "rgba(29, 78, 216, 0.38)" },
    { fill: "rgba(34, 197, 94, 0.065)", border: "rgba(34, 197, 94, 0.42)", label: "rgba(21, 128, 61, 0.38)" },
    { fill: "rgba(249, 115, 22, 0.07)", border: "rgba(249, 115, 22, 0.44)", label: "rgba(194, 65, 12, 0.40)" },
    { fill: "rgba(168, 85, 247, 0.065)", border: "rgba(168, 85, 247, 0.42)", label: "rgba(126, 34, 206, 0.38)" },
    { fill: "rgba(236, 72, 153, 0.065)", border: "rgba(236, 72, 153, 0.42)", label: "rgba(190, 24, 93, 0.38)" },
    { fill: "rgba(20, 184, 166, 0.065)", border: "rgba(20, 184, 166, 0.42)", label: "rgba(15, 118, 110, 0.38)" },
    { fill: "rgba(100, 116, 139, 0.055)", border: "rgba(100, 116, 139, 0.36)", label: "rgba(51, 65, 85, 0.34)" },
  ],
  miniMapMask: "rgba(248,250,252,0.60)",
  miniMapBackground: "rgba(255,255,255,0.90)",
  miniMapBorder: "1px solid rgba(37, 99, 235, 0.16)",
};

const metroDark: ThemePalette = {
  kindColors: {
    definition: "#3B82F6",
    theorem: "#F87171",
    lemma: "#84CC16",
    example: "#FB923C",
    proposition: "#C084FC",
    corollary: "#2DD4BF",
  },
  routeColors: {
    statement: "#3B82F6",
    proof: "#C084FC",
    illustration: "#FB923C",
  },
  lanes: [
    { fill: "rgba(59, 130, 246, 0.07)", border: "rgba(59, 130, 246, 0.38)", label: "rgba(147, 197, 253, 0.34)" },
    { fill: "rgba(132, 204, 22, 0.065)", border: "rgba(132, 204, 22, 0.38)", label: "rgba(190, 242, 100, 0.34)" },
    { fill: "rgba(251, 146, 60, 0.07)", border: "rgba(251, 146, 60, 0.40)", label: "rgba(253, 186, 116, 0.34)" },
    { fill: "rgba(192, 132, 252, 0.07)", border: "rgba(192, 132, 252, 0.38)", label: "rgba(216, 180, 254, 0.34)" },
    { fill: "rgba(244, 114, 182, 0.065)", border: "rgba(244, 114, 182, 0.38)", label: "rgba(249, 168, 212, 0.34)" },
    { fill: "rgba(45, 212, 191, 0.065)", border: "rgba(45, 212, 191, 0.38)", label: "rgba(153, 246, 228, 0.32)" },
    { fill: "rgba(148, 163, 184, 0.055)", border: "rgba(148, 163, 184, 0.28)", label: "rgba(203, 213, 225, 0.28)" },
  ],
  miniMapMask: "rgba(2,6,23,0.68)",
  miniMapBackground: "rgba(8,13,27,0.92)",
  miniMapBorder: "1px solid rgba(96, 165, 250, 0.18)",
};

export const THEME_PALETTES: Record<ThemeId, Record<ColorMode, ThemePalette>> = {
  academic: {
    light: academicLight,
    dark: academicDark,
  },
  metro: {
    light: metroLight,
    dark: metroDark,
  },
};

export function isThemeId(value: string | null): value is ThemeId {
  return value === "academic" || value === "metro";
}

export function isColorMode(value: string | null): value is ColorMode {
  return value === "light" || value === "dark";
}

export function getThemePalette(themeId: ThemeId, colorMode: ColorMode): ThemePalette {
  return THEME_PALETTES[themeId][colorMode];
}
