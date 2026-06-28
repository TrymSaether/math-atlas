# Style architecture

`src/index.css` is the only application stylesheet entry point. Its imports are
ordered by dependency; files lower in the manifest may consume tokens from
files above them but should not redefine those tokens.

## Layers

- `theme.css` — literal light/dark values and the complete `--domain-*` hue set.
- `foundation.css` — scheme-independent type, radius, motion, elevation, and
  z-index scales.
- `tokens.css` — semantic product, state, canvas, plot, and chrome roles.
- `diagram-tokens.css` — the stable `--dia-*` contract consumed by SVG assets.
- `tailwind-theme.css` — a bridge from existing tokens to generated utilities;
  it must not introduce new visual decisions.
- `base.css` and `utilities.css` — document defaults and opt-in global helpers.
- `glass.css` and `shell.css` — shared material and application-shell systems.
- `components/` — feature-owned styles; `vendor/` — third-party integration
  overrides.

## Conventions

1. Components use semantic roles (`--success`, `--surface-hover`) rather than
   domain hues or literals.
2. Authored domain identity uses `--domain-{name}`. Derived tint and border
   colors are composed with `color-mix()` where needed; do not add hue ladders.
3. Categorical figures use `--palette-{n}` or `--plot-{n}` so their ordering is
   independent of named domain colors.
4. Component-only tokens use a component prefix such as `--shell-*` or
   `--glass-*` and live beside the component styles that own them.
5. Do not add a later override block to normalize earlier rules. Change the
   owning declaration, or introduce an explicit state/modifier selector.
6. New elevation and layer values must extend the scales in `foundation.css`;
   raw app-level `box-shadow` and `z-index` values are not part of the API.
