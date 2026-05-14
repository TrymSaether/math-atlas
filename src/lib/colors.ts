/** Centralized Math Atlas color tokens. Light mode is canonical; dark mode keeps the same semantic palette. */
export const atlasColors = {
  primary: "#2563eb",
  primaryDark: "#60a5fa",
  foundations: "#2563eb",
  continuity: "#16a34a",
  connectedness: "#7c3aed",
  fundamentalGroup: "#dc2626",
  coveringSpaces: "#0d9488",
  compactness: "#f97316",
  homotopy: "#db2777",
  examples: "#eab308",
  slate: "#64748b",
} as const;

export const palette = {
  cyan: atlasColors.foundations,
  blue: atlasColors.foundations,
  violet: atlasColors.connectedness,
  gold: atlasColors.examples,
  rose: atlasColors.homotopy,
  red: atlasColors.fundamentalGroup,
  mint: atlasColors.continuity,
  teal: atlasColors.coveringSpaces,
  orange: atlasColors.compactness,
  slate: atlasColors.slate,
} as const;

export const paletteRGB = {
  cyan: "37, 99, 235",
  blue: "37, 99, 235",
  violet: "124, 58, 237",
  gold: "234, 179, 8",
  rose: "219, 39, 119",
  red: "220, 38, 38",
  mint: "22, 163, 74",
  teal: "13, 148, 136",
  orange: "249, 115, 22",
  slate: "100, 116, 139",
} as const;

export const nodeKindColors = {
  definition: palette.blue,
  theorem: palette.violet,
  lemma: palette.mint,
  example: palette.gold,
  proposition: palette.rose,
  corollary: palette.orange,
  structure: palette.blue,
  object: palette.violet,
  property: palette.mint,
  construction: palette.teal,
  notation: palette.gold,
  counterexample: palette.red,
  non_example: palette.red,
  assumption: palette.rose,
  proof: palette.orange,
  proof_step: palette.orange,
  proof_method: palette.orange,
  axiom: palette.blue,
  application: palette.teal,
} as const;

export const relationColors = {
  statement: palette.blue,
  proof: palette.violet,
  illustration: palette.gold,
  defines: palette.blue,
  defined_by: palette.blue,
  requires: palette.violet,
  uses: palette.violet,
  proves: palette.violet,
  implies: palette.violet,
  has_example: palette.gold,
  has_counterexample: palette.red,
  equivalent_to: palette.teal,
  generalizes: palette.mint,
  specializes: palette.mint,
  prerequisite_for: palette.orange,
} as const;

export const bg = {
  base: "var(--background)",
  surface: "var(--surface)",
  surface2: "var(--surface-raised)",
  surface3: "var(--surface-muted)",
  surface4: "var(--field-hover)",
  surface5: "var(--field)",
} as const;

export const ui = {
  grid: "var(--canvas-grid)",
  ring: "rgba(var(--primary-rgb), 0.12)",
  gridAlpha: 0.06,
  ringAlpha: 0.12,
  primaryAlpha: 0.06,
  primaryRGB: [37, 99, 235],
} as const;

export const stroke = {
  primary: "var(--border)",
  primaryHover: "var(--text)",
  secondary: "rgba(var(--primary-rgb), 0.2)",
  tertiary: "rgba(var(--primary-rgb), 0.15)",
} as const;

export const canvas = {
  background: "var(--minimap-bg)",
  maskBackground: "var(--minimap-mask)",
  maskStroke: "var(--minimap-stroke)",
  gridBackground: "var(--canvas-grid)",
  scrollbarThumb: "rgba(var(--primary-rgb), 0.25)",
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function rgbaFromHex(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getCSSVar(varName: string, opacity = 1): string {
  return `rgba(var(--${varName}),${opacity})`;
}
