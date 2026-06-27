/**
 * Per-user learning progress (Phase 3).
 *
 * Progress is keyed by map *slug* (not the map entity id) so it follows the
 * subject across forks — your "known" marks on Topology concepts persist whether
 * you're viewing the public map or your own edited copy. All routes require auth.
 */
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import {
  ApiErrorSchema,
  OkResponseSchema,
  ProgressResponseSchema,
  PutProgressRequestSchema,
} from "../../shared/atlas/contracts";
import { db } from "../db/client";
import { userProgress } from "../db/schema";
import { auth } from "../auth";

export const progressRoute = new Hono();

const apiError = (error: string) => ApiErrorSchema.parse({ error });

async function getUserId(c: { req: { raw: Request } }): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

/** GET /api/progress/:mapId — the caller's progress for one map. */
progressRoute.get("/:mapId", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);
  const mapId = c.req.param("mapId");

  const rows = await db
    .select({ nodeId: userProgress.nodeId, status: userProgress.status })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.mapId, mapId)));

  return c.json(ProgressResponseSchema.parse(rows));
});

/** PUT /api/progress/:mapId — upsert a node's status. */
progressRoute.put("/:mapId", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);
  const mapId = c.req.param("mapId");

  const body = PutProgressRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json(apiError("Invalid request body"), 400);

  await db
    .insert(userProgress)
    .values({ userId, mapId, nodeId: body.data.nodeId, status: body.data.status })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.mapId, userProgress.nodeId],
      set: { status: body.data.status, updatedAt: new Date() },
    });

  return c.json(OkResponseSchema.parse({ ok: true }));
});

/** DELETE /api/progress/:mapId/:nodeId — clear a node's status. */
progressRoute.delete("/:mapId/:nodeId", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json(apiError("Unauthorized"), 401);

  await db
    .delete(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.mapId, c.req.param("mapId")),
        eq(userProgress.nodeId, c.req.param("nodeId")),
      ),
    );

  return c.body(null, 204);
});
