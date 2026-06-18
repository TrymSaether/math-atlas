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
import { z } from "zod";
import { db } from "../db/client";
import { mapCollaborators, maps, mapSources } from "../db/schema";
import { auth } from "../auth";
import { SourceGraphSchema } from "../../src/data/sourceSchema";
import { buildArtifact } from "../../src/data/buildArtifact";

export const mapsRoute = new Hono();

type Role = "owner" | "editor" | "viewer";

async function getUserId(c: { req: { raw: Request } }): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

type MapRow = typeof maps.$inferSelect;

/** Resolve a caller's access to a map, or null if the map doesn't exist / is hidden. */
async function resolveAccess(
  mapId: string,
  userId: string | null,
): Promise<{ map: MapRow; role: Role } | null> {
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

  return c.json(catalog);
});

/** GET /api/maps/:id — the map's source, if readable by the caller. */
mapsRoute.get("/:id", async (c) => {
  const userId = await getUserId(c);
  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access) return c.json({ error: "Not found" }, 404);

  const [src] = await db
    .select({ source: mapSources.source, baseVersion: mapSources.baseVersion })
    .from(mapSources)
    .where(eq(mapSources.mapId, access.map.id))
    .limit(1);

  return c.json({
    id: access.map.id,
    slug: access.map.slug,
    title: access.map.title,
    visibility: access.map.visibility,
    role: access.role,
    updated: access.map.updatedAt.toISOString(),
    baseVersion: src?.baseVersion ?? 0,
    source: src?.source ?? null,
  });
});

// ---------------------------------------------------------------------------
// Authed mutations
// ---------------------------------------------------------------------------

const ForkBody = z.object({ fromId: z.string().min(1) });

/** POST /api/maps — fork a readable map into the caller's own editable copy. */
mapsRoute.post("/", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = ForkBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid request body" }, 400);

  const access = await resolveAccess(body.data.fromId, userId);
  if (!access) return c.json({ error: "Not found" }, 404);

  // Idempotent: one fork per (user, slug) — return the existing copy if present.
  const [mine] = await db
    .select({ id: maps.id })
    .from(maps)
    .where(and(eq(maps.ownerId, userId), eq(maps.slug, access.map.slug)))
    .limit(1);
  if (mine) return c.json({ id: mine.id, slug: access.map.slug });

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

  return c.json({ id: newId, slug: access.map.slug });
});

const PutBody = z.object({ baseVersion: z.number().int().nonnegative(), source: z.unknown() });

/** PUT /api/maps/:id — save source; owner or editor only. */
mapsRoute.put("/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access || (access.role !== "owner" && access.role !== "editor")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = PutBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid request body" }, 400);

  const valid = validateSource(body.data.source);
  if (!valid.ok) return c.json({ error: valid.error }, 400);

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(maps).set({ updatedAt: now }).where(eq(maps.id, access.map.id));
    await tx
      .update(mapSources)
      .set({ source: body.data.source, baseVersion: body.data.baseVersion, updatedAt: now })
      .where(eq(mapSources.mapId, access.map.id));
  });

  return c.json({ id: access.map.id, updated: now.toISOString() });
});

/** DELETE /api/maps/:id — owner only. */
mapsRoute.delete("/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const access = await resolveAccess(c.req.param("id"), userId);
  if (!access || access.role !== "owner") return c.json({ error: "Forbidden" }, 403);

  await db.delete(maps).where(eq(maps.id, access.map.id));
  return c.body(null, 204);
});
