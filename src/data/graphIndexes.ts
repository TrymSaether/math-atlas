import type { GraphData, GraphEdge } from "../types";

export type GraphNode = GraphData["nodes"][number];
export type EdgeEndpointKey = "from" | "to";

export interface GraphIndexes {
  readonly nodeById: ReadonlyMap<string, GraphNode>;
  readonly edgeById: ReadonlyMap<string, GraphEdge>;
  readonly incomingEdgesByNodeId: ReadonlyMap<string, readonly GraphEdge[]>;
  readonly outgoingEdgesByNodeId: ReadonlyMap<string, readonly GraphEdge[]>;
  /** Degree counts derived from the full edge set; useful for centrality and suggested starts. */
  readonly inDegreeByNodeId: ReadonlyMap<string, number>;
  readonly outDegreeByNodeId: ReadonlyMap<string, number>;
}

export function createGraphIndexes(data: GraphData): GraphIndexes {
  return {
    nodeById: indexBy(data.nodes, (node) => node.id),
    edgeById: indexBy(data.edges, (edge) => edge.id),
    incomingEdgesByNodeId: groupBy(data.edges, (edge) => edge.to),
    outgoingEdgesByNodeId: groupBy(data.edges, (edge) => edge.from),
    inDegreeByNodeId: countBy(data.edges, (edge) => edge.to),
    outDegreeByNodeId: countBy(data.edges, (edge) => edge.from),
  };
}

export function uniqueSorted<T extends string>(values: Iterable<T>): readonly T[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function indexBy<T>(items: readonly T[], getKey: (item: T) => string): ReadonlyMap<string, T> {
  const indexed = new Map<string, T>();

  for (const item of items) {
    indexed.set(getKey(item), item);
  }

  return indexed;
}

function groupBy<T>(items: readonly T[], getKey: (item: T) => string): ReadonlyMap<string, readonly T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const group = grouped.get(key);

    if (group === undefined) {
      grouped.set(key, [item]);
      continue;
    }

    group.push(item);
  }

  return grouped;
}

function countBy<T>(items: readonly T[], getKey: (item: T) => string): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
