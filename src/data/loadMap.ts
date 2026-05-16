import { FieldJsonSchema, type GraphData, type GraphEdge } from "../types";
import { DEFAULT_MAP_ID, MAP_CATALOG, getMapCatalogEntry, type MapId } from "./mapRegistry";
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
  edgeById: Map<string, GraphEdge>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  kinds: string[];
  relations: string[];
  topics: string[];
}

function buildLoadedMap(data: GraphData): LoadedMap {
  return {
    data,
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    edgeById: new Map(data.edges.map((edge) => [edge.id, edge])),
    incomingEdgesByNodeId: groupEdges(data.edges, "to"),
    outgoingEdgesByNodeId: groupEdges(data.edges, "from"),
    kinds: [...new Set(data.nodes.map((node) => node.kind))].sort(),
    relations: [...new Set(data.edges.map((edge) => edge.relation))].sort(),
    topics: data.domains.map((domain) => domain.id),
  };
}

function parseMapData(mapId: MapId): GraphData {
  const { raw } = getMapCatalogEntry(mapId);
  const parsed = FieldJsonSchema.parse(raw);
  return normalizeFieldGraph(parsed);
}

export function loadMap(mapId: MapId = DEFAULT_MAP_ID): LoadedMap {
  return buildLoadedMap(parseMapData(mapId));
}

export function loadRegisteredMaps(): Record<MapId, LoadedMap> {
  return Object.fromEntries(
    (Object.keys(MAP_CATALOG) as MapId[]).map((mapId) => [mapId, loadMap(mapId)])
  ) as Record<MapId, LoadedMap>;
}
