# Design system

The frontend foundation. One token vocabulary, one glass primitive, one styling
mechanism — enforced by structure, not convention. The legacy `src/styles/` layer
(≈19 stylesheets, 4 competing token systems) has been **fully removed**; this
directory plus `src/index.css` is now the entire styling layer.

## Principles

1. **Tokens are the only source of truth.** Every visual decision resolves to a
   CSS variable in `tokens.css`. No magic numbers, no hex literals in components.
2. **One way to style.** Tailwind utilities for layout/spacing/type; the
   `<Surface>` primitive for glass; tokens for everything themeable. No inline
   `style` for visual decisions, and no per-component stylesheets. The only
   global stylesheets are the four in this directory — `tokens.css` (tokens),
   `base.css` (resets + shared utilities), `vendor.css` (third-party/web-component
   theming Tailwind can't reach), and `figures.css` (the figure/diagram token
   contract) — plus a primitive's own colocated CSS (like `surface.css`).
3. **Light + dark.** `tokens.css` ships both schemes; `applyTheme()` sets
   `data-theme` / the `.dark` class on `<html>`. Every derived value flips with
   the scheme, so surfaces need no per-theme branching.

## Token layers (`tokens.css`)

```
:root              raw semantic values        — the values you tune
@theme inline      semantics → Tailwind        — bg-primary resolves to var(--primary)
@theme             static scales (type, font, radius) that generate utilities
```

This is the Tailwind v4 + shadcn convention. `bg-background`, `text-muted-foreground`,
`border-border`, `rounded-lg`, `text-title-2` etc. all flow from here.

## Materials

`<Surface material="…">` is the shared material primitive. Prefer semantic
materials for application structure and optical tiers for small transient layers:

| material    | use                                      |
| ----------- | ---------------------------------------- |
| `content`   | page and workspace backgrounds           |
| `toolbar`   | unified application toolbar               |
| `sidebar`   | composed navigation sidebars              |
| `inspector` | concept and object inspectors              |
| `popover`   | menus, pickers, and transient panels       |
| `ultrathin` | tooltips and transient HUD                 |
| `thin`      | lightweight compatibility surfaces        |
| `regular`   | floating control panels                    |
| `thick`     | dialogs and sheets                         |
| `chrome`    | graph nodes (near-solid, not translucent)  |

- `reactive` makes the specular highlight follow the pointer (cheap, all browsers).
- `GlassFilter` + `supportsDisplacement()` add Apple's refraction on **Chromium
  only**, for one or two hero surfaces — never across the canvas.

## Controls

- `Button` implements primary, bordered, tinted, plain, borderless, and
  destructive families in mini, small, regular, and large sizes. Compatibility
  aliases remain available while callers migrate.
- `SegmentedControl` implements standard, toolbar, and capsule appearances in
  every size, including disabled controls and disabled options.
- `SearchField` and `SearchTrigger` implement toolbar, sidebar, and content
  appearances in small, regular, and large sizes.

## Motion

`spring` presets (`snappy` / `smooth` / `gentle`), `easing`, and `duration` in
`motion.ts` are the only spring config. Pair with `motion/react`. The CSS mirror
lives in `tokens.css` (`--ease-apple`, `--duration-*`).

## Structure

```
design/
  tokens.css            canonical token layer, light + dark (imported first)
  base.css              global resets, focus, ::selection, shared utilities
  vendor.css            MathLive / Mafs / @xyflow / global vendor theming
  figures.css           figure + diagram token contract & SVG asset classes
  motion.ts             spring / easing / duration presets
  primitives/
    surface.tsx + .css  the glass primitive
    panel.tsx + .css    docked Surface for the shell's side columns
    glass-filter.tsx    Chromium-only displacement enhancement
    supports.ts         feature detection
  index.ts              public barrel — import from "@/design"

ui/                     generic primitives (Button, Dialog, Slider,
                        ToggleGroup, Command, …) — owned code, themed by tokens
```

## Conventions

- Import design primitives from `@/design`; shadcn primitives from `@/ui`.
- Add shadcn primitives with `npx shadcn@latest add <name>` — they pick up the
  tokens automatically.
- **Icons:** `lucide-react` only, everywhere (phosphor is fully removed).
- **No legacy layer:** `src/styles/*` is gone. There is no `--fg-*` / `--surface` /
  `--accent` / `text-body`-style legacy vocabulary — use the shadcn semantic tokens
  (`--foreground`, `--card`, `--primary`, `bg-muted`, …) and the scales in `tokens.css`.
