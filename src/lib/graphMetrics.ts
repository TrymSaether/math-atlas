import type { GraphData, GraphEdge } from "../types";
import { classifyEdge } from "./relationStyle";

/**
 * Derived structural metrics over the dependency DAG.
 *
 * Edge convention (post-normalization): `from → to` means "from is a
 * prerequisite of to", so `from` is the more foundational concept. Following
 * edges in the from→to direction walks toward dependents.
 *
 * - `depth`   — longest prerequisite chain ending at a node. Roots have depth 0.
 *               Used as the x-axis of the
 *               swimlane layout: foundations left, advanced results right.
 * - `impact`  — number of transitive *dependents* (nodes that, directly or
 *               indirectly, depend on this one). High impact = load-bearing.
 * - `reducedEdgeIds` — edge ids surviving transitive reduction: edges implied by a
 *               longer path (A→B→C plus A→C ⇒ drop A→C) are removed. The full edge
 *               set is kept elsewhere for focus-mode adjacency.
 *
 * The data is *expected* to be a DAG but is not guaranteed to be one. Every
 * traversal here is cycle-safe: back-edges are detected and ignored rather than
 * crashing or looping. Transitive reduction never removes an edge that is part of
 * a cycle (removing one could disconnect a strongly-connected component).
 */
export interface GraphMetrics {
  depthByNodeId: Map<string, number>;
  impactByNodeId: Map<string, number>;
  reducedEdgeIds: Set<string>;
  maxDepth: number;
  maxImpact: number;
}

/** Successor adjacency in the prerequisite→dependent direction. */
function buildSuccessors(nodeIds: Set<string>, edges: GraphEdge[]): Map<string, Set<string>> {
  const succ = new Map<string, Set<string>>();
  for (const id of nodeIds) succ.set(id, new Set());
  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
    if (edge.from === edge.to) continue; // ignore self-loops
    succ.get(edge.from)!.add(edge.to);
  }
  return succ;
}

/** Prerequisite adjacency: node id → direct prerequisites. */
function buildPrerequisites(nodeIds: Set<string>, edges: GraphEdge[]): Map<string, Set<string>> {
  const prereqs = new Map<string, Set<string>>();
  for (const id of nodeIds) prereqs.set(id, new Set());
  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
    if (edge.from === edge.to) continue;
    prereqs.get(edge.to)!.add(edge.from);
  }
  return prereqs;
}

/**
 * Memoized transitive reachability set per node (excludes the node itself unless
 * it sits on a cycle). Cycle-safe via an on-stack guard.
 */
function buildReachability(nodeIds: Set<string>, succ: Map<string, Set<string>>): Map<string, Set<string>> {
  const reach = new Map<string, Set<string>>();
  const onStack = new Set<string>();

  const visit = (node: string): Set<string> => {
    const cached = reach.get(node);
    if (cached) return cached;
    const result = new Set<string>();
    // Mark provisional empty set so cycles back to `node` terminate.
    reach.set(node, result);
    onStack.add(node);
    for (const next of succ.get(node) ?? []) {
      result.add(next);
      if (onStack.has(next)) continue; // back-edge: child reach added once it settles
      for (const deep of visit(next)) result.add(deep);
    }
    onStack.delete(node);
    return result;
  };

  for (const id of nodeIds) visit(id);
  return reach;
}

/** Longest path following prerequisite links. Cycle-safe (back-edges ⇒ 0). */
function computeDepths(nodeIds: Set<string>, prereqs: Map<string, Set<string>>): Map<string, number> {
  const depth = new Map<string, number>();
  const state = new Map<string, 0 | 1 | 2>(); // 0/undef=unseen, 1=on-stack, 2=done

  const visit = (node: string): number => {
    const settled = depth.get(node);
    if (state.get(node) === 2 && settled !== undefined) return settled;
    state.set(node, 1);
    let best = 0;
    for (const next of prereqs.get(node) ?? []) {
      if (state.get(next) === 1) continue; // back-edge inside a cycle: skip
      best = Math.max(best, 1 + visit(next));
    }
    state.set(node, 2);
    depth.set(node, best);
    return best;
  };

  for (const id of nodeIds) visit(id);
  return depth;
}

/**
 * Transitive reduction: drop edge u→v when v is reachable from some other
 * successor w of u (i.e. a longer path u→…→v already exists). Edges on a cycle
 * (u reachable from v) are always kept.
 */
function computeReducedEdgeIds(
  edges: GraphEdge[],
  nodeIds: Set<string>,
  succ: Map<string, Set<string>>,
  reach: Map<string, Set<string>>,
): Set<string> {
  const kept = new Set<string>();
  for (const edge of edges) {
    const { from: u, to: v } = edge;
    if (!nodeIds.has(u) || !nodeIds.has(v) || u === v) continue;

    // Part of a cycle — never reduce.
    if (reach.get(v)?.has(u)) {
      kept.add(edge.id);
      continue;
    }

    let redundant = false;
    for (const w of succ.get(u) ?? []) {
      if (w === v) continue;
      if (reach.get(w)?.has(v)) {
        redundant = true;
        break;
      }
    }
    if (!redundant) kept.add(edge.id);
  }
  return kept;
}

export function computeGraphMetrics(data: GraphData): GraphMetrics {
  const nodeIds = new Set(data.nodes.map((n) => n.id));
  // Hierarchy is defined by *hard* dependencies (definitional / logical / …).
  // Soft pedagogical edges are supplementary and must not warp depth, impact,
  // or the reduction — they're an optional overlay.
  const hardEdges = data.edges.filter((edge) => classifyEdge(edge) === "hard");
  const succ = buildSuccessors(nodeIds, hardEdges);
  const prereqs = buildPrerequisites(nodeIds, hardEdges);
  const reach = buildReachability(nodeIds, succ);

  const depthByNodeId = computeDepths(nodeIds, prereqs);

  // impact(Y) = count of nodes that can reach Y = number of transitive dependents.
  const impactByNodeId = new Map<string, number>();
  for (const id of nodeIds) impactByNodeId.set(id, 0);
  for (const [node, reachable] of reach) {
    for (const target of reachable) {
      if (target === node) continue;
      impactByNodeId.set(target, (impactByNodeId.get(target) ?? 0) + 1);
    }
  }

  const reducedEdgeIds = computeReducedEdgeIds(hardEdges, nodeIds, succ, reach);

  let maxDepth = 0;
  for (const d of depthByNodeId.values()) maxDepth = Math.max(maxDepth, d);
  let maxImpact = 0;
  for (const v of impactByNodeId.values()) maxImpact = Math.max(maxImpact, v);

  return { depthByNodeId, impactByNodeId, reducedEdgeIds, maxDepth, maxImpact };
}
