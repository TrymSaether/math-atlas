import { describe, expect, it } from "vitest";
import {
  APP_STATE_STORAGE_KEY,
  normalizePersistedState,
  readPersistedState,
  writePersistedState,
  type PersistedState,
} from "./appStateStorage";
import { savedViewportFor, saveViewport, VIEWPORT_STORAGE_KEY } from "./viewportStorage";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("app-state persistence", () => {
  it("reads version 1 data from the established storage key", () => {
    const storage = new MemoryStorage();
    const stored = { version: 1, mapId: "topology", surface: "dictionary" };
    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(stored));

    expect(readPersistedState(storage)).toEqual(stored);
  });

  it("rejects malformed data and unsupported versions", () => {
    const storage = new MemoryStorage();
    storage.setItem(APP_STATE_STORAGE_KEY, "not-json");
    expect(readPersistedState(storage)).toBeNull();

    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify({ version: 2, mapId: "topology" }));
    expect(readPersistedState(storage)).toBeNull();
    expect(readPersistedState(null)).toBeNull();
  });

  it("normalizes fields, clamps focus depth, and filters invalid per-map values", () => {
    expect(
      normalizePersistedState({
        version: 1,
        mapId: "topology",
        searchScope: "title",
        view: "cluster",
        edgeStyle: "invalid",
        focusDepth: 7.6,
        showGrid: true,
        surface: "sandbox",
        mode: "paths",
        routeKind: "path",
        maps: {
          topology: {
            search: "compactness",
            kinds: ["definition", "theorem"],
            topics: "invalid",
            selectedId: null,
          },
          "": { search: "ignored" },
          invalid_map_state: "ignored",
        },
      }),
    ).toEqual({
      version: 1,
      mapId: "topology",
      searchScope: "title",
      view: "cluster",
      showSoftDeps: undefined,
      edgeStyle: undefined,
      edgeLabelStyle: undefined,
      focusMode: undefined,
      focusDepth: 3,
      showGrid: true,
      showRegions: undefined,
      showMinimap: undefined,
      surface: "sandbox",
      mode: "paths",
      routeKind: "path",
      routeIncludeProof: undefined,
      maps: {
        topology: {
          search: "compactness",
          kinds: ["definition", "theorem"],
          topics: undefined,
          relations: undefined,
          selectedId: null,
          routeFrom: undefined,
          routeTo: undefined,
        },
      },
    });
  });

  it("writes the unchanged serialized shape and tolerates unavailable storage", () => {
    const storage = new MemoryStorage();
    const state: PersistedState = {
      version: 1,
      mapId: "fourier_analysis",
      view: "dependency",
      maps: { fourier_analysis: { search: "kernel" } },
    };

    writePersistedState(state, storage);

    expect(storage.getItem(APP_STATE_STORAGE_KEY)).toBe(JSON.stringify(state));
    expect(() => writePersistedState(state, null)).not.toThrow();
  });

  it("tolerates storage access failures", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    const state: PersistedState = { version: 1, mapId: "topology" };

    expect(readPersistedState(storage)).toBeNull();
    expect(() => writePersistedState(state, storage)).not.toThrow();
  });
});

describe("viewport persistence", () => {
  it("returns null for missing, malformed, or unsupported viewport state", () => {
    const storage = new MemoryStorage();
    expect(savedViewportFor("topology", "dependency", storage)).toBeNull();

    storage.setItem(VIEWPORT_STORAGE_KEY, "not-json");
    expect(savedViewportFor("topology", "dependency", storage)).toBeNull();

    storage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify({ version: 2, maps: {} }));
    expect(savedViewportFor("topology", "dependency", storage)).toBeNull();
    expect(savedViewportFor("topology", "dependency", null)).toBeNull();
  });

  it("restores finite coordinates and clamps zoom to the existing limits", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      VIEWPORT_STORAGE_KEY,
      JSON.stringify({ version: 1, maps: { topology: { dependency: { x: 12, y: -8, zoom: 9 } } } }),
    );

    expect(savedViewportFor("topology", "dependency", storage)).toEqual({ x: 12, y: -8, zoom: 2.4 });
  });

  it("saves viewports independently per map and view", () => {
    const storage = new MemoryStorage();

    saveViewport("topology", "dependency", { x: 1, y: 2, zoom: 0.01 }, storage);
    saveViewport("topology", "cluster", { x: 3, y: 4, zoom: 1.2 }, storage);
    saveViewport("fourier_analysis", "dependency", { x: 5, y: 6, zoom: 2 }, storage);

    expect(savedViewportFor("topology", "dependency", storage)).toEqual({ x: 1, y: 2, zoom: 0.08 });
    expect(savedViewportFor("topology", "cluster", storage)).toEqual({ x: 3, y: 4, zoom: 1.2 });
    expect(savedViewportFor("fourier_analysis", "dependency", storage)).toEqual({ x: 5, y: 6, zoom: 2 });
  });

  it("tolerates viewport storage access failures", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };

    expect(savedViewportFor("topology", "dependency", storage)).toBeNull();
    expect(() => saveViewport("topology", "dependency", { x: 0, y: 0, zoom: 1 }, storage)).not.toThrow();
  });
});
