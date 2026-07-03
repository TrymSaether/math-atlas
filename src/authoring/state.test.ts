import { describe, expect, it, vi } from "vitest";

import type { State } from "@/app/store";
import { buildAtlasMapFromSource } from "@/atlas/model";
import type { SourceGraph } from "@shared/maps/source";
import { emptyDraft } from "./model";
import { createAuthoringSlice, type AuthoringDependencies } from "./state";

const source: SourceGraph = {
  id: "test_map",
  label: "Test Map",
  field: "Topology",
  version: 1,
  updated: "2026-07-03",
  domains: [{ id: "core", label: "Core", order: 0, palette: "blue" }],
  concepts: [
    {
      id: "root",
      kind: "definition",
      domain: "core",
      label: "Root",
      content: { notation: [] },
      examples: [],
      assumptions: [],
      properties: [],
      tags: [],
      priority: "core",
    },
    {
      id: "result",
      kind: "theorem",
      domain: "core",
      label: "Result",
      content: { statement: "A result", notation: [] },
      examples: [],
      assumptions: [],
      properties: [],
      tags: [],
      priority: "standard",
      proof: { steps: [{ role: "Proof", content: "Use the root", uses: ["root"] }] },
    },
  ],
  edges: [{ source: "result", target: "root", relation: "uses" }],
};

function setup(overrides: Partial<State> = {}) {
  const built = buildAtlasMapFromSource(source);
  if (!built.ok) throw new Error(built.error);

  let scheduledTask: (() => Promise<void>) | null = null;
  const saveMap = vi.fn<AuthoringDependencies["service"]["saveMap"]>(async () => ({
    status: "saved" as const,
    meta: { id: "owned-map", role: "owner" as const, baseVersion: 1, updated: "later" },
  }));
  const revertOwnedMap = vi.fn<AuthoringDependencies["service"]["revertOwnedMap"]>(async () => undefined);
  const dependencies: AuthoringDependencies = {
    service: { saveMap, revertOwnedMap },
    schedule: (_slug, task) => {
      scheduledTask = task;
    },
  };

  const state = {
    mapId: "test_map",
    loadedMaps: { test_map: built.map },
    editSources: {},
    editedMaps: new Set<string>(),
    selectedId: null,
    nodeEditor: null,
    userId: null,
    catalog: [],
    mapMeta: {},
    staleMap: null,
    loadCatalog: vi.fn(async () => undefined),
    ensureMapLoaded: vi.fn(async () => undefined),
  } as unknown as State;

  const set = (update: Partial<State> | ((current: State) => Partial<State>)) => {
    Object.assign(state, typeof update === "function" ? update(state) : update);
  };
  const get = () => state;
  Object.assign(state, createAuthoringSlice(set as never, get as never, dependencies));
  Object.assign(state, overrides);

  return {
    state,
    saveMap,
    revertOwnedMap,
    runScheduledSave: async () => {
      if (!scheduledTask) throw new Error("No save was scheduled");
      await scheduledTask();
    },
  };
}

describe("authoring state", () => {
  it("creates a uniquely named concept and selects it", () => {
    const { state } = setup();
    const draft = emptyDraft("core");
    draft.label = "Root";

    expect(state.commitNode(draft)).toEqual({ ok: true, id: "root_2" });
    expect(state.selectedId).toBe("root_2");
    expect(state.editSources.test_map?.concepts.some((concept) => concept.id === "root_2")).toBe(true);
  });

  it("deletes incident edges and proof references with a concept", () => {
    const { state } = setup({ selectedId: "root", nodeEditor: { mode: "edit", nodeId: "root" } });

    expect(state.deleteNode("root")).toEqual({ ok: true, id: undefined });
    const edited = state.editSources.test_map;
    expect(edited?.concepts.map((concept) => concept.id)).toEqual(["result"]);
    expect(edited?.edges).toEqual([]);
    expect(edited?.concepts[0].proof?.steps[0].uses).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(state.nodeEditor).toBeNull();
  });

  it("marks the active map stale when its scheduled save conflicts", async () => {
    const { state, saveMap, runScheduledSave } = setup({
      userId: "user-1",
      mapMeta: { test_map: { id: "owned-map", role: "owner", baseVersion: 1, updated: "before" } },
    });
    saveMap.mockResolvedValueOnce({ status: "conflict" });
    const draft = emptyDraft("core");
    draft.label = "Another concept";

    expect(state.commitNode(draft).ok).toBe(true);
    await runScheduledSave();

    expect(state.staleMap).toBe("test_map");
  });

  it("removes the owned map overlay before reloading on revert", async () => {
    const { state, revertOwnedMap } = setup({
      editSources: { test_map: source },
      editedMaps: new Set(["test_map"]),
      mapMeta: { test_map: { id: "owned-map", role: "owner", baseVersion: 1, updated: "before" } },
    });

    await expect(state.revertMap()).resolves.toEqual({ ok: true });

    expect(revertOwnedMap).toHaveBeenCalledWith(
      state.mapMeta.test_map ?? {
        id: "owned-map",
        role: "owner",
        baseVersion: 1,
        updated: "before",
      },
    );
    expect(state.editSources.test_map).toBeUndefined();
    expect(state.editedMaps.has("test_map")).toBe(false);
    expect(state.loadedMaps.test_map).toBeUndefined();
    expect(state.loadCatalog).toHaveBeenCalled();
    expect(state.ensureMapLoaded).toHaveBeenCalledWith("test_map");
  });
});
