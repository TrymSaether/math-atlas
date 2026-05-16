import type { LoadedMap } from "../data/loadMap";
import type { GraphNode } from "../types";

const TOP_N = 3;

/**
 * Pick a handful of concepts a new visitor should consider first.
 *
 * Heuristic: nodes that have no prerequisites in this map (in-degree 0) but reach
 * many other concepts downstream (out-degree ≥ 3). Sorted by out-degree desc,
 * tie-broken by title. Falls back to the highest-out-degree nodes if the strict
 * filter leaves us short.
 */
export function suggestedStarts(loaded: LoadedMap, limit = TOP_N): GraphNode[] {
  const { data, inDegreeByNodeId, outDegreeByNodeId } = loaded;

  const scored = data.nodes
    .map((node) => ({
      node,
      out: outDegreeByNodeId.get(node.id) ?? 0,
      in: inDegreeByNodeId.get(node.id) ?? 0,
    }))
    .filter(({ out }) => out >= 3);

  const roots = scored
    .filter(({ in: incoming }) => incoming === 0)
    .sort((a, b) => b.out - a.out || a.node.title.localeCompare(b.node.title))
    .map(({ node }) => node);

  if (roots.length >= limit) return roots.slice(0, limit);

  // Backfill with high-reach nodes regardless of in-degree.
  const seen = new Set(roots.map((n) => n.id));
  const filler = scored
    .filter(({ node }) => !seen.has(node.id))
    .sort((a, b) => b.out - a.out || a.in - b.in || a.node.title.localeCompare(b.node.title))
    .map(({ node }) => node);

  return [...roots, ...filler].slice(0, limit);
}
