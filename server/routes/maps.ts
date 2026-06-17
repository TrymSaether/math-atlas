/**
 * Per-user map overlays (Phase 2 — persist & sync edits).
 *
 * A signed-in user's edits to a shipped map are stored server-side as the full
 * edited SourceGraph, keyed by `slug` (the shipped map id, e.g. "topology").
 * This is the server-backed equivalent of the localStorage overlay in
 * src/data/edits.ts. Sources are validated with the SAME schema + buildArtifact
 * the CLI and client use, so an invalid graph can never be persisted.
 */
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { maps, mapSources } from "../db/schema";
import { auth } from "../auth";
import { SourceGraphSchema } from "../../src/data/sourceSchema";
import { buildArtifact } from "../../src/data/buildArtifact";

type Vars = { userId: string };

export const mapsRoute = new Hono<{ Variables: Vars }>();

// Require an authenticated session (cookie in dev, bearer token in prod).
mapsRoute.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  c.set("userId", session.user.id);
  await next();
});

/** GET /api/maps — list the user's map overlays (metadata only). */
mapsRoute.get("/", async (c) => {
  const userId = c.get("userId");
  const rows = await db
    .select({
      slug: maps.slug,
      title: maps.title,
      baseVersion: mapSources.baseVersion,
      updated: mapSources.updatedAt,
    })
    .from(maps)
    .innerJoin(mapSources, eq(mapSources.mapId, maps.id))
    .where(eq(maps.ownerId, userId));
  return c.json(
    rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      baseVersion: r.baseVersion,
      updated: r.updated.toISOString(),
    })),
  );
});

/** GET /api/maps/:slug — the user's overlay for one map (with source). */
mapsRoute.get("/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const [row] = await db
    .select({
      title: maps.title,
      baseVersion: mapSources.baseVersion,
      updated: mapSources.updatedAt,
      source: mapSources.source,
    })
    .from(maps)
    .innerJoin(mapSources, eq(mapSources.mapId, maps.id))
    .where(and(eq(maps.ownerId, userId), eq(maps.slug, slug)))
    .limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    slug,
    title: row.title,
    baseVersion: row.baseVersion,
    updated: row.updated.toISOString(),
    source: row.source,
  });
});

const PutBody = z.object({
  title: z.string().min(1),
  baseVersion: z.number().int().nonnegative(),
  source: z.unknown(),
});

/** PUT /api/maps/:slug — upsert the user's overlay, validating the source. */
mapsRoute.put("/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");

  const body = PutBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid request body" }, 400);

  // Same gate as the client: strict schema, then buildArtifact invariants.
  const parsed = SourceGraphSchema.safeParse(body.data.source);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".") || "graph"}: ${i.message}`)
      .join("; ");
    return c.json({ error: `Invalid source: ${msg}` }, 400);
  }
  try {
    buildArtifact(parsed.data);
  } catch (e) {
    return c.json({ error: `Build failed: ${e instanceof Error ? e.message : String(e)}` }, 400);
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: maps.id })
      .from(maps)
      .where(and(eq(maps.ownerId, userId), eq(maps.slug, slug)))
      .limit(1);

    const now = new Date();
    if (existing) {
      await tx.update(maps).set({ title: body.data.title, updatedAt: now }).where(eq(maps.id, existing.id));
      await tx
        .update(mapSources)
        .set({ source: parsed.data, baseVersion: body.data.baseVersion, updatedAt: now })
        .where(eq(mapSources.mapId, existing.id));
    } else {
      const [created] = await tx
        .insert(maps)
        .values({ ownerId: userId, slug, title: body.data.title })
        .returning({ id: maps.id });
      await tx.insert(mapSources).values({
        mapId: created.id,
        source: parsed.data,
        baseVersion: body.data.baseVersion,
        updatedAt: now,
      });
    }
    return now;
  });

  return c.json({ slug, updated: updated.toISOString() });
});

/** DELETE /api/maps/:slug — discard the user's overlay (revert to shipped). */
mapsRoute.delete("/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  await db.delete(maps).where(and(eq(maps.ownerId, userId), eq(maps.slug, slug)));
  return c.body(null, 204);
});
