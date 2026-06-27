import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";

describe("useStore characterization", () => {
  const originalUserId = useStore.getState().userId;
  const originalProgress = useStore.getState().progress;

  beforeEach(() => useStore.setState({ userId: null, progress: {} }));
  afterEach(() => useStore.setState({ userId: originalUserId, progress: originalProgress }));

  it("preserves optimistic progress updates while signed out", () => {
    const state = useStore.getState();

    state.setNodeProgress("topology", "open_set", "learning");
    expect(useStore.getState().progress.topology).toEqual({ open_set: "learning" });

    state.setNodeProgress("topology", "open_set", null);
    expect(useStore.getState().progress.topology).toEqual({});
  });

  it("preserves the public store action surface", () => {
    const state = useStore.getState();

    expect(state.ensureMapLoaded).toEqual(expect.any(Function));
    expect(state.loadCatalog).toEqual(expect.any(Function));
    expect(state.reloadActiveMap).toEqual(expect.any(Function));
    expect(state.checkRemoteUpdate).toEqual(expect.any(Function));
    expect(state.onSessionChange).toEqual(expect.any(Function));
    expect(state.loadProgress).toEqual(expect.any(Function));
    expect(state.setNodeProgress).toEqual(expect.any(Function));
  });
});
