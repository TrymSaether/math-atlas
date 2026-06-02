# Handoff: graph & content visual language (nodes, edges, theorem environments)

Companion to `docs/design-asset-handoff.md`. That one covers static assets (SVGs, marks,
icons). **This one covers the graph's _visual language_ and content presentation** — the
node/edge/theorem-environment design from the three Claude Design bundles — and which of it is
worth adopting into **Math Atlas** (`/Users/saether/onedrive_new/10_projects/math-atlas`).

Read first: `CLAUDE.md`, the project memory
`~/.claude/projects/-Users-saether-onedrive-new-10-projects-math-atlas/memory/design-direction-bundle-b.md`,
and the **Hard constraints** + **Getting the bundles** sections of `docs/design-asset-handoff.md`
(don't duplicate them — they apply here verbatim). The one that bites most here:

> **Color is reserved for domains.** Do NOT add bundle b's per-_kind_ colors or per-_edge-relation_
> colors. Node kind = glyph + rail texture; edges = monochrome. Any new visual axis (e.g. learning
> state) must encode by **shape/glyph**, or at most the single `--accent`, never a new color ramp.

---

## Already solved — do NOT rebuild

- **Theorem environments.** `src/components/Specimen.tsx` already implements the full content
  language: **Spine** (canonical statement + domain rail + kind texture), **Facet** (intuition /
  formal / example prose), **Proof** (collapsible, run-in "Proof" label, **∎ QED tombstone**), and
  **ConnectionChip** (relationship references). Used by `NodePanel` and `DictionaryView`. Bundle c's
  `components-theorem.html` is a _different brand_ — do not port it. **No work needed here.**
- **Node card fundamentals.** `src/components/TopoNode.tsx` has LOD (far/mid/near), emphasis tiers
  (landmark/normal/minor from impact), kind glyph + rail texture, domain color, route pulse/endpoint.
- **Edges.** `src/components/TopoEdge.tsx` is monochrome with hard/soft (solid/dashed), highlight +
  halo on selection, relation label on hover, and the route-reveal overlay.

So this handoff is about the **gaps**, not a rewrite.

---

## Work items (ranked; verify each against the live components before building)

### 1. Node **learning state** — new feature + design ★ highest value

Bundle: `b/.../preview/components-learning-state.html`, `components-node-states.html` (Learned /
In-progress / Mastered / Saved-Bookmarked). The app tracks only _structural_ emphasis (impact), not
**user progress** — this is genuinely missing.

- **Encode by glyph/shape, not a color ramp** (constraint #3). Suggested vocabulary: bookmark =
  saved, half-disc = in progress, check = learned, filled disc = mastered. Render as a small badge
  on the node corner; neutral ink or a single `--accent`, never per-state hues.
- **State + persistence:** add `learning: Map<nodeId, LearningState>` to `src/store.ts` with toggles,
  persisted to `localStorage` (mirror the theme persistence pattern). Set state from `NodePanel`
  (a control row) and/or a keyboard shortcut on the selected node.
- **Surfacing:** badge in `TopoNode.tsx` (gate by LOD — hide at far zoom); optional filter/dim by
  state; a count readout. This pairs with the **Bookmarks / Saved Paths** idea (left panel
  Browse/Bookmarks/Recents from bundle b's `encyclopedia-map`) — consider doing them together.

### 2. **Domain-region headers + domain icons** (ties into the asset handoff)

Bundle: `b/.../preview/components-domain-headers.html` + the 8 `assets/icons/d-*.svg`.
`src/components/DomainRegionNode.tsx` renders cluster bands with a label watermark + colored dot.
Upgrade the header to show the domain's **glyph** (the `d-*.svg`, recolored via `currentColor` →
`tone.color`) beside the label, and reuse the same glyph in the legend / left filter rail and
`NodePanel` domain line. Add a `domainId → icon` lookup beside `src/lib/colors.ts`. **This is where
the asset-handoff domain icons earn their place — coordinate the two.**

### 3. Node **hover-preview card**

Bundle: `b/.../preview/components-card-tooltip.html`. Today a node only reveals detail on click
(opens `NodePanel`). Add a lightweight **hover preview** (debounced `onMouseEnter`) showing ID +
kind + title + one-line statement — reuse a trimmed `Specimen` Spine. Render via a portal near the
node; dismiss on leave; **suppress during pan, route-planning mode, and at far LOD**. Keep it cheap.

### 4. Edge **white-halo at crossings** (metro readability, non-color)

Bundle: `b/.../preview/components-paths.html` (white halo where lines cross). `TopoEdge.tsx` halos
only _highlighted_ edges. Render a thin `var(--bg)`-colored halo under **every** drawn edge so
crossings read cleanly — a pure-monochrome readability win, no new color.

- **Watch performance:** the graph has hundreds of edges. Gate sensibly (e.g. only in dependency
  view, or above a zoom threshold, or cap halo to non-dimmed edges) and re-check frame rate.

### Lower value / optional

- **Tags & chips** standardization (`components-tags.html`) — the app's chips are already close;
  adopt only if you find real inconsistency.
- Generic primitives (buttons / inputs / tabs) — the app has its own; **skip** unless asked.

---

## Explicitly out of scope / declined (keep them declined)

- Per-**edge-relation** color axis (`colors-edges.html`) — edges stay monochrome.
- Per-**kind** color axis (`colors-kinds.html`) — kind stays glyph + texture.
- Bundle c's theorem-environment styling, wordmark, fonts, vermilion accent.
- Font swaps (see asset handoff).

---

## Workflow

1. **Review** each item against the live component named above; confirm it's actually missing and
   that the bundle card adds real value. Open the bundle `preview/*.html` for the intended look.
2. **Recommend & confirm.** Present the ranked list; use `AskUserQuestion` to pick which to build —
   don't do all four unprompted. Flag the learning-state _glyph_ vocabulary for sign-off (since it's
   a new visual axis that must stay shape-based, not color-based).
3. **Implement** the agreed items, reusing `Specimen` primitives, `getDomainTone`
   (`src/lib/colors.ts`), `nodeCategory`/`relationStyle`, tokens, and the `cn` util. Keep additions
   opt-in and theme-correct (`currentColor` / `var(--…)`, never bundle hex).
4. **Verify** (below). Screenshot light + dark.

## Acceptance criteria

- `npm run build` clean (`tsc -b && vite build`).
- New UI renders correctly in **a light and a dark theme** (e.g. `paper` + `chalkboard`); no
  hardcoded color, no new color axis competing with domains.
- Learning-state badges read clearly at near/mid LOD and don't clutter far LOD.
- Edge halos don't tank frame rate on the largest map (topology, ~230 edges).
- No regression to `Specimen` theorem rendering, node LOD/emphasis, or the route animation.

## Verify end-to-end

1. `npm run build`.
2. `npm run dev`; drive via the preview tools (`mcp__Claude_Preview__*`; server in
   `.claude/launch.json`). Mark a few nodes' learning state and confirm badges + persistence across
   reload; confirm domain glyphs in region headers/legend; hover a node for the preview card; eyeball
   edge crossings on the topology map. Toggle the scheme (TopBar sun/moon) and confirm everything
   retunes. Screenshot light + dark.

## Notes

- User commits the work themselves; leave changes in the working tree and summarize unless asked
  (if asked, branch first — default branch is `main`).
- Prefer bundle **b** README + `preview/` cards as the visual source of truth.

```

```
