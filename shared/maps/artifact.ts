/**
 * Artifact schema — the normalized graph shape the app renders.
 *
 * Produced from the source graph by buildArtifact, both in the validation path
 * and when API/database map sources are loaded in the browser. Edges are stored
 * single-direction (from = prerequisite, to = dependent for dependency edges);
 * reverse adjacency and inverse labels are derived at render time via
 * ./relations, not stored.
 *
 * The node shape is *derived* from the authored `SourceConceptSchema` plus the
 * two build-time fields (`degree`, `depth`) — see ArtifactNodeSchema. Deriving
 * rather than re-declaring keeps the artifact's field types (e.g. the `priority`
 * enum, the proof-step shape) in lockstep with the source, so there is no drift
 * to paper over with casts in the load/edit paths.
 */
import { z } from "zod";
import { DOMAIN_PALETTE_KEYS } from "./palette.ts";
import { RELATION_KEYS } from "./relations.ts";
import { SourceConceptSchema } from "./source.ts";

export const ARTIFACT_VERSION = 1;

/** Source concept + the fields the build derives. */
export const ArtifactNodeSchema = SourceConceptSchema.extend({
  degree: z.number().int().nonnegative(),
  depth: z.number().int().nonnegative(),
});

export const ArtifactEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  relation: z.enum(RELATION_KEYS),
  isDependency: z.boolean(),
  /**
   * Which dependency layer the edge belongs to:
   * - `statement` — needed to understand the concept's statement/definition (the
   *   authored edges; the definitional backbone).
   * - `proof` — needed only to follow the proof (materialized from a concept's
   *   `proof.steps[].uses`). Lives in `proofEdges`, never in `edges`.
   * Absent on legacy artifacts ⇒ treated as `statement`.
   */
  scope: z.enum(["statement", "proof"]).default("statement"),
});

export const ArtifactSchema = z.object({
  artifactVersion: z.literal(ARTIFACT_VERSION),
  id: z.string(),
  label: z.string(),
  field: z.string(),
  version: z.number().int().positive(),
  domains: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      order: z.number().int(),
      palette: z.enum(DOMAIN_PALETTE_KEYS),
    }),
  ),
  nodes: z.array(ArtifactNodeSchema),
  /** The definitional backbone — authored, statement-scope edges. */
  edges: z.array(ArtifactEdgeSchema),
  /**
   * The proof-dependency overlay: scope-`proof` edges derived from each concept's
   * `proof.steps[].uses`, oriented prereq → dependent. Kept in a separate layer so
   * the definitional graph (and everything that renders it) is untouched; routing
   * opts in to it for "able to prove it" paths.
   */
  proofEdges: z.array(ArtifactEdgeSchema).default([]),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type ArtifactNode = z.infer<typeof ArtifactNodeSchema>;
export type ArtifactEdge = z.infer<typeof ArtifactEdgeSchema>;
export type EdgeScope = ArtifactEdge["scope"];
