/**
 * Maps as first-class entities (Stage A).
 *
 *   - Public/system maps (seeded, owner "system", visibility "public") are
 *     readable by anyone — no auth — so the site stays browseable logged out.
 *   - Signed-in users fork a map to get their own editable copy (one per slug),
 *     save its source, and (Stage C) invite collaborators.
 *
 * Sources are validated with the same SourceGraphSchema + buildArtifact gate the
 * client and CLI use, so an invalid graph can never be persisted.
 */
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import {
  AddCollaboratorRequestSchema,
  ApiErrorSchema,
  CollaboratorsResponseSchema,
  ForkMapRequestSchema,
  ForkMapResponseSchema,
  MapCatalogResponseSchema,
  MapDetailResponseSchema,
  OkResponseSchema,
  SaveMapConflictResponseSchema,
  SaveMapRequestSchema,
  SaveMapResponseSchema,
} from "../../shared/atlas/contracts";
import { db } from "../db/client";
import { mapCollaborators, maps, mapSources, user } from "../db/schema";
import { auth } from "../auth";
import { SourceGraphSchema } from "../../src/data/sourceSchema";
import { buildArtifact } from "../../src/data/buildArtifact";

export const mapsRoute = new Hono();

type Role = "owner" | "editor" | "viewer";

const apiError = (error: string) => ApiErrorSchema.parse({ error });

async function getUserId(c: { req: { raw: Request } }): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

type MapRow = typeof maps.$inferSelect;

/** Resolve a caller's access to a map, or null if the map doesn't exist / is hidden. */
async function resolveAccess(mapId: string, userId: string | null): Promise<{ map: MapRow; role: Role } | null> {
  const [map] = await db.select().from(maps).where(eq(maps.id, mapId)).limit(1);
  if (!map) return null;
  if (userId && map.ownerId === userId) return { map, role: "owner" };
  if (userId) {
    const [collab] = await db
      .select({ role: mapCollaborators.role })
      .from(mapCollaborators)
      .where(and(eq(mapCollaborators.mapId, mapId), eq(mapCollaborators.userId, userId)))
      .limit(1);
    if (collab) return { map, role: collab.role as Role };
  }
  if (map.visibility === "public") return { map, role: "viewer" };
  return null;
}

function validateSource(source: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = SourceGraphSchema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".") || "graph"}: ${i.message}`)
      .join("; ");
    return { ok: false, error: `Invalid source: ${msg}` };
  }
  try {
    buildArtifact(parsed.data);
  } catch (e) {
    return { ok: false, error: `Build failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Public reads (no auth required; auth refines what's visible)
// ---------------------------------------------------------------------------

/** GET /api/maps/catalog — public maps, plus the caller's own + shared-with-me. */
mapsRoute.get("/catalog", async (c) => {
  const userId = await getUserId(c);

  const rows = await db
    .select({
      id: maps.id,
      slug: maps.slug,
      title: maps.title,
      visibility: maps.visibility,
      ownerId: maps.ownerId,
      updated: maps.updatedAt,
    })
    .from(maps);

  const sharedIds = userId
    ? new Set(
        (
          await db
            .select({ mapId: mapCollaborators.mapId })
            .from(mapCollaborators)
            .where(eq(mapCollaborators.userId, userId))
        ).map((r) => r.mapId),
      )
    : new Set<string>();

  const catalog = rows
    .map((m) => {
      const role: Role | "public" | null =
        userId && m.ownerId === userId
          ? "owner"
          : sharedIds.has(m.id)
            ? "editor"
            : m.visibility === "public"
              ? "public"
              : null;
      return role ? { ...m, role, updated: m.updated.toISOString() } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return c.json(MapCatalogResponseSchema.parse(catalog));
});

/** GET /api/maps/:id — the map's source, if readable by the caller. */
mapsRoute.get("/:id", async (c) => {
  const userId = await getUserId(c);
  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access) return c.json(apiError("Not found"), 404);

  const [src] = await db
    .select({ source: mapSources.source, baseVersion: mapSources.baseVersion })
    .from(mapSources)
    .where(eq(mapSources.mapId, access.map.id))
    .limit(1);

  return c.json(
    MapDetailResponseSchema.parse({
      id: access.map.id,
      slug: access.map.slug,
      title: access.map.title,
      visibility: access.map.visibility,
      role: access.role,
      updated: access.map.updatedAt.toISOString(),
      baseVersion: src?.baseVersion ?? 0,
      source: src?.source ?? null,
    }),
  );
});

// ---------------------------------------------------------------------------
// Authed mutations
// ---------------------------------------------------------------------------

/** POST /api/maps — fork a readable map into the caller's own editable copy. */
mapsRoute.post("/", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);

  const body = ForkMapRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json(apiError("Invalid request body"), 400);

  const access = await resolveAccess(body.data.fromId, userId);
  if (!access) return c.json(apiError("Not found"), 404);

  // Idempotent: one fork per (user, slug) — return the existing copy if present.
  const [mine] = await db
    .select({ id: maps.id })
    .from(maps)
    .where(and(eq(maps.ownerId, userId), eq(maps.slug, access.map.slug)))
    .limit(1);
  if (mine) return c.json(ForkMapResponseSchema.parse({ id: mine.id, slug: access.map.slug }));

  const [src] = await db
    .select({ source: mapSources.source, baseVersion: mapSources.baseVersion })
    .from(mapSources)
    .where(eq(mapSources.mapId, access.map.id))
    .limit(1);

  const newId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(maps)
      .values({
        ownerId: userId,
        slug: access.map.slug,
        title: access.map.title,
        visibility: "private",
      })
      .returning({ id: maps.id });
    await tx.insert(mapSources).values({
      mapId: created.id,
      source: src?.source ?? {},
      baseVersion: src?.baseVersion ?? 0,
    });
    return created.id;
  });

  return c.json(ForkMapResponseSchema.parse({ id: newId, slug: access.map.slug }));
});

/** PUT /api/maps/:id — save source; owner or editor only. */
mapsRoute.put("/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);

  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access || (access.role !== "owner" && access.role !== "editor")) {
    return c.json(apiError("Forbidden"), 403);
  }

  const body = SaveMapRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json(apiError("Invalid request body"), 400);

  const valid = validateSource(body.data.source);
  if (!valid.ok) return c.json(apiError(valid.error), 400);

  // Last-write-wins conflict guard: if the map changed since the client last saw
  // it (a collaborator saved underneath them), reject so they can reload.
  if (body.data.baseUpdated && access.map.updatedAt > new Date(body.data.baseUpdated)) {
    return c.json(
      SaveMapConflictResponseSchema.parse({ error: "conflict", updated: access.map.updatedAt.toISOString() }),
      409,
    );
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(maps).set({ updatedAt: now }).where(eq(maps.id, access.map.id));
    await tx
      .update(mapSources)
      .set({ source: body.data.source, baseVersion: body.data.baseVersion, updatedAt: now })
      .where(eq(mapSources.mapId, access.map.id));
  });

  return c.json(SaveMapResponseSchema.parse({ id: access.map.id, updated: now.toISOString() }));
});

/** DELETE /api/maps/:id — owner only. */
mapsRoute.delete("/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);

  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access || access.role !== "owner") return c.json(apiError("Forbidden"), 403);

  await db.delete(maps).where(eq(maps.id, access.map.id));
  return c.body(null, 204);
});

// ---------------------------------------------------------------------------
// Collaborators (Phase 4 — shared maps)
// ---------------------------------------------------------------------------

/** Owner-only guard for collaborator management. Returns the map or a Response. */
async function requireOwner(c: {
  req: { raw: Request; param: (k: string) => string };
}): Promise<{ map: MapRow } | Response> {
  const userId = await getUserId(c);
  if (!userId) return new Response(JSON.stringify(apiError("Unauthorized")), { status: 401 });
  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access || access.role !== "owner") {
    return new Response(JSON.stringify(apiError("Forbidden")), { status: 403 });
  }
  return { map: access.map };
}

/** GET /api/maps/:id/collaborators — owner lists collaborators. */
mapsRoute.get("/:id/collaborators", async (c) => {
  const owned = await requireOwner(c);
  if (owned instanceof Response) return owned;
  const rows = await db
    .select({
      userId: mapCollaborators.userId,
      role: mapCollaborators.role,
      email: user.email,
      name: user.name,
    })
    .from(mapCollaborators)
    .innerJoin(user, eq(user.id, mapCollaborators.userId))
    .where(eq(mapCollaborators.mapId, owned.map.id));
  return c.json(CollaboratorsResponseSchema.parse(rows));
});

/** POST /api/maps/:id/collaborators — owner invites a user by email. */
mapsRoute.post("/:id/collaborators", async (c) => {
  const owned = await requireOwner(c);
  if (owned instanceof Response) return owned;

  const body = AddCollaboratorRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json(apiError("Invalid request body"), 400);

  const email = body.data.email.trim().toLowerCase();
  const [target] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!target) return c.json(apiError("No account with that email"), 404);
  if (target.id === owned.map.ownerId) return c.json(apiError("You own this map"), 400);

  await db
    .insert(mapCollaborators)
    .values({ mapId: owned.map.id, userId: target.id, role: body.data.role })
    .onConflictDoUpdate({
      target: [mapCollaborators.mapId, mapCollaborators.userId],
      set: { role: body.data.role },
    });
  return c.json(OkResponseSchema.parse({ ok: true }));
});

/** DELETE /api/maps/:id/collaborators/:userId — owner removes a collaborator. */
mapsRoute.delete("/:id/collaborators/:userId", async (c) => {
  const owned = await requireOwner(c);
  if (owned instanceof Response) return owned;
  await db
    .delete(mapCollaborators)
    .where(and(eq(mapCollaborators.mapId, owned.map.id), eq(mapCollaborators.userId, c.req.param("userId"))));
  return c.body(null, 204);
});
