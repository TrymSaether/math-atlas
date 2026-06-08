/**
 * Single source of truth for the look of every interactive figure.
 *
 * Figures describe mathematics; this module decides how that mathematics is
 * painted — colors, stroke weights, dot sizes, and label sizes — so the whole
 * set reads as one coherent visual family and re-themes correctly. Components
 * should never spell out a raw `var(--…)` or a magic weight/radius inline; pull
 * from here instead.
 *
 * The CSS custom properties are always defined for every theme in `index.css`,
 * so no literal hex fallbacks are needed.
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
  ink: "var(--dia-ink)",
  text: "var(--fg-2)",
  ref: "var(--fg-3)",
  faint: "var(--fg-3)",
  muted: "var(--fg-4)",
  accent: "var(--accent)",
  codomain: "var(--dia-acc2)",
  alert: "var(--dia-boundary)",
  ok: "var(--green)",
  fillX: "var(--dia-fill)",
  fillY: "var(--dia-fill2)",
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

/** A translucent panel backing for labels floating over a figure. */
export const PANEL_BACKING = "color-mix(in srgb, var(--surface) 78%, transparent)";
