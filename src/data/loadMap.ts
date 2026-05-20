import functionalAnalysisRaw from "./maps/functional_analysis.json";
import topologyRaw from "./maps/topology.json";
import { FieldJsonSchema, type GraphData, type GraphEdge } from "../types";
import { DEFAULT_MAP_ID, type MapId } from "./mapRegistry";
import { normalizeFieldGraph } from "./normalizeFieldGraph";

const rawMaps = {
  functional_analysis: functionalAnalysisRaw,
  topology: topologyRaw,
} satisfies Record<MapId, unknown>;

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

function countDegrees(edges: GraphEdge[], key: "from" | "to"): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    const id = edge[key];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export interface LoadedMap {
  data: GraphData;
  nodeById: Map<string, GraphData["nodes"][number]>;
  edgeById: Map<string, GraphEdge>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  /** Degree counts derived from the full edge set — used for centrality / suggested starts. */
  inDegreeByNodeId: Map<string, number>;
  outDegreeByNodeId: Map<string, number>;
  kinds: string[];
  relations: string[];
  topics: string[];
}

export function loadMap(mapId: MapId = DEFAULT_MAP_ID): LoadedMap {
  const raw = rawMaps[mapId];
  const parsed = FieldJsonSchema.parse(raw);
  const data = normalizeFieldGraph(parsed);

  return {
    data,
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    edgeById: new Map(data.edges.map((edge) => [edge.id, edge])),
    incomingEdgesByNodeId: groupEdges(data.edges, "to"),
    outgoingEdgesByNodeId: groupEdges(data.edges, "from"),
    inDegreeByNodeId: countDegrees(data.edges, "to"),
    outDegreeByNodeId: countDegrees(data.edges, "from"),
    kinds: [...new Set(data.nodes.map((node) => node.kind))].sort(),
    relations: [...new Set(data.edges.map((edge) => edge.relation))].sort(),
    topics: data.domains.map((domain) => domain.id),
  };
}
