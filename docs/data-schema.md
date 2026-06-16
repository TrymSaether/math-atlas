# Math Atlas — target data schema

Two shapes, one build step between them.

```
*.source.json   ──build──►   *.json (artifact)
(authored truth,             (what the app imports;
 strict, normalized,          denormalized for render,
 edges-only)                  pre-validated, no workflow)
```

**Rules that drive the whole design**

1. Every fact is stored **once**, in its most normalized form. Everything else is derived.
   - One relation per pair, in its **most specific** form: a generic `uses` may not coexist with a specific dependency (`defined_in_terms_of`/`assumes`/`constructed_from`) on the same ordered pair, and `related_to` (the weakest link) may not coexist with any other relation on the same unordered pair. The strict schema rejects such subsumed parallels.
2. **Edges are the only relationship store.** No `dependencies`, `outgoing_relations`, or `related` as separate authored fields.
3. **Direction is fixed by relation type**, never authored per-edge. Inverses are declared once, materialized at build.
4. Source schema is **strict** — no `.passthrough()`. Unknown/typo keys fail the build.
5. **Workflow, presentation, layout, and speculative fields never reach the artifact.**

---

## 1. Relation registry (single source of edge semantics)

This table _is_ the schema for edge direction. `source → target` always reads in the "Reads as" direction; `isDep` means the edge counts toward the logical dependency DAG (target is a prerequisite of source).

| relation              | reads as (source→target)     | inverse        | symmetric | isDep | replaces (current)                    |
| --------------------- | ---------------------------- | -------------- | --------- | ----- | ------------------------------------- |
| `defined_in_terms_of` | A is defined using B         | `defines`      | no        | yes   | `definitional_dependency`             |
| `uses`                | A uses B                     | `used_by`      | no        | yes   | `logical_dependency`, edge `uses`     |
| `assumes`             | A assumes B                  | `assumed_by`   | no        | yes   | `assumption_dependency`               |
| `constructed_from`    | A is built from B            | `constructs`   | no        | yes   | `construction_dependency`             |
| `generalizes`         | A generalizes B              | `specializes`  | no        | no    | `subtype_of`/`instance_of` (reversed) |
| `motivated_by`        | A is motivated by B          | `motivates`    | no        | no    | `pedagogical_/historical_dependency`  |
| `equivalent_to`       | A is equivalent to B         | (self)         | **yes**   | no    | `equivalent_definitions`              |
| `related_to`          | A relates to B               | (self)         | **yes**   | no    | `related`                             |
| `satisfies`           | space A satisfies property B | `satisfied_by` | no        | no    | `satisfies`                           |
| `violates`            | space A violates property B  | `violated_by`  | no        | no    | `violates`                            |
| `proves`              | proof A proves statement B   | `proved_by`    | no        | no    | proof linkage                         |

```ts
export const RELATIONS = {
  defined_in_terms_of: { inverse: "defines", symmetric: false, isDep: true },
  uses: { inverse: "used_by", symmetric: false, isDep: true },
  assumes: { inverse: "assumed_by", symmetric: false, isDep: true },
  constructed_from: { inverse: "constructs", symmetric: false, isDep: true },
  generalizes: { inverse: "specializes", symmetric: false, isDep: false },
  motivated_by: { inverse: "motivates", symmetric: false, isDep: false },
  equivalent_to: { inverse: "equivalent_to", symmetric: true, isDep: false },
  related_to: { inverse: "related_to", symmetric: true, isDep: false },
  satisfies: { inverse: "satisfied_by", symmetric: false, isDep: false },
  violates: { inverse: "violated_by", symmetric: false, isDep: false },
  proves: { inverse: "proved_by", symmetric: false, isDep: false },
} as const;
export type RelationType = keyof typeof RELATIONS;
```

Authors only ever write the **forward** key. The reverse (`defines`, `used_by`, …) is never authored — it's materialized into the artifact.

**Notes on a few relations**

- `generalizes` is **lateral, not a dependency** (`isDep: no`). The data uses it both as abstraction-of-concrete and as superclass-of-subclass, so the prerequisite order it would impose is ambiguous and can contradict the definitional edges. The real learning order is carried by `defined_in_terms_of` / `uses` / `assumes` / `constructed_from`.
- `equivalent_to` asserts two concepts are the **same thing under different presentations** (e.g. the open-cover / sequential / FIP characterizations of compactness). It is symmetric and **not** a dependency, so a genuine mutual relationship can be recorded without it being mistaken for a circular definition. Consumers collapse each `equivalent_to` connected component into a single **ordering unit**, so equivalent reformulations are sequenced together in learning paths instead of being scattered.

**Dependency-DAG invariant.** The sub-graph of dependency edges (`isDep: yes`) must be **acyclic** — a cycle is a circular definition. The strict source schema rejects it at build time (the error names the loop and points you at `equivalent_to` for genuinely equivalent reformulations).

---

## 2. Source schema (authored truth) — strict

```ts
import { z } from "zod";

const Slug = z.string().regex(/^[a-z0-9_]+$/);
const Tex = z.string().min(1); // LaTeX; rendered downstream
const Prose = z.string().min(1); // plain prose, not a restatement of the definition
// AUTHORABLE_RELATIONS = the forward-only subset authors may write (see §1).
const Kind = z.enum([
  "object",
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "example",
  "counterexample",
  "construction",
  "property",
  "proof",
]);

export const SourceDomain = z
  .object({
    id: Slug,
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    palette: z.enum(["blue", "green", "purple", "red", "teal", "orange", "pink", "gold"]),
  })
  .strict();

export const SourceConcept = z
  .object({
    id: Slug, // identity
    kind: Kind, // ontology
    domain: Slug, // partition membership
    label: z.string().min(1),

    // knowledge — content. All optional; supply what applies to the kind.
    content: z
      .object({
        statement: Tex.optional(), // informal statement
        definition: Tex.optional(), // genus+differentia style is fine here
        formal: Tex.optional(), // precise/formal statement
        formula: Tex.optional(), // displayed formula/identity — distinct from notation
        intuition: Prose.optional(), // prose, not a restatement of definition
        gloss: Prose.optional(), // short dictionary-style gloss; drives Dictionary view
        notation: z.array(Tex).default([]),
      })
      .strict()
      .default({ notation: [] }),

    // optional structured pedagogy (kept only if a renderer uses it)
    examples: z.array(z.object({ tex: Tex, caption: z.string().optional() }).strict()).default([]),
    diagram: z.string().optional(), // single curated diagram path (figure pipeline owns the rest)
    assumptions: z.array(Prose).default([]), // free-text hypotheses; NOT concept refs, so not edges

    // one step list for both theorem proofs and exercise solutions (same shape);
    // UI labels it "Solution" when kind === "exercise", else "Proof"
    proof: ProofSchema.optional(),

    // provenance
    source: z
      .object({
        citation: z.string().optional(),
        chapter: z.string().optional(),
        ref: z.string().optional(), // single pointer (e.g. "Thm 3.2")
        references: z.array(z.string()).default([]), // external textbook citations (was book_refs)
      })
      .strict()
      .optional(),
    tags: z.array(z.string()).default([]),
    priority: z.enum(["core", "standard", "peripheral"]).default("standard"),
  })
  .strict();

// ProofSchema = { steps: [{ role: setup|claim|calculation|case|argument|conclusion|remark,
//                           content: Tex, uses: Slug[] }] }

export const SourceEdge = z
  .object({
    id: Slug.optional(), // optional: build derives a deterministic id if absent
    source: Slug,
    target: Slug,
    relation: z.enum(AUTHORABLE_RELATIONS), // forward keys only; inverses are render-time
    // NO direction, NO dependency_class (both implied by relation);
    // NO confidence/verified (were authored constant, read by nothing — removed)
    notes: z.string().optional(),
  })
  .strict();

export const SourceGraph = z
  .object({
    id: Slug,
    label: z.string().min(1),
    field: z.string().min(1),
    version: z.number().int().positive(),
    updated: z.string(), // ISO date
    domains: z.array(SourceDomain).min(1),
    concepts: z.array(SourceConcept).min(1),
    edges: z.array(SourceEdge).default([]),
  })
  .strict()
  .superRefine(/* FK + dup + contiguous-order checks, run at BUILD time */);
```

Gone from the source entirely: `dependencies`, `outgoing_relations`, `related`, edge `direction`, edge `dependency_class`, `status`/`*_review`, `canonical_label`/`display_label`, `chapter`/`number`/`section`/`sectionTitle`/`topicCluster` (fabricated), `query_model`/`views`/`example_queries`/`schema`/`templates`/`labeling`, and the legacy `TopoNode`/`TopoData` model.

---

## 3. Artifact schema (what the app imports) — derived

Built from source. **Not re-validated at runtime** — already validated in CI. Denormalized so the client does only cheap index-building.

```ts
export const ArtifactNode = z.object({
  id: z.string(),
  kind: z.string(),
  domain: z.string(),
  label: z.string(),
  content: /* same content block */,
  examples: /* same */,
  diagram: /* same */, assumptions: /* same */,
  proof: /* same */,
  source: /* same */,
  tags: z.array(z.string()),
  priority: z.string(),
  // DERIVED, precomputed at build:
  degree: z.number(),
  depth: z.number(),                       // longest dependency chain (x-axis)
});

export const ArtifactEdge = z.object({
  id: z.string(),
  from: z.string(),                        // = dependency DAG orientation (prereq → dependent)
  to: z.string(),
  relation: z.string(),
  isDependency: z.boolean(),
  scope: z.enum(["statement", "proof"]).default("statement"), // dependency layer
  // edges are stored single-direction; inverses are derived at render time,
  // not materialized — so no `derived` flag. No confidence/verified.
});

export const Artifact = z.object({
  id, label, field, version,
  domains: z.array(/* domain + resolved tone */),
  nodes:  z.array(ArtifactNode),
  edges:  z.array(ArtifactEdge),       // definitional backbone (scope: statement)
  proofEdges: z.array(ArtifactEdge),   // proof overlay (scope: proof); see below
});
```

**Two dependency layers.** `edges` is the definitional backbone — what you need to **understand** a concept's statement. `proofEdges` is a separate overlay derived from each concept's `proof.steps[].uses`: `used → concept`, oriented prereq → dependent, scope `proof`. A pair already covered by a statement dependency is skipped, so the overlay holds exactly the **extra** machinery a proof needs. It's kept out of `edges` so the rendered graph, layout, and metrics are unaffected; the Directions feature opts in to it ("enough to prove it" vs "enough to understand it").

Adjacency maps, incoming/outgoing groupings, neighbor sets — keep building those at load (cheap, already done in `buildLoadedMap`). Don't serialize them.

---

## 4. Build step (`scripts/build-maps.ts`)

```
for each *.source.json:
  1. parse with SourceGraph (strict)            → hard fail on typo/unknown keys
  2. FK check: every edge.source/target, proof step `uses`, → existing concept
  3. dup check: concept ids, domain ids, edge ids; contiguous domain order
  4. orient: for each edge, set from/to using RELATIONS[relation] + isDep
  5. dedupe: collapse semantically identical edges (from,to,relation;
            symmetric relations canonicalize the pair so A↔B is stored once)
  6. compute: degree, depth (longest prereq chain)
  6b. build proofEdges: each concept's proof.steps[].uses → `used → concept`
            (scope proof), skipping pairs a statement dependency already covers
  7. emit *.json (artifact); pretty for diff or minified for ship
            (inverse edges are NOT materialized — derived at render time)
exit non-zero on any issue  → wired into CI / prebuild
```

Runtime `loadMap` then drops `FieldJsonSchema.parse` + `normalizeFieldGraph` and just imports the artifact and builds in-memory indexes.

---

## 5. Field migration map (current → target)

| current field(s)                                                             | action                                                                                                         | target            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------- |
| `id`, `kind`, `domain`, `label`                                              | **keep**                                                                                                       | identity/ontology |
| `statement`/`definition`/`formal_statement`/`intuition`/`notation`           | **keep**, nest under `content`                                                                                 | knowledge         |
| `formula`, `mathematicalFormula`                                             | **drop** (derive display from `notation`)                                                                      | —                 |
| `dependencies` (by class)                                                    | **fold into edges** by relation, then drop                                                                     | edges             |
| `outgoing_relations`                                                         | **drop** (derive from edges)                                                                                   | —                 |
| `related`                                                                    | **convert** to `related_to` edges                                                                              | edges             |
| edge `direction`                                                             | **drop** (implied by relation)                                                                                 | —                 |
| edge `dependency_class`                                                      | **drop** (implied by relation)                                                                                 | —                 |
| `satisfies`/`violates`/`proves`/`related_theorems`/`demonstrates`            | **convert** to edges (decided: keep — relational, on-vision)                                                   | edges             |
| `genus`/`differentia`                                                        | **drop**, fold into `content.definition` (decided: no renderer)                                                | content           |
| `examples`/`non_examples`/`counterexample` (text arrays)                     | **drop** (decided: examples come from figures + example-nodes); keep single curated `example` + `diagram_path` | —                 |
| `equivalent_definitions`                                                     | **drop** (or `related_to` edge if it targets a concept)                                                        | —                 |
| `proof`/`proof_steps`/`solution_steps`/`proof_dependencies`                  | **keep** as `proof.steps[].uses`                                                                               | content + edges   |
| `source`/`book_refs`/`ref`/`chapter`                                         | **keep**, nest under `source`                                                                                  | provenance        |
| `confidence` (enum) / edge `verified`                                        | **drop** (authored constant `high`/`false` everywhere, read by nothing)                                        | —                 |
| `status`/`math_review`/`schema_review`/`pedagogy_review`/`convention_review` | **move out** of artifact (authoring tooling only)                                                              | —                 |
| `canonical_label`/`display_label`                                            | **drop** (one `label`)                                                                                         | —                 |
| `number`/`section`/`sectionTitle`/`topicCluster`/`chapter`(fabricated)       | **drop** (derive at render)                                                                                    | —                 |
| `query_model`/`views`/`example_queries`/`schema`/`templates`/`labeling`      | **drop** from artifact; separate file if real                                                                  | —                 |
| `version`/`last_updated`                                                     | **keep**, uniform across all maps                                                                              | manifest          |

```

```
