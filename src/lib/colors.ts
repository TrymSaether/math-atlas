/**
 * Centralized color system for the mathematical map
 * All colors are defined here for consistency and maintainability
 */

// Base color palette
export const palette = {
  // Accent colors by relation type
  cyan: "#2563eb",
  violet: "#7c3aed",
  gold: "#eab308",
  rose: "#db2777",
  mint: "#16a34a",
  orange: "#f97316",
} as const;

// RGB values for CSS custom properties (used with rgba(var(--c), opacity))
// These must match the hex values above
export const paletteRGB = {
  cyan: "37, 99, 235",
  violet: "124, 58, 237",
  gold: "234, 179, 8",
  rose: "219, 39, 119",
  mint: "22, 163, 74",
  orange: "249, 115, 22",
} as const;

// Semantic colors for node kinds
export const nodeKindColors = {
  definition: palette.cyan,
  theorem: palette.violet,
  lemma: palette.mint,
  example: palette.gold,
  proposition: palette.rose,
  corollary: palette.orange,
} as const;

// RGB values for node kinds (matching CSS custom properties)
export const nodeKindColorsRGB = {
  definition: paletteRGB.cyan,
  theorem: paletteRGB.violet,
  lemma: paletteRGB.mint,
  example: paletteRGB.gold,
  proposition: paletteRGB.rose,
  corollary: paletteRGB.orange,
} as const;

// Semantic colors for relation types
export const relationColors = {
  statement: palette.cyan,
  proof: palette.violet,
  illustration: palette.gold,
} as const;

// UI background colors
export const bg = {
  base: "var(--app-bg)",
  surface: "var(--surface)",
  surface2: "var(--surface-strong)",
  surface3: "var(--surface-soft)",
  surface4: "var(--surface-hover)",
  surface5: "var(--field)",
} as const;

// UI border/grid colors
export const ui = {
  grid: "var(--canvas-grid)",
  ring: "rgba(var(--primary-rgb), 0.12)",
  gridAlpha: 0.06,
  ringAlpha: 0.12,
  primaryAlpha: 0.06,
  primaryRGB: [120, 140, 255],
} as const;

// Stroke/border colors
export const stroke = {
  primary: "var(--border)",
  primaryHover: "var(--text)",
  secondary: "rgba(var(--primary-rgb), 0.2)",
  tertiary: "rgba(var(--primary-rgb), 0.15)",
} as const;

// Canvas/graph specific colors
export const canvas = {
  background: "var(--minimap-bg)",
  maskBackground: "var(--minimap-mask)",
  maskStroke: "var(--minimap-stroke)",
  gridBackground: "var(--canvas-grid)",
  scrollbarThumb: "rgba(120, 140, 255, 0.25)",
} as const;

// Text colors
export const text = {
  primary: "#cbd5ff",
  secondary: "#0a0d18", // for light mode
  light: "#f5f6fb",
} as const;

// Glow effects (shadows with color)
export const glows = {
  primary: "0 0 40px -10px rgba(124,160,255,0.55)",
  cyan: "0 0 30px -6px rgba(92,225,255,0.6)",
  violet: "0 0 30px -6px rgba(167,139,255,0.6)",
} as const;

/**
 * Convert hex color to RGB values for use in rgba() CSS function
 * @example hexToRgb("#5ce1ff") => [92, 225, 255]
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Convert hex color to RGB string for use in CSS custom properties
 * @example hexToRgbString("#5ce1ff") => "92, 225, 255"
 */
export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Generate an rgba color string from hex and opacity
 * @example rgbaFromHex("#5ce1ff", 0.5) => "rgba(92, 225, 255, 0.5)"
 */
export function rgbaFromHex(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get CSS custom property for a color using CSS custom property syntax
 * Used in inline styles to reference Tailwind-managed colors
 * @example getCSSVar("c") => "rgba(var(--c),1)"
 * @example getCSSVar("c", 0.5) => "rgba(var(--c),0.5)"
 */
export function getCSSVar(varName: string, opacity: number = 1): string {
  return `rgba(var(--${varName}),${opacity})`;
}
