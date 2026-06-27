import { z } from "zod";

export const MapVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export const MapRoleSchema = z.enum(["owner", "editor", "viewer", "public"]);
export const CatalogMapRoleSchema = z.enum(["owner", "editor", "public"]);
export const MapAccessRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const CollaboratorRoleSchema = z.enum(["editor", "viewer"]);

export const MapCatalogEntrySchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    visibility: MapVisibilitySchema,
    ownerId: z.string(),
    updated: z.string(),
    role: CatalogMapRoleSchema,
  })
  .strict();

export const MapCatalogResponseSchema = z.array(MapCatalogEntrySchema);

export const MapDetailResponseSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    visibility: MapVisibilitySchema,
    role: MapAccessRoleSchema,
    updated: z.string(),
    baseVersion: z.number().int().nonnegative(),
    source: z.unknown(),
  })
  .strict();

/** Browser payload also accepts the public role used by the development fallback. */
export const MapPayloadSchema = MapDetailResponseSchema.extend({
  visibility: MapVisibilitySchema.optional(),
  role: MapRoleSchema,
});

export const ForkMapRequestSchema = z.object({ fromId: z.string().min(1) });
export const ForkMapResponseSchema = z.object({ id: z.string(), slug: z.string() }).strict();

export const SaveMapRequestSchema = z.object({
  baseVersion: z.number().int().nonnegative(),
  source: z.unknown(),
  baseUpdated: z.string().optional(),
});
export const SaveMapResponseSchema = z.object({ id: z.string(), updated: z.string() }).strict();
export const SaveMapConflictResponseSchema = z.object({ error: z.literal("conflict"), updated: z.string() }).strict();

export const CollaboratorSchema = z
  .object({
    userId: z.string(),
    role: CollaboratorRoleSchema,
    email: z.string(),
    name: z.string(),
  })
  .strict();
export const CollaboratorsResponseSchema = z.array(CollaboratorSchema);
export const AddCollaboratorRequestSchema = z.object({
  email: z.string().min(1),
  role: CollaboratorRoleSchema.default("editor"),
});

export type MapVisibility = z.infer<typeof MapVisibilitySchema>;
export type MapRole = z.infer<typeof MapRoleSchema>;
export type MapCatalogEntry = z.infer<typeof MapCatalogEntrySchema>;
export type MapPayload = z.infer<typeof MapPayloadSchema>;
export type Collaborator = z.infer<typeof CollaboratorSchema>;
