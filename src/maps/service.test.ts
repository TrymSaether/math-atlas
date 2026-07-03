import { describe, expect, it, vi } from "vitest";
import type { SourceGraph } from "@shared/maps/source";
import type { MapPayload } from "./api";
import { createMapService, type MapServiceDependencies } from "./service";

const source: SourceGraph = {
  id: "topology",
  label: "Topology",
  field: "Topology",
  version: 3,
  updated: "2026-06-27",
  domains: [{ id: "core", label: "Core", order: 0, palette: "blue" }],
  concepts: [
    {
      id: "open_set",
      kind: "definition",
      domain: "core",
      label: "Open Set",
      content: { notation: [] },
      examples: [],
      assumptions: [],
      properties: [],
      tags: [],
      priority: "core",
    },
  ],
  edges: [],
};

function payload(overrides: Partial<MapPayload> = {}): MapPayload {
  return {
    id: "public-map",
    slug: "topology",
    title: "Topology",
    role: "viewer",
    updated: "2026-06-27T12:00:00.000Z",
    baseVersion: 3,
    source,
    ...overrides,
  };
}

function dependencies(overrides: Partial<MapServiceDependencies> = {}): MapServiceDependencies {
  return {
    fetchCatalog: vi.fn(async () => []),
    fetchMap: vi.fn(async () => payload()),
    forkMap: vi.fn(async () => ({ id: "owned-map", slug: "topology" })),
    saveMapSource: vi.fn(async () => ({ ok: true as const, updated: "2026-06-27T12:05:00.000Z" })),
    deleteMap: vi.fn(async () => undefined),
    getCachedCatalog: vi.fn(() => null),
    setCachedCatalog: vi.fn(),
    getCachedMap: vi.fn(() => null),
    setCachedMap: vi.fn(),
    clearCachedMap: vi.fn(),
    ...overrides,
  };
}

describe("map service", () => {
  it("preserves cache-first loading and background revalidation", async () => {
    const cached = payload({ updated: "2026-06-27T11:00:00.000Z" });
    const remote = payload({ updated: "2026-06-27T12:00:00.000Z" });
    const deps = dependencies({
      getCachedMap: vi.fn(() => cached),
      fetchMap: vi.fn(async () => remote),
    });
    const service = createMapService(deps);

    const loaded = await service.loadMap("public-map");
    await Promise.resolve();

    expect(loaded.payload).toBe(cached);
    expect(loaded.map.data.id).toBe("topology");
    expect(deps.fetchMap).toHaveBeenCalledWith("public-map");
    expect(deps.setCachedMap).toHaveBeenCalledWith(remote);
  });

  it("preserves catalog cache fallback on fetch failure", async () => {
    const cached = [{ slug: "topology", title: "Topology", id: "public-map", role: "public" as const, updated: "" }];
    const error = new Error("offline");
    const service = createMapService(
      dependencies({
        fetchCatalog: vi.fn(async () => {
          throw error;
        }),
        getCachedCatalog: vi.fn(() => cached),
      }),
    );

    await expect(service.loadCatalog()).resolves.toEqual({ ok: false, cached, error });
  });

  it("preserves the public edit → fork → save → cache → reload workflow", async () => {
    let savedPayload: MapPayload | null = null;
    const deps = dependencies({
      setCachedMap: vi.fn((next) => {
        savedPayload = next;
      }),
      fetchMap: vi.fn(async () => payload({ id: "owned-map", role: "owner" })),
    });
    const service = createMapService(deps);
    const onForked = vi.fn();

    const outcome = await service.saveMap({
      slug: "topology",
      source,
      meta: { id: "public-map", role: "viewer", baseVersion: 3, updated: "2026-06-27T12:00:00.000Z" },
      catalog: [{ slug: "topology", title: "Topology", id: "public-map", role: "public", updated: "" }],
      onForked,
    });

    expect(onForked).toHaveBeenCalledWith(
      { id: "owned-map", role: "owner", baseVersion: 3, updated: "" },
      { slug: "topology", id: "owned-map", role: "owner", title: "Topology", updated: "" },
    );
    expect(outcome).toEqual({
      status: "saved",
      meta: { id: "owned-map", role: "owner", baseVersion: 3, updated: "2026-06-27T12:05:00.000Z" },
    });
    expect(savedPayload).toMatchObject({ id: "owned-map", slug: "topology", role: "owner", source });

    service.clearMapCache("owned-map");
    const reloaded = await service.loadMap("owned-map");
    expect(deps.clearCachedMap).toHaveBeenCalledWith("owned-map");
    expect(reloaded.payload.id).toBe("owned-map");
  });

  it("surfaces save conflicts without updating the cache", async () => {
    const deps = dependencies({
      saveMapSource: vi.fn(async () => ({ ok: false as const, conflict: true as const, updated: "later" })),
    });
    const service = createMapService(deps);

    const outcome = await service.saveMap({
      slug: "topology",
      source,
      meta: { id: "owned-map", role: "owner", baseVersion: 3, updated: "before" },
      catalog: [],
      onForked: vi.fn(),
    });

    expect(outcome).toEqual({ status: "conflict" });
    expect(deps.setCachedMap).not.toHaveBeenCalled();
  });

  it("detects only newer matching remote map entities", async () => {
    const service = createMapService(
      dependencies({
        fetchCatalog: vi.fn(async () => [
          {
            slug: "topology",
            title: "Topology",
            id: "owned-map",
            role: "owner" as const,
            updated: "2026-06-27T12:10:00.000Z",
          },
        ]),
      }),
    );

    await expect(
      service.hasRemoteUpdate("topology", {
        id: "owned-map",
        role: "owner",
        baseVersion: 3,
        updated: "2026-06-27T12:05:00.000Z",
      }),
    ).resolves.toBe(true);
  });
});
