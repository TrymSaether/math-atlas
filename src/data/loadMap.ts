import {
  FieldJsonSchema,
  TopoDataSchema,
  type GraphData,
  type GraphDomain,
  type GraphEdge,
} from "../types";
import { computeAtlasLayout, type Position } from "../lib/atlasLayout";
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

export interface LoadedMap {
  data: GraphData;
  nodeById: Map<string, GraphData["nodes"][number]>;
  domainById: Map<string, GraphDomain>;
  edgeById: Map<string, GraphEdge>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  kinds: string[];
  relations: string[];
  topics: string[];
  positions: Map<string, Position>;
  domainBounds: Map<string, { x: number; y: number; width: number; height: number }>;
}

function buildLoadedMap(data: GraphData): LoadedMap {
  const layout = computeAtlasLayout(data);
  return {
    data,
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    domainById: new Map(data.domains.map((domain) => [domain.id, domain])),
    edgeById: new Map(data.edges.map((edge) => [edge.id, edge])),
    incomingEdgesByNodeId: groupEdges(data.edges, "to"),
    outgoingEdgesByNodeId: groupEdges(data.edges, "from"),
    kinds: [...new Set(data.nodes.map((node) => node.kind))].sort(),
    relations: [...new Set(data.edges.map((edge) => edge.relation))].sort(),
    topics: data.domains.map((domain) => domain.id),
    positions: layout.positions,
    domainBounds: layout.domainBounds,
  };
}

async function parseMapData(mapId: MapId): Promise<GraphData> {
  const raw = await loadRawMap(mapId);
  const parsed = FieldJsonSchema.parse(raw);
  return TopoDataSchema.parse(normalizeFieldGraph(parsed));
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
