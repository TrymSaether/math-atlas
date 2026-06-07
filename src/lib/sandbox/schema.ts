/**
 * Zod schema for the *authored* workspace model — the gate every workspace
 * passes through before the runtime touches it (registry entries and user
 * forks alike). Mirrors the authored types in `model.ts`.
 *
 * Note what is absent: there is no `provenance` field anywhere. Provenance is
 * derived by the runtime, never authored, so it must not be expressible here.
 */

import { z } from "zod";
import type { Workspace } from "./model";

const refOrLiteral = z.union([
  z.string(),
  z.number(),
  z.array(z.number()),
  z.boolean(),
]);

const markStyle = z
  .object({
    color: z.string().optional(),
    width: z.number().optional(),
    dashed: z.boolean().optional(),
    fill: z.boolean().optional(),
    pointSize: z.number().optional(),
  })
  .strict();

const objectBase = {
  id: z.string().min(1),
  name: z.string().optional(),
  label: z.string().optional(),
  style: markStyle.optional(),
  hidden: z.boolean().optional(),
};

const freeScalar = z
  .object({
    ...objectBase,
    kind: z.literal("freeScalar"),
    value: z.number(),
    range: z
      .object({ min: z.number(), max: z.number(), step: z.number().optional() })
      .strict()
      .optional(),
  })
  .strict();

const freePoint = z
  .object({
    ...objectBase,
    kind: z.literal("freePoint"),
    value: z.tuple([z.number(), z.number()]),
  })
  .strict();

const exprObject = z
  .object({
    ...objectBase,
    kind: z.literal("expr"),
    source: z.string().min(1),
    params: z.array(z.string()).optional(),
  })
  .strict();

const constructObject = z
  .object({
    ...objectBase,
    kind: z.literal("construct"),
    ctor: z.enum(["segment", "circle", "line", "polygon", "vector"]),
    args: z.array(refOrLiteral),
  })
  .strict();

const primitiveObject = z
  .object({
    ...objectBase,
    kind: z.literal("primitive"),
    op: z.string().min(1),
    args: z.array(refOrLiteral),
  })
  .strict();

const authoredObject = z
  .object({
    ...objectBase,
    kind: z.literal("authored"),
    claim: z.string().min(1),
    value: refOrLiteral.optional(),
  })
  .strict();

const workspaceObject = z.discriminatedUnion("kind", [
  freeScalar,
  freePoint,
  exprObject,
  constructObject,
  primitiveObject,
  authoredObject,
]);

const viewSpec = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("panel") }).strict(),
  z
    .object({
      kind: z.literal("plane2d"),
      xRange: z.tuple([z.number(), z.number()]).optional(),
      yRange: z.tuple([z.number(), z.number()]).optional(),
    })
    .strict(),
]);

export const workspaceSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    space: z.enum(["2d", "3d"]),
    objects: z.array(workspaceObject),
    views: z.array(viewSpec).min(1),
    parent: z.string().optional(),
  })
  .strict();

/** Parse and validate an untrusted workspace blob (registry JSON or a fork). */
export function parseWorkspace(raw: unknown): Workspace {
  return workspaceSchema.parse(raw) as Workspace;
}

export function safeParseWorkspace(raw: unknown) {
  return workspaceSchema.safeParse(raw);
}
