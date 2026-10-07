import type { TopoEdge, TopoNode, Relation } from "../types";
import { isEquivalenceRelation } from "../data/relations";

export interface Adjacency {
  out: Map<string, { id: string; rel: Relation }[]>;
  in: Map<string, { id: string; rel: Relation }[]>;
}

export interface TopoSortResult {
  nodes: TopoNode[];
  cycles: TopoNode[][];
}

export function buildAdjacency(edges: TopoEdge[], allowed: Set<Relation>): Adjacency {
  const out = new Map<string, { id: string; rel: Relation }[]>();
  const inn = new Map<string, { id: string; rel: Relation }[]>();
  for (const e of edges) {
    if (!allowed.has(e.relation)) continue;
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
      if (!seen.has(nxt)) {
        seen.add(nxt);
        stack.push(nxt);
      }
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
      if (!seen.has(nxt)) {
        seen.add(nxt);
        stack.push(nxt);
      }
    }
  }
  return seen;
}

/** Lower sorts earlier: core concepts are surfaced ahead of peripheral ones. */
const PRIORITY_RANK: Record<string, number> = { core: 0, standard: 1, peripheral: 2 };

/** Stable node comparator: chapter number, then id as a final deterministic tiebreak. */
function cmpNode(byId: Map<string, TopoNode>): (a: string, b: string) => number {
  return (a, b) => {
    const c = cmpNum(byId.get(a)!, byId.get(b)!);
    return c !== 0 ? c : a < b ? -1 : a > b ? 1 : 0;
  };
}

/**
 * Topological sort restricted to the subgraph induced by `nodeIds`.
 *
 * `equivalence` (node id → canonical class rep, see {@link equivalenceClasses})
 * is optional. When supplied, concepts in the same equivalence class are merged
 * into one *ordering unit* so equivalent reformulations are sequenced together
 * instead of being scattered across the order. Equivalence alone never marks a
 * unit as a cycle — only genuine dependency loops do (see `cycles` below).
 */
export function topoSortWithCycles(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[],
  equivalence?: Map<string, string>,
): TopoSortResult {
  const byId = new Map(allNodes.map((n) => [n.id, n]));

  // Dependency SCCs. A multi-node SCC (or self-loop) is a genuine circular
  // dependency; these are the only things reported as cycles.
  const depComponents = stronglyConnectedComponents(nodeIds, adj, byId);
  const compByNode = new Map<string, number>();
  depComponents.forEach((component, i) => {
    for (const id of component) compByNode.set(id, i);
  });

  // Merge dependency components linked by an equivalence class into ordering
  // units (union-find over component indices).
  const parent = depComponents.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const unite = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  if (equivalence) {
    const repToComponent = new Map<string, number>();
    for (const id of nodeIds) {
      const rep = equivalence.get(id);
      if (rep === undefined) continue;
      const ci = compByNode.get(id);
      if (ci === undefined) continue;
      const seen = repToComponent.get(rep);
      if (seen === undefined) repToComponent.set(rep, ci);
      else unite(seen, ci);
    }
  }

  // Aggregate units: unit root → member node ids (sorted), and node → unit root.
  const unitMembers = new Map<number, string[]>();
  const unitByNode = new Map<string, number>();
  depComponents.forEach((component, i) => {
    const root = find(i);
    const members = unitMembers.get(root) ?? unitMembers.set(root, []).get(root)!;
    for (const id of component) {
      members.push(id);
      unitByNode.set(id, root);
    }
  });
  for (const members of unitMembers.values()) members.sort(cmpNode(byId));

  // A unit is represented by its lowest-numbered member for ordering purposes.
  const repNode = (root: number) => byId.get(unitMembers.get(root)![0])!;
  // Tie-break order *within the topological constraints*: surface core concepts
  // before peripheral ones, then fall back to a stable numeric/id order. Never
  // reorders across a real prerequisite edge — only chooses among ready units.
  const cmpUnitStatic = (a: number, b: number) => {
    const pa = PRIORITY_RANK[repNode(a).priority] ?? PRIORITY_RANK.standard;
    const pb = PRIORITY_RANK[repNode(b).priority] ?? PRIORITY_RANK.standard;
    if (pa !== pb) return pa - pb;
    return cmpNode(byId)(unitMembers.get(a)![0], unitMembers.get(b)![0]);
  };
  // Cluster-contiguous: once we enter a domain, prefer ready units in the same
  // domain so the path finishes a topic instead of bouncing between domains.
  const cmpReady = (a: number, b: number, lastDomain: string | undefined) => {
    if (lastDomain !== undefined) {
      const sa = repNode(a).domain === lastDomain ? 0 : 1;
      const sb = repNode(b).domain === lastDomain ? 0 : 1;
      if (sa !== sb) return sa - sb;
    }
    return cmpUnitStatic(a, b);
  };

  // Condensation over units.
  const unitEdges = new Map<number, Set<number>>();
  const indeg = new Map<number, number>();
  for (const root of unitMembers.keys()) indeg.set(root, 0);
  for (const id of nodeIds) {
    const fromUnit = unitByNode.get(id);
    if (fromUnit === undefined) continue;
    for (const { id: nxt } of adj.out.get(id) ?? []) {
      if (!nodeIds.has(nxt)) continue;
      const toUnit = unitByNode.get(nxt);
      if (toUnit === undefined || toUnit === fromUnit) continue;
      const edges = unitEdges.get(fromUnit) ?? unitEdges.set(fromUnit, new Set()).get(fromUnit)!;
      if (!edges.has(toUnit)) {
        edges.add(toUnit);
        indeg.set(toUnit, (indeg.get(toUnit) ?? 0) + 1);
      }
    }
  }

  // Kahn over units. Each step picks the best ready unit by contiguity →
  // priority → number, so the order is deterministic and stays within a domain.
  const ready = new Set<number>();
  for (const [root, d] of indeg) if (d === 0) ready.add(root);
  const orderedUnits: number[] = [];
  let lastDomain: string | undefined;
  while (ready.size) {
    let best: number | undefined;
    for (const r of ready) if (best === undefined || cmpReady(r, best, lastDomain) < 0) best = r;
    ready.delete(best!);
    orderedUnits.push(best!);
    lastDomain = repNode(best!).domain;
    for (const nxt of unitEdges.get(best!) ?? []) {
      const d = (indeg.get(nxt) ?? 0) - 1;
      indeg.set(nxt, d);
      if (d === 0) ready.add(nxt);
    }
  }

  // Without equivalence the condensation of SCCs is always a DAG, so Kahn places
  // every unit. Merging by equivalence can introduce a condensation cycle, but
  // only when an equivalence contradicts the dependency order (e.g. A→B→C with
  // A≡C). Never drop nodes: append leftover units deterministically and surface
  // them as cycles so the contradiction is visible.
  const placed = new Set(orderedUnits);
  const leftover = [...unitMembers.keys()].filter((r) => !placed.has(r)).sort(cmpUnitStatic);
  orderedUnits.push(...leftover);

  const nodes = orderedUnits.flatMap((root) =>
    unitMembers
      .get(root)!
      .map((id) => byId.get(id))
      .filter((n): n is TopoNode => Boolean(n)),
  );

  const leftoverNodeIds = new Set(leftover.flatMap((r) => unitMembers.get(r)!));
  const cycleComponents = [
    ...leftover.map((r) => unitMembers.get(r)!),
    ...depComponents.filter((c) => isCycleComponent(c, adj) && !c.some((id) => leftoverNodeIds.has(id))),
  ];
  const cycles = cycleComponents.map((c) => c.map((id) => byId.get(id)).filter((n): n is TopoNode => Boolean(n)));

  return { nodes, cycles };
}

/**
 * Connected components of the `equivalent_to` edges, as a node id → canonical
 * representative map (the lexicographically smallest member of each class).
 * Restricted to `nodeIds` when given. Nodes in no equivalence class are absent.
 */
export function equivalenceClasses(edges: TopoEdge[], nodeIds?: Set<string>): Map<string, string> {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x);
    if (p === undefined || p === x) {
      parent.set(x, x);
      return x;
    }
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const unite = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    // Keep the smaller id as the rep for stable, deterministic class names.
    if (ra < rb) parent.set(rb, ra);
    else parent.set(ra, rb);
  };
  for (const e of edges) {
    if (!isEquivalenceRelation(e.relation)) continue;
    if (nodeIds && (!nodeIds.has(e.from) || !nodeIds.has(e.to))) continue;
    unite(e.from, e.to);
  }
  const reps = new Map<string, string>();
  for (const k of parent.keys()) reps.set(k, find(k));
  return reps;
}

function stronglyConnectedComponents(nodeIds: Set<string>, adj: Adjacency, byId: Map<string, TopoNode>): string[][] {
  let index = 0;
  const indexById = new Map<string, number>();
  const lowlinkById = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  function visit(id: string) {
    indexById.set(id, index);
    lowlinkById.set(id, index);
    index++;
    stack.push(id);
    onStack.add(id);

    for (const { id: nxt } of adj.out.get(id) ?? []) {
      if (!nodeIds.has(nxt)) continue;
      if (!indexById.has(nxt)) {
        visit(nxt);
        lowlinkById.set(id, Math.min(lowlinkById.get(id)!, lowlinkById.get(nxt)!));
      } else if (onStack.has(nxt)) {
        lowlinkById.set(id, Math.min(lowlinkById.get(id)!, indexById.get(nxt)!));
      }
    }

    if (lowlinkById.get(id) !== indexById.get(id)) return;

    const component: string[] = [];
    let cur: string;
    do {
      cur = stack.pop()!;
      onStack.delete(cur);
      component.push(cur);
    } while (cur !== id);

    component.sort((a, b) => cmpNum(byId.get(a)!, byId.get(b)!));
    components.push(component);
  }

  const orderedIds = [...nodeIds].sort((a, b) => cmpNum(byId.get(a)!, byId.get(b)!));
  for (const id of orderedIds) {
    if (!indexById.has(id)) visit(id);
  }

  return components;
}

function isCycleComponent(component: string[], adj: Adjacency): boolean {
  if (component.length > 1) return true;
  const [id] = component;
  return (adj.out.get(id) ?? []).some((edge) => edge.id === id);
}

/**
 * Shortest *directed* path from `from` to `to` over an {@link Adjacency} built by
 * {@link buildAdjacency}. Because that adjacency is already restricted to an
 * allowed relation set, this answers relation-typed, direction-respecting queries
 * such as "shortest dependency chain from concept A up to theorem B". Returns the
 * inclusive ordered id list, or `null` if `to` is unreachable from `from`.
 */
export function shortestPath(adj: Adjacency, from: string, to: string): string[] | null {
  if (from === to) return [from];
  const prev = new Map<string, string>();
  const visited = new Set<string>([from]);
  const queue: string[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const { id: next } of adj.out.get(cur) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      prev.set(next, cur);
      if (next === to) {
        const path = [to];
        let c = to;
        while (c !== from) {
          c = prev.get(c)!;
          path.push(c);
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
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
