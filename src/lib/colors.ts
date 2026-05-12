/**
 * Centralized color system for the topology map.
 *
 * Design direction:
 * - Flat, saturated, high-contrast colors
 * - No glow effects
 * - Dark neutral canvas with crisp borders
 * - Stable semantic mappings for node kinds and relation types
 */

// Base color palette
export const palette = {
  // Vivid semantic accents
  azure: "#00A6FF",
  electricViolet: "#7C3AED",
  amber: "#FFB000",
  coral: "#FF4D6D",
  emerald: "#00C781",
  tangerine: "#FF7A00",
  lime: "#A3E635",
  fuchsia: "#E879F9",
} as const;

// RGB values for CSS custom properties (used with rgba(var(--c), opacity))
// These must match the hex values above.
export const paletteRGB = {
  azure: "0, 166, 255",
  electricViolet: "124, 58, 237",
  amber: "255, 176, 0",
  coral: "255, 77, 109",
  emerald: "0, 199, 129",
  tangerine: "255, 122, 0",
  lime: "163, 230, 53",
  fuchsia: "232, 121, 249",
} as const;

// Semantic colors for node kinds
export const nodeKindColors = {
  definition: palette.azure,
  theorem: palette.electricViolet,
  lemma: palette.emerald,
  example: palette.amber,
  proposition: palette.coral,
  corollary: palette.tangerine,
} as const;

// RGB values for node kinds (matching CSS custom properties)
export const nodeKindColorsRGB = {
  definition: paletteRGB.azure,
  theorem: paletteRGB.electricViolet,
  lemma: paletteRGB.emerald,
  example: paletteRGB.amber,
  proposition: paletteRGB.coral,
  corollary: paletteRGB.tangerine,
} as const;

// Semantic colors for relation types
export const relationColors = {
  statement: palette.azure,
  proof: palette.electricViolet,
  illustration: palette.amber,
} as const;

// UI background colors
export const bg = {
  base: "#0B1020",
  surface: "#111827",
  surface2: "#182235",
  surface3: "#223047",
  surface4: "#2C3A54",
  surface5: "#3A4A66",
} as const;

// UI border/grid colors
export const ui = {
  grid: "rgba(148, 163, 184, 0.12)",
  ring: "rgba(255, 255, 255, 0.18)",
  gridAlpha: 0.12,
  ringAlpha: 0.18,
  primaryAlpha: 0.1,
  primaryRGB: [0, 166, 255],
} as const;

// Stroke/border colors
export const stroke = {
  primary: "rgba(255, 255, 255, 0.24)",
  primaryHover: "#ffffff",
  secondary: "rgba(148, 163, 184, 0.28)",
  tertiary: "rgba(148, 163, 184, 0.18)",
} as const;

// Canvas/graph specific colors
export const canvas = {
  background: "#0F172A",
  maskBackground: "rgba(11, 16, 32, 0.72)",
  maskStroke: "rgba(0, 166, 255, 0.8)",
  gridBackground: "rgba(148, 163, 184, 0.16)",
  scrollbarThumb: "rgba(148, 163, 184, 0.36)",
} as const;

// Text colors
export const text = {
  primary: "#F8FAFC",
  secondary: "#0F172A", // for light mode / text on bright fills
  muted: "#CBD5E1",
  light: "#FFFFFF",
} as const;

// Flat emphasis tokens. Keep this export for compatibility, but intentionally avoid glow.
export const glows = {
  primary: "none",
  cyan: "none",
  violet: "none",
} as const;

/**
 * Convert hex color to RGB values for use in rgba() CSS function.
 * @example hexToRgb("#00A6FF") => [0, 166, 255]
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
 * Convert hex color to RGB string for use in CSS custom properties.
 * @example hexToRgbString("#00A6FF") => "0, 166, 255"
 */
export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Generate an rgba color string from hex and opacity.
 * @example rgbaFromHex("#00A6FF", 0.5) => "rgba(0, 166, 255, 0.5)"
 */
export function rgbaFromHex(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get CSS custom property for a color using CSS custom property syntax.
 * Used in inline styles to reference Tailwind-managed colors.
 * @example getCSSVar("c") => "rgba(var(--c),1)"
 * @example getCSSVar("c", 0.5) => "rgba(var(--c),0.5)"
 */
export function getCSSVar(varName: string, opacity: number = 1): string {
  return `rgba(var(--${varName}),${opacity})`;
}

// Re-export from types for backward compatibility
export { RELATION_COLOR, KIND_LABEL } from "../types";
