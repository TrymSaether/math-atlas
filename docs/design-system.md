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
- **Materials** — `ultraThin / thin / regular / thick / ultraThick`. Menu bars
  use ultra-thin, docks and navigation use regular, focused cards use thick,
  and blocking dialogs use ultra-thick. Every level has translucent and solid
  accessibility fallbacks.
- **Control geometry** — shared controls expose macOS size variants rather than
  one-off dimensions: buttons use `mini / small / regular / large`; segmented
  controls use `small / regular / large`; sliders use `small / regular`.

## Light / dark

One mechanism: `themes.ts` sets `data-theme` (palette identity) **and** toggles
`:root.dark` (color scheme). All scheme-level overrides key off `:root.dark`. The
`[data-theme="chalkboard"]` selectors remain only as paired fallbacks. To add a
second dark theme, put its hues under its own `[data-theme]` block and let the
shared `:root.dark` rules handle the scheme — don't copy scheme overrides.

## Adding a control

Use a primitive from `src/components/primitives` (`ShellButton`,
`ShellIconButton`, `ShellSegmented`, `ShellSwitch`, `ShellChip`,
`ShellSlider`, `ShellPanelHeader`, `Glass`, `GlassControlGroup`). Buttons support
`borderless / standard / preferred / tinted / toggle / destructive`; select the
semantic variant instead of composing fills at the call site. Figure sliders and
KaTeX-labelled segmented controls wrap the same primitives, so focus, sizing,
track rendering, and selected states stay consistent across the product.
