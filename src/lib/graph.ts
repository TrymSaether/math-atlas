import type { TopoEdge, TopoNode, Relation } from "../types";

export type GraphDirection = "raw" | "route";

export interface DirectedTopoEdge extends Omit<TopoEdge, "from" | "to"> {
  /** Oriented endpoint for the requested graph layer. */
  from: string;
  /** Oriented endpoint for the requested graph layer. */
  to: string;
  /** Original stored edge. Data edges are always dependent -> prerequisite. */
  raw: TopoEdge;
}

export interface Adjacency {
  out: Map<string, { id: string; rel: Relation }[]>;
  in: Map<string, { id: string; rel: Relation }[]>;
}

/**
 * Edge direction layer.
 *
 * - raw: stored graph/data direction, dependent -> prerequisite.
 * - route: visible map/route direction, prerequisite -> dependent.
 */
export function orientEdge(edge: TopoEdge, direction: GraphDirection = "raw"): DirectedTopoEdge {
  const from = direction === "route" ? edge.to : edge.from;
  const to = direction === "route" ? edge.from : edge.to;
  return { ...edge, from, to, raw: edge };
}

export function orientEdges(
  edges: TopoEdge[],
  direction: GraphDirection = "raw",
  allowed?: Set<Relation>,
): DirectedTopoEdge[] {
  return edges
    .filter((edge) => !allowed || allowed.has(edge.relation))
    .map((edge) => orientEdge(edge, direction));
}

export function buildAdjacency(
  edges: TopoEdge[],
  allowed: Set<Relation>,
  direction: GraphDirection = "raw",
): Adjacency {
  const out = new Map<string, { id: string; rel: Relation }[]>();
  const inn = new Map<string, { id: string; rel: Relation }[]>();
  for (const e of orientEdges(edges, direction, allowed)) {
    if (!out.has(e.from)) out.set(e.from, []);
    if (!inn.has(e.to)) inn.set(e.to, []);
    out.get(e.from)!.push({ id: e.to, rel: e.relation });
    inn.get(e.to)!.push({ id: e.from, rel: e.relation });
  }
  return { out, in: inn };
}

export function ancestors(adj: Adjacency, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const { id: nxt } of adj.in.get(cur) ?? []) {
      if (!seen.has(nxt)) { seen.add(nxt); stack.push(nxt); }
    }
  }
  return seen;
}

export function descendants(adj: Adjacency, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const { id: nxt } of adj.out.get(cur) ?? []) {
      if (!seen.has(nxt)) { seen.add(nxt); stack.push(nxt); }
    }
  }
  return seen;
}

/** Topological sort restricted to the subgraph induced by `nodeIds`. */
export function topoSort(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[]
): TopoNode[] {
  const indeg = new Map<string, number>();
  for (const id of nodeIds) indeg.set(id, 0);
  for (const id of nodeIds) {
    for (const { id: nxt } of adj.out.get(id) ?? []) {
      if (nodeIds.has(nxt)) indeg.set(nxt, (indeg.get(nxt) ?? 0) + 1);
    }
  }
  const ready: string[] = [];
  for (const [id, d] of indeg) if (d === 0) ready.push(id);
  // Stable order by chapter/number
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  ready.sort((a, b) => cmpNum(byId.get(a)!, byId.get(b)!));
  const out: TopoNode[] = [];
  while (ready.length) {
    const cur = ready.shift()!;
    const node = byId.get(cur);
    if (node) out.push(node);
    for (const { id: nxt } of adj.out.get(cur) ?? []) {
      if (!nodeIds.has(nxt)) continue;
      const d = (indeg.get(nxt) ?? 0) - 1;
      indeg.set(nxt, d);
      if (d === 0) {
        // insert in sorted position
        let i = 0;
        while (i < ready.length && cmpNum(byId.get(ready[i])!, byId.get(nxt)!) < 0) i++;
        ready.splice(i, 0, nxt);
      }
    }
  }
  return out;
}

export function cmpNum(a: TopoNode, b: TopoNode): number {
  const [ac, ai] = splitNum(a.number);
  const [bc, bi] = splitNum(b.number);
  if (ac !== bc) return ac < bc ? -1 : 1;
  return ai - bi;
}

function splitNum(n: string): [string, number] {
  const [c, i] = n.split(".");
  return [c, parseInt(i, 10) || 0];
}

export function buildLearningPath(
  targetId: string,
  edges: TopoEdge[],
  allowed: Set<Relation>,
  nodes: TopoNode[]
): TopoNode[] {
  const adj = buildAdjacency(edges, allowed, "raw");
  const prerequisites = descendants(adj, targetId);
  prerequisites.add(targetId);
  return topoSort(prerequisites, adj, nodes).reverse();
}
