# Design system

How the UI layer is organized after the consolidation. Read this before adding a
token, a control, or a floating surface.

## Layer ownership (foundation → primitives → composites → feature UI)

| Layer                  | Owns                                                                                                           | Lives in                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Theme**              | Raw hues, surfaces, ink, borders per theme; derived tones; typography ramp; radius scale; motion; chrome roles | `src/index.css`                 |
| **Foundation**         | Structural scales that are _not_ color: elevation (shadow) and z-index (stacking order)                        | `src/styles/foundation.css`     |
| **Semantic color**     | Surface/status/palette/plot/figure roles derived from theme hues                                               | `src/styles/tokens.css`         |
| **Tailwind bridge**    | Exposes tokens as `--color-*` / `--text-*` utilities                                                           | `src/styles/tailwind-theme.css` |
| **Material**           | The Liquid Glass surfaces (`.glass*`)                                                                          | `src/styles/glass.css`          |
| **Shell**              | The floating control layer: geometry tokens + `.shell-*` rules                                                 | `src/styles/shell.css`          |
| **Global resets**      | Element defaults, focus ring, selection                                                                        | `src/styles/base.css`           |
| **Primitives (React)** | Behavior + ARIA for controls, mapped to `.shell-*` / `.glass-*`                                                | `src/components/primitives/`    |
| **Feature UI**         | Panels, dialogs, the graph canvas                                                                              | `src/components/**`             |

The rule: a layer may consume tokens/classes from the layers above it, never
redefine them. Geometry has **one** owner (shell.css); elevation and z-index have
**one** owner (foundation.css). If you find yourself re-declaring a `--shell-*`
token or a shadow outside these files, that's the smell the consolidation removed.

## The scales

- **Elevation** — `--shadow-e0…e5` (foundation.css). Parameterized by a single
  `--elevation-ink` channel; the dark theme retunes the whole ramp by overriding
  that one value. Pick an `e`-step; never hand-roll an rgba shadow. Legacy names
  (`--shadow-1/2/3`, `--chrome-shadow*`, `--glass-shadow-*`) are aliases onto this
  ramp.
- **Z-index** — `--z-below / background / canvas / shell / shell-raised / popover
/ banner / modal` (foundation.css). Use these instead of raw integers so the
  stacking story stays legible.
- **Radius** — `--radius-xs…2xl` + `--radius-pill` (index.css). Shell radii alias
  these; don't introduce off-scale px radii.
- **Control geometry** — `--shell-control-h`, `--shell-icon-size`,
  `--shell-island-pad`, `--shell-gap-*` (shell.css). Every island/control derives
  its size from these.

## Light / dark

One mechanism: `themes.ts` sets `data-theme` (palette identity) **and** toggles
`:root.dark` (color scheme). All scheme-level overrides key off `:root.dark`. The
`[data-theme="chalkboard"]` selectors remain only as paired fallbacks. To add a
second dark theme, put its hues under its own `[data-theme]` block and let the
shared `:root.dark` rules handle the scheme — don't copy scheme overrides.

## Adding a control

Use a primitive from `src/components/primitives` (`ShellButton`,
`ShellIconButton`, `ShellSegmented`, `ShellSwitch`, `ShellChip`,
`ShellPanelHeader`, `Glass`, `GlassControlGroup`). If a new variant is needed, add
it to the primitive + its `.shell-*` rule — not as a one-off `className` at the
call site. The interactive figures keep their own `figures/SegmentedControl`
(KaTeX-labelled, figure token vocabulary) on purpose; it is not the shell control.
