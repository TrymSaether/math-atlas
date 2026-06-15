/**
 * Artifact schema — the built output the app imports.
 *
 * Produced from the source graph by scripts/build-maps.ts. It is already
 * validated; the runtime does NOT re-parse it, it only builds cheap in-memory
 * indexes (adjacency, groupings) as today. Edges are stored single-direction
 * (from = prerequisite, to = dependent for dependency edges); reverse adjacency
 * and inverse labels are derived at render time via ./relations, not stored.
 *
 * The node shape is *derived* from the authored `SourceConceptSchema` plus the
 * two build-time fields (`degree`, `depth`) — see ArtifactNodeSchema. Deriving
 * rather than re-declaring keeps the artifact's field types (e.g. the `priority`
 * enum, the proof-step shape) in lockstep with the source, so there is no drift
 * to paper over with casts in the load/edit paths.
 */
import { z } from "zod";
import { DOMAIN_PALETTE_KEYS } from "../lib/palette";
import { RELATION_KEYS } from "./relations";
import { SourceConceptSchema } from "./sourceSchema";

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
  edges: z.array(ArtifactEdgeSchema),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type ArtifactNode = z.infer<typeof ArtifactNodeSchema>;
export type ArtifactEdge = z.infer<typeof ArtifactEdgeSchema>;
