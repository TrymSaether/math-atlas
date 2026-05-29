import {
  FieldJsonSchema,
  type GraphData,
  type GraphDomain,
  type GraphEdge,
} from "../types";
import { computeSwimlaneLayout, type DomainBounds, type Position } from "../lib/atlasLayout";
import { computeGraphMetrics, type GraphMetrics } from "../lib/graphMetrics";
import { DEFAULT_MAP_ID, MAPS, loadRawMap, type MapId } from "./mapRegistry";
import { normalizeFieldGraph } from "./normalizeFieldGraph";

function groupEdges(edges: GraphEdge[], key: "from" | "to") {
  const grouped = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const id = edge[key];
    const list = grouped.get(id) ?? [];
    list.push(edge);
    grouped.set(id, list);
  }
  return grouped;
}

function buildAdjacency(edges: GraphEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    const set = adjacency.get(a) ?? new Set<string>();
    set.add(b);
    adjacency.set(a, set);
  };
  for (const edge of edges) {
    link(edge.from, edge.to);
    link(edge.to, edge.from);
  }
  return adjacency;
}

function computeDegrees(edges: GraphEdge[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
  }
  return degrees;
}

export interface LoadedMap {
  data: GraphData;
  nodeById: Map<string, GraphData["nodes"][number]>;
  domainById: Map<string, GraphDomain>;
  edgeById: Map<string, GraphEdge>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  /** Undirected neighbor sets, computed once. */
  neighborsByNodeId: Map<string, Set<string>>;
  /** Total (in+out) degree per node. */
  degreeByNodeId: Map<string, number>;
  kinds: string[];
  relations: string[];
  topics: string[];
  positions: Map<string, Position>;
  domainBounds: Map<string, DomainBounds>;
  /** Derived structural metrics: depth (x-axis), impact (node size), reduction. */
  metrics: GraphMetrics;
}

function buildLoadedMap(data: GraphData): LoadedMap {
  const metrics = computeGraphMetrics(data);
  const layout = computeSwimlaneLayout(data, metrics);
  return {
    data,
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    domainById: new Map(data.domains.map((domain) => [domain.id, domain])),
    edgeById: new Map(data.edges.map((edge) => [edge.id, edge])),
    incomingEdgesByNodeId: groupEdges(data.edges, "to"),
    outgoingEdgesByNodeId: groupEdges(data.edges, "from"),
    neighborsByNodeId: buildAdjacency(data.edges),
    degreeByNodeId: computeDegrees(data.edges),
    kinds: [...new Set(data.nodes.map((node) => node.kind))].sort(),
    relations: [...new Set(data.edges.map((edge) => edge.relation))].sort(),
    topics: data.domains.map((domain) => domain.id),
    positions: layout.positions,
    domainBounds: layout.domainBounds,
    metrics,
  };
}

async function parseMapData(mapId: MapId): Promise<GraphData> {
  const raw = await loadRawMap(mapId);
  const parsed = FieldJsonSchema.parse(raw);
  return normalizeFieldGraph(parsed);
}

const loadedMapCache = new Map<MapId, Promise<LoadedMap>>();

export function loadMap(mapId: MapId = DEFAULT_MAP_ID): Promise<LoadedMap> {
  const cached = loadedMapCache.get(mapId);
  if (cached) return cached;

  const loaded = parseMapData(mapId).then(buildLoadedMap);
  loadedMapCache.set(mapId, loaded);
  return loaded;
}

export async function loadRegisteredMaps(): Promise<Record<MapId, LoadedMap>> {
  const entries = await Promise.all(
    (Object.keys(MAPS) as MapId[]).map(async (mapId) => [mapId, await loadMap(mapId)] as const),
  );
  return Object.fromEntries(entries) as Record<MapId, LoadedMap>;
}
