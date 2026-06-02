# Handoff: review, recommend & implement visual assets from the design bundles

You are picking up a **visual-asset pass** for **Math Atlas**, a React + ReactFlow
knowledge-graph app at `/Users/saether/onedrive_new/10_projects/math-atlas`.
Your job: **review** the assets in the three Claude Design bundles, **recommend** which
are worth carrying into the app, get the user's sign-off, then **implement** the agreed
ones and verify them. Scope is *visual assets and style* — SVGs, brand marks, icons,
favicons, decorative graphics, and (only if the user explicitly opts in) typography.

Read `CLAUDE.md` and the project memory at
`~/.claude/projects/-Users-saether-onedrive-new-10-projects-math-atlas/memory/design-direction-bundle-b.md`
before doing anything — they encode decisions you must not silently override.

> **Scope note.** This doc is *static visual assets only*. The graph's **visual language**
> (node states, hover cards, edge crossing-halos, domain-region headers, theorem environments) lives
> in the companion brief `docs/design-graph-content-handoff.md`. Non-asset design tracks
> (foundational tokens, content/voice, marketing/OG surfaces) are out of scope for both.

---

## Hard constraints (do not violate without re-asking the user)

The user already chose a direction. Honor it:

1. **Direction = bundle b ("Math Atlas"), keep the current brand.** Bundle c ("Lemma") is a
   *different brand* (different name, fonts, vermilion accent) — treat it as inspiration only,
   never apply its wordmark/name/fonts.
2. **Do not swap fonts** unless the user explicitly asks. Current stack is intentional:
   `IBM Plex Sans` (UI) · `Newsreader` (serif/display) · `IBM Plex Mono` (code) · `STIX Two Text`
   (math), loaded in `index.html` and tokenized in `src/index.css` (`--font-sans/serif/mono/math`).
   Bundle b proposed DM Serif Display + Inter; bundle c proposed Source Serif 4 + Geist. Both are
   declined for now.
3. **Color is reserved for domains.** Do NOT introduce bundle b's per-*kind* colors or per-*edge-
   relation* colors. Node kind is shown via glyph + rail texture; edges are monochrome. Keep it.
4. **Theme through tokens.** The app has 12 themes (6 families × light/dark). Every asset you add
   must theme correctly: prefer inline SVG with `stroke`/`fill="currentColor"` or `var(--…)` tokens
   (`--fg-1`, `--accent`, domain vars `--blue/--green/…` via `src/lib/colors.ts`). Never hardcode
   bundle hex (e.g. `#0E0F14`, `#2563EB`) — it will break in 11 of 12 themes.
5. **UI icons stay Lucide** (`lucide-react`), already a dependency. Don't replace the working UI
   icon set. Carry over *custom* marks Lucide lacks (brand/domain glyphs), not generic UI icons.

---

## Getting the bundles

The three bundles may still be extracted at `/tmp/design_bundles/{a,b,c}/`. If that path is gone
(it's `/tmp`, so assume it may be), re-fetch and extract them — they are gzipped tarballs:

```bash
cd /tmp && rm -rf design_bundles && mkdir -p design_bundles/{a,b,c}
curl -sL "https://api.anthropic.com/v1/design/h/ytM9GdJNS08FLdDCnhQxVQ" | tar -xz -C design_bundles/a   # a: Math Atlas (early, light-first)
curl -sL "https://api.anthropic.com/v1/design/h/ImqgpmrUAz7A6cVFCS9Adw" | tar -xz -C design_bundles/b   # b: Math Atlas (chosen direction)
curl -sL "https://api.anthropic.com/v1/design/h/pbgs_7aqJsX0IMs6dmJZTg" | tar -xz -C design_bundles/c   # c: "Lemma" (rebrand — inspiration only)
```

Each unpacks to `<name>-design-system/project/` with `assets/`, `preview/*.html`, `ui_kits/`,
`README.md` (visual foundations + iconography), and `colors_and_type.css`.

---

## What the app ALREADY ships (don't re-add these)

- `public/atlas-assets/logo-mark.svg`, `public/atlas-assets/logo-lockup.svg` — the compass-rose
  brand mark + lockup (already carried from bundle b). `index.html` uses `logo-mark.svg` as favicon;
  `src/components/Logo.tsx` (`LogoMark`) is the inline compass rose via `currentColor`.
- `public/favicon.svg`, `public/atlas-assets/icons/` (check contents), and ~100 themed diagram SVGs
  in `public/atlas-assets/diagrams/*.svg` (rendered by `src/components/ThemedDiagram.tsx`).
- Sandbox fact-status glyphs and tool glyphs are already Lucide-based
  (`src/components/sandbox/FactsPanel.tsx`, `ToolRail.tsx`).

So the brand mark, favicon, fonts, and UI icons are **done**. Focus on what's *missing*.

---

## Candidate assets to review (verify against the live app; don't assume)

Diff each bundle's `assets/` against `public/atlas-assets/`. Known high-value candidates:

| Candidate | Bundle path | Why it might be worth carrying |
|---|---|---|
| **8 domain icons** | `b/.../assets/icons/d-*.svg` (`d-foundations`, `d-continuity`, `d-connectedness`, `d-fundamental-group`, `d-covering-spaces`, `d-compactness`, `d-homotopy`, `d-examples`) | The app labels domains by color + text only. Brand domain glyphs could mark domain-region headers (`DomainRegionNode.tsx`), the legend/left filter rail, and `NodePanel`. **Not in Lucide.** Highest-value gap. |
| **dot-grid** | `a/.../assets/dot-grid.svg` | The canvas grid is CSS today (`.atlas-dots`/`.atlas-grid`, `Background.tsx`). Compare for fidelity; only adopt if clearly better. |
| **monogram** | `a/.../assets/monogram.svg` | A compact square mark for tight spots (e.g. favicon variants, OG image). Compare to the existing compass mark. |
| **brand/UI icons** | `b/.../assets/icons/*.svg` (atlas, route, bookmark, layers, compass, etc.) | Mostly **redundant with Lucide** — skip unless a specific one is visually distinct and on-brand. |
| **subject glyph concept** | `c/.../assets/icons/lemma/*.svg` (torus, turnstile, etc.) | *Lemma-branded* and a different style — inspiration only for how domain glyphs could look; do not ship c's files. |
| **hero graph** | `c/.../assets/hero-graph.svg` | Only relevant if a marketing/landing surface is ever built. Defer. |

Also skim each bundle's `preview/brand-*.html` and the README "ICONOGRAPHY" section for usage intent,
and `b/.../uploads/assets.png` (the original brand sheet) as reference.

---

## Workflow

1. **Review.** Re-fetch the bundles if needed. Inventory every asset, diff against
   `public/atlas-assets/`, and open candidate SVGs to judge style fit (stroke weight, viewBox,
   whether they use `currentColor`). Note which are genuinely missing vs. redundant with Lucide /
   already shipped.
2. **Recommend & confirm.** Present a short ranked list (carry over / adapt / skip, with one-line
   rationale each). Use `AskUserQuestion` to let the user choose which to implement — do not bulk-
   import. Call out anything that needs a theming rewrite (hardcoded hex → tokens/`currentColor`).
3. **Implement** the agreed set:
   - Copy chosen SVGs into `public/atlas-assets/` (e.g. `public/atlas-assets/domains/d-*.svg`), and
     **retheme** them: replace literal colors with `currentColor` (so the consumer sets color via
     `style={{ color: tone.color }}`) or `var(--…)` tokens. Strip fixed `width/height` if you want
     CSS sizing.
   - Wire them where they earn their place. For domain icons, the natural homes are
     `src/components/DomainRegionNode.tsx` (band header), the legend / left filter rail, and
     `src/components/NodePanel.tsx`. Map domain id → icon via a small lookup beside
     `src/lib/colors.ts` (which already maps domains → tones).
   - Keep additions opt-in/non-destructive; reuse existing tokens and the `cn` util.
4. **Verify** (see below). Screenshot light + dark.

---

## Acceptance criteria

- `npm run build` is clean (`tsc -b && vite build`).
- Every new asset renders correctly in **both a light and a dark theme** (e.g. `paper` and
  `chalkboard`) — no hardcoded color leaks, mark color follows the token/`currentColor`.
- No regression to the brand mark, favicon, fonts, or Lucide UI icons.
- New assets are committed under `public/atlas-assets/` and referenced by relative path.

## Verify end-to-end

1. `npm run build`.
2. `npm run dev`, then drive the app via the preview tools (`mcp__Claude_Preview__*` /
   `.claude/launch.json` server name): load the atlas, confirm any new domain glyphs appear where
   wired (domain region headers / legend / node panel), toggle the scheme (TopBar sun/moon) and
   confirm they retune. Screenshot light + dark as proof.

## Notes

- The user commits the work themselves; leave changes in the working tree and summarize, unless
  they ask you to commit (if so, branch first — default branch is `main`).
- When in doubt about brand intent, prefer the bundle **b** README and `preview/` cards as source of
  truth; bundle **a** is superseded and bundle **c** is a different brand.
```
