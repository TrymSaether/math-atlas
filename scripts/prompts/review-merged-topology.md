# Handoff: Review & repair `topology.json` after the dictionary merge

## Your task
Review and update `src/data/maps/topology.json` (the Topology knowledge graph). It
was just produced by merging a curated dictionary into the existing graph, which
introduced duplicates, disconnected nodes, and cross-references that never became
edges. Find and fix data-quality problems, then report what you changed and what
still needs a human decision.

Work only on the data in `src/data/maps/topology.json`. Do **not** change app code,
the schema, or other maps unless a fix genuinely requires it (if so, call it out
separately).

## Background — how we got here
- `public/topology_dictionary.json` (105 curated entries: term, statement, gloss,
  worked example, `related[]`, diagram) was merged into the graph by
  `scripts/reconcile_dictionary.py`.
- That script matched a dictionary entry to an existing node by **exact normalized
  id/label** only. 18 entries matched and were folded onto existing nodes; the
  other **87 became brand-new nodes** with snake_case ids derived from the
  dictionary id, `kind` lower-cased, and `domain` assigned by chapter heuristic.
- New nodes carry the dictionary fields but **no edges and no dependencies** — they
  only have a `related[]` list of cross-references.

Because matching was exact-only, near-duplicates (same concept, different
id/wording) were NOT caught and now coexist as two nodes. That is the main thing
to fix.

## Current state (as of this handoff)
- 262 items, 472 edges, 7 domains
  (`foundations`, `spaces_constructions`, `continuity`, `compactness`,
  `connectedness`, `separation_countability`, `algebraic_topology`).
- 105 items carry dictionary content (`diagram_path` set); 87 of those are new.
- **98 orphan nodes** with zero edges (most are the new dictionary nodes).
- **350 `related` links have no corresponding edge** in `edges[]`.
- **1 duplicate label**: `topology_field` (kind `structure`) vs `topology`
  (kind `definition`) — almost certainly the same concept; merge them.
- 0 dangling `related` refs (all point to real ids).

Re-derive these numbers yourself before and after your changes; don't trust them
blind.

## Schema you must preserve
Validation lives in `src/types.ts` (`FieldJsonSchema`, Zod) and runs at app load.
Key invariants — **breaking any of these breaks the app**:
- Every `item.domain` references an existing domain id.
- Every `item.id`, `domain.id`, `edge.id` is unique.
- Every `edge.source`/`edge.target` references an existing item id.
- `edge.direction ∈ {source_to_target, target_to_source, bidirectional}`.
- Edges whose `type` is in `SOURCE_DEPENDS_ON_TARGET` (`requires`, `uses`,
  `assumes`, `defined_by`, `constructed_from`, `subtype_of`, `instance_of`,
  `applied_to`, `violates_assumption`, `shows_necessity_of`) must use
  `direction: "source_to_target"`.
- No two edges may share the same `(source, target, type, dependency_class,
  direction)` tuple (semantic-duplicate edges are rejected).
- `item.dependencies` is `{ <dependency_class>: [ids…] }`; referenced ids must exist.

Dictionary fields added by the merge (keep these populated): `chapter`, `ref`,
`gloss`, `example`, `diagram_path`, `related[]`.

After any change, the file must still parse and satisfy `FieldJsonSchema`. Validate
with: `npx tsc --noEmit` (won't catch data) **and** load the app
(`npm run dev`) to trigger Zod, or write a small Node/Python check against the
schema rules above. `npm run build` must pass.

## What to look for and fix (prioritized)

### 1. Duplicate / overlapping nodes (highest value)
The exact-match merge missed conceptual duplicates. Find pairs that are the same
concept under different ids/labels and **merge them into one canonical node**.
- Start with the known case: `topology` ↔ `topology_field`.
- Look for: singular/plural, hyphen/underscore, synonyms (e.g.
  `closed_set` vs `closed_subset`, `basis_for_topology` vs `basis`,
  `subbasis` vs `subbase`), and "X" vs "X_definition" / "X_def" suffixes the script
  may have added on id collision.
- When merging: keep the richer node (usually the one with graph edges), copy over
  any dictionary fields from the other, **repoint all edges and `related`/
  `dependencies` references** from the dead id to the survivor, then delete the
  duplicate. Don't leave dangling references.

### 2. `related` links that should be edges
The 350 dictionary cross-references encode real relationships but live only in
`related[]`. Promote the meaningful ones to typed edges so they show up in the
graph (dependencies, "used by", examples, etc.). For each, pick the correct `type`
and `direction` per the schema rules above, and a sensible `dependency_class`.
Don't blindly convert all 350 — many `related` links are "see also" associations,
not dependencies. Use judgement; prefer precision over recall.

### 3. Orphan nodes (0 edges)
The 98 orphans are mostly new dictionary concepts that aren't wired into the graph.
For each, add at least the obvious edges (what it depends on, what uses it) so it
isn't floating. Examples to wire up: `based_map`, `basepoint_independence`,
`fundamental_group`, the standard counterexample spaces (`long_line`,
`sorgenfrey_line`, `hawaiian_earring`, `topologist_sine_curve`). A concept with
genuinely no relations can stay orphaned, but that should be rare.

### 4. Domain assignment sanity
New nodes got domains from a chapter→domain heuristic; chapter 6 was keyword-routed
and chapters 7–8 all went to `algebraic_topology`. Spot-check that each new node
sits in the right domain (e.g. a separation-axiom definition should be in
`separation_countability`, not `compactness`). Fix misplacements.

### 5. Kind normalization
Dictionary kinds were lower-cased (`definition`, `theorem`, `lemma`, `corollary`,
`concept`). Verify these are consistent with the existing kind vocabulary and the
6 categories in `src/lib/nodeCategory.ts` (`KIND_TO_CATEGORY`). In particular
`concept` is not in that map (it falls back to `definition`); decide whether those
2 nodes should be a known kind instead.

### 6. Also consider (suggest, don't necessarily fix)
- Edge `confidence` on promoted edges (`high|medium|low`) — set honestly.
- Contradictory or cyclic dependencies introduced by the merge.
- Statements duplicated across `statement`/`formal_statement`/`definition` on
  merged nodes (the script only filled `statement` if empty).
- Diagram paths that don't resolve under `public/atlas-assets/diagrams/`.
- Tags/metadata: new nodes got empty tags — add a few where obvious.

## Deliverables
1. The updated `src/data/maps/topology.json`, still schema-valid and building.
2. A short report listing: (a) duplicates merged (dead id → survivor), (b) edges
   added (with type/direction), (c) domain/kind fixes, (d) anything you flagged but
   intentionally did NOT change and why, and (e) before/after counts for items,
   edges, orphans, and `related`-without-edge.
3. Keep changes reviewable — prefer a clear, minimal diff; don't reformat the whole
   file or reorder unrelated entries.

## Constraints
- Do not invent mathematical content. If a relationship isn't clearly supported by
  the statements/glosses present, leave it out and note it.
- Don't delete dictionary fields (gloss/example/diagram/ref/chapter) — the in-app
  dictionary view renders from them.
- The merge is reproducible from `scripts/reconcile_dictionary.py`; if you change
  how matching should work, update that script too rather than only hand-editing
  output.
