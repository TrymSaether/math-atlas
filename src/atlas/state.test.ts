import { beforeEach, describe, expect, it } from "vitest";

import { useStore } from "@/app/store";

describe("atlas route state", () => {
  beforeEach(() => {
    useStore.setState({
      selectedId: null,
      routeKind: "path",
      routeMode: true,
      routeFrom: null,
      routeTo: null,
      routeRunKey: 0,
      routeSequence: [],
      tourIndex: null,
      mode: "explore",
    });
  });

  it("builds a path from two concept picks", () => {
    useStore.getState().pickRoutePoint("open_set");
    expect(useStore.getState()).toMatchObject({ routeFrom: "open_set", routeTo: null, routeMode: true });

    useStore.getState().pickRoutePoint("continuity");
    expect(useStore.getState()).toMatchObject({
      routeFrom: "open_set",
      routeTo: "continuity",
      routeMode: false,
      routeRunKey: 1,
    });
  });

  it("uses the selected concept as the prerequisite goal", () => {
    useStore.setState({ selectedId: "compactness", routeKind: "prereq", routeMode: false });
    useStore.getState().toggleRouteMode();

    expect(useStore.getState()).toMatchObject({ routeFrom: null, routeTo: "compactness", routeMode: true });
  });
});
