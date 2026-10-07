import type { GraphEdge } from "../types";

export function findRoute(fromId: string | null, toId: string | null, edges: GraphEdge[]): string[] | null {
  if (!fromId || !toId) return null;
  if (fromId === toId) return [fromId];

  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    (adj.get(edge.from) ?? adj.set(edge.from, []).get(edge.from)!).push(edge.to);
    (adj.get(edge.to) ?? adj.set(edge.to, []).get(edge.to)!).push(edge.from);
  }

  const prev = new Map<string, string | null>([[fromId, null]]);
  const queue = [fromId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const next of adj.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      queue.push(next);
    }
  }

  if (!prev.has(toId)) return null;
  const path: string[] = [];
  let cursor: string | null = toId;
  while (cursor) {
    path.unshift(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  return path;
}
