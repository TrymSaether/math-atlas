import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  selectResults: [] as unknown[][],
  insertedValues: [] as unknown[],
}));

vi.mock("../auth", () => ({
  auth: { api: { getSession: routeMocks.getSession } },
}));

vi.mock("../db/client", () => {
  const query = (result: unknown[]) => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.innerJoin = vi.fn(() => chain);
    chain.limit = vi.fn(() => Promise.resolve(result));
    chain.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject);
    return chain;
  };

  const mutation = () => {
    const chain: Record<string, unknown> = {};
    chain.values = vi.fn((values: unknown) => {
      routeMocks.insertedValues.push(values);
      return chain;
    });
    chain.onConflictDoUpdate = vi.fn(() => Promise.resolve());
    chain.returning = vi.fn(() => Promise.resolve([{ id: "created-map" }]));
    chain.set = vi.fn(() => chain);
    chain.where = vi.fn(() => Promise.resolve());
    return chain;
  };

  return {
    db: {
      select: vi.fn(() => query(routeMocks.selectResults.shift() ?? [])),
      insert: vi.fn(() => mutation()),
      update: vi.fn(() => mutation()),
      delete: vi.fn(() => mutation()),
      transaction: vi.fn(async (run: (tx: unknown) => unknown) =>
        run({ insert: vi.fn(() => mutation()), update: vi.fn(() => mutation()) }),
      ),
    },
  };
});

import { mapsRoute } from "./maps";
import { progressRoute } from "./progress";

beforeEach(() => {
  routeMocks.getSession.mockReset();
  routeMocks.selectResults.length = 0;
  routeMocks.insertedValues.length = 0;
});

describe("map routes", () => {
  it("returns the existing anonymous catalog shape", async () => {
    routeMocks.getSession.mockResolvedValue(null);
    routeMocks.selectResults.push([
      {
        id: "public-map",
        slug: "topology",
        title: "Topology",
        visibility: "public",
        ownerId: "system",
        updated: new Date("2026-06-27T12:00:00.000Z"),
      },
      {
        id: "private-map",
        slug: "private_notes",
        title: "Private notes",
        visibility: "private",
        ownerId: "user-1",
        updated: new Date("2026-06-27T12:00:00.000Z"),
      },
    ]);

    const response = await mapsRoute.request("/catalog");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: "public-map",
        slug: "topology",
        title: "Topology",
        visibility: "public",
        ownerId: "system",
        updated: "2026-06-27T12:00:00.000Z",
        role: "public",
      },
    ]);
  });

  it("returns the existing public-map detail shape", async () => {
    routeMocks.getSession.mockResolvedValue(null);
    routeMocks.selectResults.push(
      [
        {
          id: "public-map",
          slug: "topology",
          title: "Topology",
          visibility: "public",
          ownerId: "system",
          createdAt: new Date("2026-06-27T11:00:00.000Z"),
          updatedAt: new Date("2026-06-27T12:00:00.000Z"),
        },
      ],
      [{ source: { id: "topology" }, baseVersion: 4 }],
    );

    const response = await mapsRoute.request("/public-map");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "public-map",
      slug: "topology",
      title: "Topology",
      visibility: "public",
      role: "viewer",
      updated: "2026-06-27T12:00:00.000Z",
      baseVersion: 4,
      source: { id: "topology" },
    });
  });

  it("preserves unauthorized fork status and body", async () => {
    routeMocks.getSession.mockResolvedValue(null);

    const response = await mapsRoute.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromId: "public-map" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});

describe("progress routes", () => {
  it("preserves unauthorized status and body", async () => {
    routeMocks.getSession.mockResolvedValue(null);

    const response = await progressRoute.request("/topology");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns only learning and known progress entries", async () => {
    routeMocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    routeMocks.selectResults.push([
      { nodeId: "open_set", status: "learning" },
      { nodeId: "closed_set", status: "known" },
    ]);

    const response = await progressRoute.request("/topology");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { nodeId: "open_set", status: "learning" },
      { nodeId: "closed_set", status: "known" },
    ]);
  });

  it("preserves invalid progress request status and body", async () => {
    routeMocks.getSession.mockResolvedValue({ user: { id: "user-1" } });

    const response = await progressRoute.request("/topology", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeId: "open_set", status: "mastered" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request body" });
  });

  it("preserves progress upsert response", async () => {
    routeMocks.getSession.mockResolvedValue({ user: { id: "user-1" } });

    const response = await progressRoute.request("/topology", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeId: "open_set", status: "known" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(routeMocks.insertedValues).toEqual([
      { userId: "user-1", mapId: "topology", nodeId: "open_set", status: "known" },
    ]);
  });
});
