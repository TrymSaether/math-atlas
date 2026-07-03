import { describe, expect, it } from "vitest";
import {
  ForkMapRequestSchema,
  MapCatalogResponseSchema,
  MapDetailResponseSchema,
  MapPayloadSchema,
  ProgressResponseSchema,
  PutProgressRequestSchema,
  SaveMapConflictResponseSchema,
  SaveMapRequestSchema,
} from "./index";

describe("map API contracts", () => {
  it("accepts the current catalog response shape and roles", () => {
    const catalog = [
      {
        id: "map-1",
        slug: "topology",
        title: "Topology",
        visibility: "public",
        ownerId: "system",
        updated: "2026-06-27T12:00:00.000Z",
        role: "public",
      },
      {
        id: "map-2",
        slug: "topology",
        title: "Topology",
        visibility: "private",
        ownerId: "user-1",
        updated: "2026-06-27T12:01:00.000Z",
        role: "owner",
      },
    ];

    expect(MapCatalogResponseSchema.parse(catalog)).toEqual(catalog);
    expect(() => MapCatalogResponseSchema.parse([{ ...catalog[0], role: "viewer" }])).toThrow();
  });

  it("keeps server detail roles distinct from the development fallback role", () => {
    const detail = {
      id: "map-1",
      slug: "topology",
      title: "Topology",
      visibility: "public",
      role: "viewer",
      updated: "2026-06-27T12:00:00.000Z",
      baseVersion: 3,
      source: { id: "topology" },
    };

    expect(MapDetailResponseSchema.parse(detail)).toEqual(detail);
    expect(() => MapDetailResponseSchema.parse({ ...detail, role: "public" })).toThrow();
    expect(MapPayloadSchema.parse({ ...detail, role: "public", visibility: undefined })).toMatchObject({
      role: "public",
    });
  });

  it("preserves request defaulting and unknown-key stripping", () => {
    expect(ForkMapRequestSchema.parse({ fromId: "map-1", ignored: true })).toEqual({ fromId: "map-1" });
    expect(
      SaveMapRequestSchema.parse({ baseVersion: 2, source: { id: "topology" }, baseUpdated: undefined, ignored: true }),
    ).toEqual({ baseVersion: 2, source: { id: "topology" }, baseUpdated: undefined });
  });

  it("validates the existing conflict body", () => {
    expect(SaveMapConflictResponseSchema.parse({ error: "conflict", updated: "2026-06-27T12:00:00.000Z" })).toEqual({
      error: "conflict",
      updated: "2026-06-27T12:00:00.000Z",
    });
    expect(() => SaveMapConflictResponseSchema.parse({ error: "stale", updated: "now" })).toThrow();
  });
});

describe("progress API contracts", () => {
  it("accepts only the existing progress statuses", () => {
    expect(
      ProgressResponseSchema.parse([
        { nodeId: "open_set", status: "learning" },
        { nodeId: "closed_set", status: "known" },
      ]),
    ).toHaveLength(2);
    expect(() => ProgressResponseSchema.parse([{ nodeId: "open_set", status: "mastered" }])).toThrow();
  });

  it("preserves progress request validation and unknown-key stripping", () => {
    expect(PutProgressRequestSchema.parse({ nodeId: "open_set", status: "known", ignored: true })).toEqual({
      nodeId: "open_set",
      status: "known",
    });
    expect(() => PutProgressRequestSchema.parse({ nodeId: "", status: "known" })).toThrow();
  });
});
