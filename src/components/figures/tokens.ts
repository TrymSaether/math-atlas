/**
 * Single source of truth for the look of every interactive figure.
 *
 * Figures describe mathematics; this module decides how that mathematics is
 * painted — colors, stroke weights, dot sizes, and label sizes — so the whole
 * set reads as one coherent visual family and re-themes correctly. Components
 * should never spell out a raw `var(--…)` or a magic weight/radius inline; pull
 * from here instead.
 *
 * The CSS custom properties are defined by the design-system token layers, so
 * no literal hex fallbacks are needed.
 *
 * Color semantics (kept stable across the whole figure family):
 *   accent   — the primary object: the function under study, the partial sum,
 *              the domain side, the forward map (blue)
 *   codomain — the paired / dual object: the codomain side, the inverse, the
 *              Fourier partner, a second width (teal)
 *   alert    — something wrong or extremal: a collision, a missed target, a
 *              negative lobe, the measured value (red)
 *   ok       — a converged / satisfied state (green)
 *   ref      — the faint reference an object is compared against (gray)
 *   ink      — strong neutral strokes: set borders, neutral arrows
 *   text     — element and axis labels
 *   muted    — axes, gridlines, guides, and inactive / dropped elements
 *   fillX/fillY — the two set fills (domain / codomain)
 */
export const DIA = {
  surface: "var(--figure-bg)",
  frame: "var(--dia-space)",
  border: "var(--figure-border)",
  ink: "var(--dia-ink)",
  text: "var(--muted-foreground)",
  ref: "var(--plot-reference)",
  faint: "var(--plot-grid-strong)",
  muted: "var(--muted-foreground)",
  axis: "var(--figure-axis)",
  grid: "var(--figure-guide)",
  band: "var(--plot-band)",
  accent: "var(--plot-accent)",
  codomain: "var(--plot-2)",
  alert: "var(--plot-negative)",
  warning: "var(--plot-warning)",
  ok: "var(--plot-positive)",
  neutral: "var(--plot-neutral)",
  fillX: "var(--dia-fill)",
  fillY: "var(--dia-fill2)",
} as const;

/** Categorical plot colors for multi-series figures. */
export const SERIES = [
  "var(--plot-1)",
  "var(--plot-2)",
  "var(--plot-3)",
  "var(--plot-4)",
  "var(--plot-5)",
  "var(--plot-6)",
  "var(--plot-7)",
  "var(--plot-8)",
  "var(--plot-9)",
  "var(--plot-10)",
  "var(--plot-11)",
  "var(--plot-12)",
] as const;

/** Continuous palette stops for heatmaps, density, and magnitude plots. */
export const HEAT = {
  cold: "var(--heat-cold)",
  cool: "var(--heat-cool)",
  mid: "var(--heat-mid)",
  warm: "var(--heat-warm)",
  hot: "var(--heat-hot)",
} as const;

/** Shared figure-frame dimensions and radii. */
export const FIGURE = {
  height: 180,
  compactHeight: 150,
  radius: "var(--radius-md)",
  panelRadius: "var(--radius-lg)",
} as const;

/** Stroke weights, in Mafs line units. */
export const STROKE = {
  curve: 2.1, // the primary curve / object under study
  ref: 1.6, // a reference or secondary curve
  mark: 1.4, // annotation vectors and arrows
  guide: 1, // axes, gridlines, dropped guides
  hair: 0.9, // inactive / de-emphasized strokes
} as const;

/** Point radii, in SVG pixels (passed to `svgCircleProps.r`). */
export const DOT = {
  hub: 4.2, // an emphasized / selected element
  base: 3.6, // an ordinary element
  small: 3, // a de-emphasized / missed element
  sample: 2.7, // a sample dot in a dense series
} as const;

/** Label sizes, in Mafs `<Text size>` units. */
export const FONT = {
  label: 12, // set / axis names (X, Y, f)
  tick: 10, // element labels and marker tags
  hint: 9, // small inline notes
} as const;

/** UI copy colors for figure captions and inline controls. */
export const UI = {
  text: "var(--muted-foreground)",
  muted: "var(--muted-foreground)",
  subtle: "var(--muted-foreground)",
  onColor: "var(--primary-foreground)",
  onColorSoft: "color-mix(in srgb, var(--primary-foreground) 28%, transparent)",
  border: "var(--figure-border)",
  surface: "var(--figure-bg)",
  sunken: "var(--surface-sunken)",
  focusRing: "var(--ring)",
  panel: "var(--figure-panel)",
} as const;

/** A translucent panel backing for labels floating over a figure. */
export const PANEL_BACKING = "var(--figure-label-bg)";
