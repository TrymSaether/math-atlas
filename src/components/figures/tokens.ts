/**
 * Shared color vocabulary for the interactive (Mafs/SVG) figures.
 *
 * Every figure draws from this single set of theme tokens instead of spelling
 * out `var(--…, #hex)` inline, so the diagrams stay consistent with each other
 * and re-theme correctly. The CSS custom properties are always defined in
 * `index.css` for every theme, so no literal hex fallbacks are needed here.
 *
 * Semantics (kept stable across figures):
 *   accent   — the domain side / forward map / primary interactive object (blue)
 *   codomain — the codomain side / inverse / the "other" paired object (teal)
 *   alert    — collisions, missed targets, emphasis (red)
 *   ink      — strong neutral strokes (set borders, neutral arrows)
 *   text     — point and element labels
 *   faint    — captions and secondary annotation
 *   muted    — axes, guides, and inactive / dropped elements
 *   fillX/fillY — the two set fills (domain / codomain)
 */
export const DIA = {
  ink: "var(--dia-ink)",
  text: "var(--fg-2)",
  faint: "var(--fg-3)",
  muted: "var(--fg-4)",
  accent: "var(--accent)",
  codomain: "var(--dia-acc2)",
  alert: "var(--dia-boundary)",
  fillX: "var(--dia-fill)",
  fillY: "var(--dia-fill2)",
} as const;
