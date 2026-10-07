/**
 * Artifact schema — the built output the app imports.
 *
 * Produced from the source graph by scripts/build-maps.ts. It is already
 * validated; the runtime does NOT re-parse it, it only builds cheap in-memory
 * indexes (adjacency, groupings) as today. Edges are stored single-direction
 * (from = prerequisite, to = dependent for dependency edges); reverse adjacency
 * and inverse labels are derived at render time via ./relations, not stored.
 */
import { z } from "zod";
import { RELATION_KEYS } from "./relations";
import { KIND_VALUES } from "./sourceSchema";

export const ARTIFACT_VERSION = 1;

export const ArtifactNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(KIND_VALUES),
  domain: z.string(),
  label: z.string(),
  content: z.object({
    statement: z.string().optional(),
    definition: z.string().optional(),
    formal: z.string().optional(),
    formula: z.string().optional(),
    intuition: z.string().optional(),
    gloss: z.string().optional(),
    notation: z.array(z.string()),
  }),
  examples: z.array(
    z.object({ tex: z.string(), caption: z.string().optional() }),
  ),
  diagram: z.string().optional(),
  assumptions: z.array(z.string()),
  proof: z
    .object({
      steps: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
          uses: z.array(z.string()),
        }),
      ),
    })
    .optional(),
  source: z
    .object({
      citation: z.string().optional(),
      chapter: z.string().optional(),
      ref: z.string().optional(),
      references: z.array(z.string()),
    })
    .optional(),
  tags: z.array(z.string()),
  priority: z.string(),
  // Derived at build:
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
      palette: z.string(),
    }),
  ),
  nodes: z.array(ArtifactNodeSchema),
  edges: z.array(ArtifactEdgeSchema),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type ArtifactNode = z.infer<typeof ArtifactNodeSchema>;
export type ArtifactEdge = z.infer<typeof ArtifactEdgeSchema>;
