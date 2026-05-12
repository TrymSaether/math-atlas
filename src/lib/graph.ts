import type { TopoEdge, TopoNode, Relation } from "../types";

export type GraphDirection = "raw" | "route";

export interface DirectedTopoEdge {
  id: string;
  /** Oriented endpoint for the requested graph layer. */
  from: string;
  /** Oriented endpoint for the requested graph layer. */
  to: string;
  relation: Relation;
  source: TopoEdge["source"];
  confidence: number;
  /** Original stored edge, including any provenance metadata. */
  raw: TopoEdge;
}

export interface Adjacency {
  out: Map<string, { id: string; rel: Relation }[]>;
  in: Map<string, { id: string; rel: Relation }[]>;
}

/**
 * Edge direction layer.
 *
 * The provenance-enriched dataset stores edges in mathematical reading order:
 * source/prerequisite -> dependent concept, result, or example. The visible
 * route layer uses the same orientation so graph layout, route rendering, and
 * learning paths all agree with the data contract in `_meta.provenancePass`.
 */
export function orientEdge(edge: TopoEdge, _direction: GraphDirection = "raw"): DirectedTopoEdge {
  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    relation: edge.relation,
    source: edge.source,
    confidence: edge.confidence,
    raw: edge,
  };
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

type NodeComparator = (a: TopoNode, b: TopoNode) => number;

/**
 * Topological sort restricted to the subgraph induced by `nodeIds`.
 * Uses provided comparator function to order nodes with same in-degree.
 */
export function topoSortWith(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[],
  comparator: NodeComparator = cmpNum
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
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  ready.sort((a, b) => comparator(byId.get(a)!, byId.get(b)!));
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
        let i = 0;
        while (i < ready.length && comparator(byId.get(ready[i])!, byId.get(nxt)!) < 0) i++;
        ready.splice(i, 0, nxt);
      }
    }
  }
  return out;
}

/** Topological sort restricted to the subgraph induced by `nodeIds`. */
export function topoSort(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[]
): TopoNode[] {
  return topoSortWith(nodeIds, adj, allNodes, cmpNum);
}

/** Priority ordering for topic clusters (lower = appears first) */
const topicClusterPriority: Record<string, number> = {
  "Overture": 0,
  "Set Theory": 1,
  "Algebra": 2,
  "Metric Foundations": 3,
  "Topological Spaces": 4,
  "Generating Topologies": 5,
  "Constructions": 6,
  "Topological Properties": 7,
  "Fundamental Group": 8,
  "Fundamental Group of S¹": 9,
};

/** Priority ordering for node kinds (lower = appears first) */
const nodeKindPriority: Record<string, number> = {
  "definition": 0,
  "lemma": 1,
  "theorem": 2,
  "example": 3,
  "remark": 4,
  "exercise": 5,
};

/**
 * Compare nodes using conceptual flow ordering:
 * 1. Topic cluster (foundational → advanced)
 * 2. Node kind (definitions first, then lemmas, theorems, examples)
 * 3. Chapter and section number
 * 4. Number within chapter
 */
export function cmpConceptualFlow(a: TopoNode, b: TopoNode): number {
  // First, compare by topic cluster priority
  const aPriority = topicClusterPriority[a.topicCluster] ?? 10;
  const bPriority = topicClusterPriority[b.topicCluster] ?? 10;
  if (aPriority !== bPriority) return aPriority - bPriority;

  // Within same cluster, prioritize by node kind
  const aKindPriority = nodeKindPriority[a.kind] ?? 6;
  const bKindPriority = nodeKindPriority[b.kind] ?? 6;
  if (aKindPriority !== bKindPriority) return aKindPriority - bKindPriority;

  // Then by chapter number
  const [ac, ai] = splitNum(a.number);
  const [bc, bi] = splitNum(b.number);
  if (ac !== bc) {
    // Ensure appendix chapters (A, B, etc.) come after numeric chapters
    const aIsAppendix = isNaN(parseInt(ac, 10));
    const bIsAppendix = isNaN(parseInt(bc, 10));
    if (aIsAppendix !== bIsAppendix) return aIsAppendix ? 1 : -1;
    return ac < bc ? -1 : 1;
  }

  // Finally by number within chapter
  return ai - bi;
}

/**
 * Compare nodes by numeric order only (original behavior).
 * Used as fallback or for specific orderings that need to preserve textbook order.
 */
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
  const prerequisites = ancestors(adj, targetId);
  prerequisites.add(targetId);
  return topoSort(prerequisites, adj, nodes);
}

/**
 * Build a learning path using conceptual flow ordering.
 * Prerequisites are ordered by topic cluster and node kind for better intuitive flow.
 */
export function buildLearningPathConceptual(
  targetId: string,
  edges: TopoEdge[],
  allowed: Set<Relation>,
  nodes: TopoNode[]
): TopoNode[] {
  const adj = buildAdjacency(edges, allowed, "raw");
  const prerequisites = ancestors(adj, targetId);
  prerequisites.add(targetId);
  return topoSortWith(prerequisites, adj, nodes, cmpConceptualFlow);
}

/**
 * Sort all nodes using conceptual flow ordering.
 * Returns nodes ordered by topic cluster, node kind, and chapter number.
 */
export function sortNodesConceptually(nodes: TopoNode[]): TopoNode[] {
  return [...nodes].sort(cmpConceptualFlow);
}

/**
 * Sort all nodes using numeric (chapter) ordering.
 * Preserves original textbook order.
 */
export function sortNodesNumeric(nodes: TopoNode[]): TopoNode[] {
  return [...nodes].sort(cmpNum);
}
