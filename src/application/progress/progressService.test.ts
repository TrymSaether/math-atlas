import { describe, expect, it, vi } from "vitest";
import { createProgressService } from "./progressService";

describe("progress service", () => {
  it("loads progress through the API port", async () => {
    const rows = [{ nodeId: "open_set", status: "known" as const }];
    const fetchProgress = vi.fn(async () => rows);
    const service = createProgressService({
      fetchProgress,
      putProgress: vi.fn(async () => undefined),
      deleteProgress: vi.fn(async () => undefined),
    });

    await expect(service.load("topology")).resolves.toEqual(rows);
    expect(fetchProgress).toHaveBeenCalledWith("topology");
  });

  it("routes optimistic persistence to put or delete without changing semantics", async () => {
    const putProgress = vi.fn(async () => undefined);
    const deleteProgress = vi.fn(async () => undefined);
    const service = createProgressService({ fetchProgress: vi.fn(async () => []), putProgress, deleteProgress });

    await service.save("topology", "open_set", "learning");
    await service.save("topology", "open_set", null);

    expect(putProgress).toHaveBeenCalledWith("topology", "open_set", "learning");
    expect(deleteProgress).toHaveBeenCalledWith("topology", "open_set");
  });
});
