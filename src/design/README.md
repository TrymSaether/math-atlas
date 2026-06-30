# Design system

The rebuilt frontend foundation. One token vocabulary, one glass primitive, one
styling mechanism — enforced by structure, not convention. This replaces the
sprawl in `src/styles/` (being deleted surface-by-surface; see the rebuild plan).

## Principles

1. **Tokens are the only source of truth.** Every visual decision resolves to a
   CSS variable in `tokens.css`. No magic numbers, no hex literals in components.
2. **One way to style.** Tailwind utilities for layout/spacing/type; the
   `<Surface>` primitive for glass; tokens for everything themeable. No inline
   `style` for visual decisions, no per-component stylesheets except a primitive's
   own colocated CSS (like `surface.css`).
3. **Self-contained.** Nothing here references the legacy `src/styles/*` layer, so
   the old layer can be deleted wholesale without touching this directory.

## Token layers (`tokens.css`)

```
:root              raw semantic values        — the values you tune
@theme inline      semantics → Tailwind        — bg-primary resolves to var(--primary)
@theme             static scales (type, font, radius) that generate utilities
```

This is the Tailwind v4 + shadcn convention. `bg-background`, `text-muted-foreground`,
`border-border`, `rounded-lg`, `text-title-2` etc. all flow from here.

## Glass

`<Surface material="…">` is the single liquid-glass primitive. Material tiers and
their intended surfaces (from the ratified visual bar):

| material     | use                                   |
| ------------ | ------------------------------------- |
| `ultrathin`  | tooltips, transient HUD               |
| `thin`       | sidebars                              |
| `regular`    | toolbars, control panels              |
| `thick`      | command palette, dialogs/sheets       |
| `chrome`     | graph nodes (near-solid, not glass)   |

- `reactive` makes the specular highlight follow the pointer (cheap, all browsers).
- `GlassFilter` + `supportsDisplacement()` add Apple's refraction on **Chromium
  only**, for one or two hero surfaces — never across the canvas.

## Motion

`spring` presets (`snappy` / `smooth` / `gentle`), `easing`, and `duration` in
`motion.ts` are the only spring config. Pair with `motion/react`. The CSS mirror
lives in `tokens.css` (`--ease-apple`, `--duration-*`).

## Structure

```
design/
  tokens.css            canonical token layer (imported by src/index.css)
  motion.ts             spring / easing / duration presets
  primitives/
    surface.tsx + .css  the glass primitive
    glass-filter.tsx    Chromium-only displacement enhancement
    supports.ts         feature detection
  index.ts              public barrel — import from "@/design"

components/ui/          shadcn primitives (Button, Dialog, Popover, Tooltip,
                        Slider, ToggleGroup, Command) — owned code, themed by tokens
```

## Conventions

- Import design primitives from `@/design`; shadcn primitives from `@/components/ui`.
- Add shadcn primitives with `npx shadcn@latest add <name>` — they pick up the
  tokens automatically.
- **Icons:** shadcn primitives use `lucide-react` for internal affordances (dialog
  close, command search). App iconography currently uses `@phosphor-icons/react`.
  Consolidating to one set is an open decision.
- **Strangler rule:** the legacy `src/styles/*` imports in `src/index.css` are
  delete-only. Never add to them; never reference their tokens from new code.
