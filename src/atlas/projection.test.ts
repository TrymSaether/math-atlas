import { describe, expect, it } from "vitest";
import { buildArtifact } from "@/maps/build";
import { buildLoadedMap, enrichArtifact, type LoadedMap } from "@/maps/load";
import type { SourceConcept, SourceGraph } from "@/maps/source";
import { EMPTY_ROUTE, type RouteResult } from "./route";
import { buildGraphProjection, edgeHandlePair, lodForZoom, type GraphProjectionInput } from "./projection";

function concept(id: string, overrides: Partial<SourceConcept> = {}): SourceConcept {
  return {
    id,
    kind: "definition",
    domain: "foundations",
    label: id,
    content: { notation: [] },
    examples: [],
    assumptions: [],
    properties: [],
    tags: [],
    priority: "standard",
    ...overrides,
  };
}

function fixtureMap(): LoadedMap {
  const source: SourceGraph = {
    id: "projection_fixture",
    label: "Projection fixture",
    field: "Tests",
    version: 1,
    updated: "2026-06-27",
    domains: [
      { id: "foundations", label: "Foundations", order: 0, palette: "blue" },
      { id: "results", label: "Results", order: 1, palette: "violet" },
    ],
    concepts: [
      concept("a", { label: "Foundation A", priority: "core" }),
      concept("b", { kind: "theorem", label: "Intermediate B" }),
      concept("c", { kind: "theorem", domain: "results", label: "Result C" }),
      concept("d", { kind: "example", domain: "results", label: "Example D" }),
    ],
    edges: [
      { source: "b", target: "a", relation: "uses" },
      { source: "c", target: "b", relation: "uses" },
      { source: "c", target: "a", relation: "uses" },
      { source: "d", target: "b", relation: "motivated_by" },
    ],
  };
  return buildLoadedMap(enrichArtifact(buildArtifact(source).artifact));
}

function baseInput(map: LoadedMap, overrides: Partial<GraphProjectionInput> = {}): GraphProjectionInput {
  return {
    map,
    mapId: map.data.id,
    view: "dependency",
    search: "",
    searchScope: "all",
    kinds: new Set(map.kinds),
    topics: new Set(),
    relations: new Set(map.relations),
    selectedId: null,
    focusMode: false,
    focusDepth: 1,
    showSoftDeps: false,
    showRegions: true,
    routeFrom: null,
    routeTo: null,
    routeRunKey: 0,
    route: EMPTY_ROUTE,
    zoom: 1,
    domainToneFor: (domainId) => ({
      color: `color-${domainId}`,
      tint: `tint-${domainId}`,
      border: `border-${domainId}`,
    }),
    ...overrides,
  };
}

function route(map: LoadedMap): RouteResult {
  const edgeIds = new Set(map.data.edges.filter((edge) => edge.isDependency).map((edge) => edge.id));
  return {
    nodeIds: new Set(["a", "b", "c"]),
    edgeIds,
    ordered: ["a", "b", "c"],
    spine: ["a", "b", "c"],
    found: true,
  };
}

describe("buildGraphProjection", () => {
  it("keeps dependency direction and removes only the resting transitive edge", () => {
    const map = fixtureMap();
    const projection = buildGraphProjection(baseInput(map));

    expect(projection.edges.map(({ source, target }) => `${source}->${target}`)).toEqual(["a->b", "b->c"]);
    expect(projection.edges.every((edge) => edge.sourceHandle && edge.targetHandle)).toBe(true);
    expect(projection.nodes.filter((node) => node.type === "domainRegion")).toHaveLength(2);
  });

  it("force-reveals route nodes and reduced edges through active filters", () => {
    const map = fixtureMap();
    const activeRoute = route(map);
    const projection = buildGraphProjection(
      baseInput(map, {
        kinds: new Set(["definition"]),
        topics: new Set(["foundations"]),
        relations: new Set(),
        routeFrom: "a",
        routeTo: "c",
        routeRunKey: 4,
        route: activeRoute,
      }),
    );

    expect(projection.conceptNodes.map((node) => node.id)).toEqual(["a", "b", "c"]);
    expect(projection.edges.map(({ source, target }) => `${source}->${target}`)).toEqual(["a->b", "b->c", "a->c"]);
    expect(projection.conceptNodes.map((node) => [node.id, node.data.routePulseDelay])).toEqual([
      ["a", 0],
      ["b", 130],
      ["c", 260],
    ]);
    expect(projection.conceptNodes.find((node) => node.id === "a")?.data.routeEndpoint).toBe("from");
    expect(projection.conceptNodes.find((node) => node.id === "c")?.data.routeEndpoint).toBe("to");
    expect(projection.edges.map((edge) => edge.data?.routeReveal?.delay)).toEqual([130, 260, 260]);
  });

  it("projects the selected focus neighborhood without pulling in hidden soft edges", () => {
    const map = fixtureMap();
    const projection = buildGraphProjection(baseInput(map, { selectedId: "b", focusMode: true, focusDepth: 1 }));

    expect(projection.focusIds).toEqual(new Set(["b", "a", "c"]));
    expect(projection.conceptNodes.find((node) => node.id === "b")?.data.isSelected).toBe(true);
    expect(projection.conceptNodes.find((node) => node.id === "a")?.data.isRelated).toBe(true);
    expect(projection.conceptNodes.find((node) => node.id === "c")?.data.isRelated).toBe(true);
    expect(projection.conceptNodes.find((node) => node.id === "d")?.data.dim).toBe(true);
    expect(projection.edges.map(({ source, target }) => `${source}->${target}`)).toEqual(["a->b", "b->c", "a->c"]);
  });

  it("preserves node data references when the projected state is unchanged", () => {
    const map = fixtureMap();
    const first = buildGraphProjection(baseInput(map));
    const second = buildGraphProjection(baseInput(map, { previousNodeData: first.nodeDataCache }));

    for (const node of second.conceptNodes) {
      expect(node.data).toBe(first.nodeDataCache.get(node.id));
    }
  });
});

describe("graph projection detail fixtures", () => {
  it("keeps the existing LOD thresholds", () => {
    expect([0.18, 0.31, 0.32, 0.61, 0.62, 1].map(lodForZoom)).toEqual(["far", "far", "mid", "mid", "near", "near"]);
  });

  it("chooses handles from prerequisite to dependent based on relative position", () => {
    expect(
      edgeHandlePair(
        "prerequisite",
        "dependent",
        new Map([
          ["prerequisite", { x: 0, y: 0 }],
          ["dependent", { x: 300, y: 0 }],
        ]),
      ),
    ).toEqual({ sourceHandle: "source-right", targetHandle: "target-left" });
  });
});
