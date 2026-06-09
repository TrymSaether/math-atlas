/**
 * Source schema — the authored, normalized, STRICT contract.
 *
 * This is the truth humans (or scripts) edit. It is validated at BUILD time,
 * never in the browser. Edges are the only relationship store; direction and
 * dependency-class are implied by `relation` (see ./relations). No presentation,
 * workflow, or derived fields are permitted — `.strict()` makes unknown/typo
 * keys a hard build failure.
 */
import { z } from "zod";
import { AUTHORABLE_RELATIONS, RELATIONS } from "./relations";

const Slug = z
  .string()
  .regex(/^[a-z0-9_]+$/, "ids must be lower_snake_case slugs");
const Tex = z.string().min(1);
const Prose = z.string().min(1);

// Full observed kind vocabulary. Kept inclusive (identity passthrough from the
// source) because the UI assigns distinct glyphs/categories per kind in
// lib/nodeCategory.ts — collapsing kinds here would erase those distinctions.
export const KIND_VALUES = [
  "object",
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "example",
  "counterexample",
  "non_example",
  "construction",
  "property",
  "proof",
  "proof_method",
  "proof_step",
  "exercise",
  "axiom",
  "structure",
  "application",
  "notation",
  "conjecture",
  "assumption",
  "method",
  "operator",
] as const;

export const SourceDomainSchema = z
  .object({
    id: Slug,
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    palette: z.enum([
      "blue",
      "green",
      "purple",
      "red",
      "teal",
      "orange",
      "pink",
      "gold",
    ]),
  })
  .strict();

const ContentSchema = z
  .object({
    statement: Tex.optional(),
    definition: Tex.optional(),
    formal: Tex.optional(),
    /** Displayed formula/identity — distinct from `notation` (symbols used). */
    formula: Tex.optional(),
    intuition: Prose.optional(),
    /** Short dictionary-style gloss; drives the Dictionary view. */
    gloss: Prose.optional(),
    notation: z.array(Tex).default([]),
  })
  .strict();

const ExampleSchema = z
  .object({ tex: Tex, caption: z.string().min(1).optional() })
  .strict();

const ProofStepSchema = z
  .object({
    role: z.enum([
      "setup",
      "claim",
      "calculation",
      "case",
      "argument",
      "conclusion",
      "remark",
    ]),
    content: Tex,
    uses: z.array(Slug).default([]),
  })
  .strict();

const SourceMeta = z
  .object({
    citation: z.string().min(1).optional(),
    chapter: z.string().min(1).optional(),
    ref: z.string().min(1).optional(),
    /** External textbook citations (was `book_refs`). */
    references: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const SourceConceptSchema = z
  .object({
    id: Slug,
    kind: z.enum(KIND_VALUES),
    domain: Slug,
    label: z.string().min(1),
    content: ContentSchema.default({ notation: [] }),
    examples: z.array(ExampleSchema).default([]),
    /** Single curated diagram (the figure pipeline owns rich examples). */
    diagram: z.string().min(1).optional(),
    /** Free-text stated hypotheses; not concept references, so not edges. */
    assumptions: z.array(Prose).default([]),
    /**
     * Step-by-step derivation. Carries theorem/lemma proofs and exercise
     * solutions alike (same shape); the UI labels it "Solution" for
     * `kind === "exercise"` and "Proof" otherwise.
     */
    proof: z
      .object({ steps: z.array(ProofStepSchema).min(1) })
      .strict()
      .optional(),
    source: SourceMeta.optional(),
    tags: z.array(z.string().min(1)).default([]),
    priority: z.enum(["core", "standard", "peripheral"]).default("standard"),
  })
  .strict();

export const SourceEdgeSchema = z
  .object({
    id: Slug.optional(),
    source: Slug,
    target: Slug,
    relation: z.enum(AUTHORABLE_RELATIONS),
    notes: z.string().min(1).optional(),
  })
  .strict();

export const SourceGraphSchema = z
  .object({
    id: Slug,
    label: z.string().min(1),
    field: z.string().min(1),
    version: z.number().int().positive(),
    updated: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "updated must be ISO date"),
    domains: z.array(SourceDomainSchema).min(1),
    concepts: z.array(SourceConceptSchema).min(1),
    edges: z.array(SourceEdgeSchema).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    const domainIds = new Set<string>();
    for (const [i, domain] of data.domains.entries()) {
      if (domainIds.has(domain.id))
        ctx.addIssue({
          code: "custom",
          path: ["domains", i, "id"],
          message: `Duplicate domain id: ${domain.id}`,
        });
      domainIds.add(domain.id);
    }
    // Domain orders must be unique and contiguous from 0.
    const orders = data.domains.map((d) => d.order).sort((a, b) => a - b);
    orders.forEach((o, i) => {
      if (o !== i)
        ctx.addIssue({
          code: "custom",
          path: ["domains"],
          message: `Domain orders must be contiguous from 0; expected ${i}, found ${o}`,
        });
    });

    const conceptIds = new Set<string>();
    for (const [i, c] of data.concepts.entries()) {
      if (conceptIds.has(c.id))
        ctx.addIssue({
          code: "custom",
          path: ["concepts", i, "id"],
          message: `Duplicate concept id: ${c.id}`,
        });
      conceptIds.add(c.id);
    }
    for (const [i, c] of data.concepts.entries()) {
      if (!domainIds.has(c.domain))
        ctx.addIssue({
          code: "custom",
          path: ["concepts", i, "domain"],
          message: `Concept ${c.id} references missing domain: ${c.domain}`,
        });
      (c.proof?.steps ?? []).forEach((step, s) =>
        step.uses.forEach((u, k) => {
          if (!conceptIds.has(u))
            ctx.addIssue({
              code: "custom",
              path: ["concepts", i, "proof", "steps", s, "uses", k],
              message: `Concept ${c.id} proof step references missing concept: ${u}`,
            });
        }),
      );
    }

    const edgeIds = new Set<string>();
    const semantic = new Set<string>();
    for (const [i, e] of data.edges.entries()) {
      if (e.id) {
        if (edgeIds.has(e.id))
          ctx.addIssue({
            code: "custom",
            path: ["edges", i, "id"],
            message: `Duplicate edge id: ${e.id}`,
          });
        edgeIds.add(e.id);
      }
      if (!conceptIds.has(e.source))
        ctx.addIssue({
          code: "custom",
          path: ["edges", i, "source"],
          message: `Edge references missing source concept: ${e.source}`,
        });
      if (!conceptIds.has(e.target))
        ctx.addIssue({
          code: "custom",
          path: ["edges", i, "target"],
          message: `Edge references missing target concept: ${e.target}`,
        });
      if (e.source === e.target)
        ctx.addIssue({
          code: "custom",
          path: ["edges", i],
          message: `Self-loop edge on ${e.source}`,
        });
      // Symmetric relations (e.g. related_to) read the same in either
      // direction, so A→B and B→A are the same fact — canonicalize the pair.
      const [pa, pb] = RELATIONS[e.relation].symmetric
        ? [e.source, e.target].sort()
        : [e.source, e.target];
      const key = `${pa} ${pb} ${e.relation}`;
      if (semantic.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["edges", i],
          message: `Duplicate semantic edge: ${e.source} ${e.relation} ${e.target}`,
        });
      semantic.add(key);
    }
  });

export type SourceGraph = z.infer<typeof SourceGraphSchema>;
export type SourceConcept = z.infer<typeof SourceConceptSchema>;
export type SourceEdge = z.infer<typeof SourceEdgeSchema>;
export type SourceDomain = z.infer<typeof SourceDomainSchema>;
