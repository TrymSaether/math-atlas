import type { TopoEdge, TopoNode, Relation } from "../types";

export interface Adjacency {
  out: Map<string, { id: string; rel: Relation }[]>;
  in: Map<string, { id: string; rel: Relation }[]>;
}

export interface TopoSortResult {
  nodes: TopoNode[];
  cycles: TopoNode[][];
}

export interface LearningPath {
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
export function topoSortWithCycles(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[]
): TopoSortResult {
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const components = stronglyConnectedComponents(nodeIds, adj, byId);
  const componentByNodeId = new Map<string, number>();
  components.forEach((component, index) => {
    for (const id of component) componentByNodeId.set(id, index);
  });

  const componentEdges = new Map<number, Set<number>>();
  const indeg = new Map<number, number>();
  for (let i = 0; i < components.length; i++) indeg.set(i, 0);

  for (const id of nodeIds) {
    const fromComponent = componentByNodeId.get(id);
    if (fromComponent === undefined) continue;
    for (const { id: nxt } of adj.out.get(id) ?? []) {
      if (!nodeIds.has(nxt)) continue;
      const toComponent = componentByNodeId.get(nxt);
      if (toComponent === undefined || toComponent === fromComponent) continue;
      const edges = componentEdges.get(fromComponent) ?? new Set<number>();
      if (!edges.has(toComponent)) {
        edges.add(toComponent);
        componentEdges.set(fromComponent, edges);
        indeg.set(toComponent, (indeg.get(toComponent) ?? 0) + 1);
      }
    }
  }

  const ready: number[] = [];
  for (const [component, d] of indeg) if (d === 0) ready.push(component);
  ready.sort((a, b) => cmpComponent(components[a], components[b], byId));

  const orderedComponents: number[] = [];
  while (ready.length) {
    const cur = ready.shift()!;
    orderedComponents.push(cur);
    for (const nxt of componentEdges.get(cur) ?? []) {
      const d = (indeg.get(nxt) ?? 0) - 1;
      indeg.set(nxt, d);
      if (d === 0) {
        let i = 0;
        while (i < ready.length && cmpComponent(components[ready[i]], components[nxt], byId) < 0) i++;
        ready.splice(i, 0, nxt);
      }
    }
  }

  const nodes = orderedComponents.flatMap((component) =>
    components[component].map((id) => byId.get(id)).filter((node): node is TopoNode => Boolean(node)),
  );
  const cycles = components
    .filter((component) => isCycleComponent(component, adj))
    .map((component) =>
      component.map((id) => byId.get(id)).filter((node): node is TopoNode => Boolean(node)),
    );

  return { nodes, cycles };
}

/** Topological sort restricted to the subgraph induced by `nodeIds`. */
export function topoSort(
  nodeIds: Set<string>,
  adj: Adjacency,
  allNodes: TopoNode[]
): TopoNode[] {
  return topoSortWithCycles(nodeIds, adj, allNodes).nodes;
}

function stronglyConnectedComponents(
  nodeIds: Set<string>,
  adj: Adjacency,
  byId: Map<string, TopoNode>,
): string[][] {
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

function cmpComponent(
  a: string[],
  b: string[],
  byId: Map<string, TopoNode>,
): number {
  return cmpNum(byId.get(a[0])!, byId.get(b[0])!);
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
  return buildLearningPathReport(targetId, edges, allowed, nodes).nodes;
}

export function buildLearningPathReport(
  targetId: string,
  edges: TopoEdge[],
  allowed: Set<Relation>,
  nodes: TopoNode[]
): LearningPath {
  const adj = buildAdjacency(edges, allowed);
  const anc = ancestors(adj, targetId);
  anc.add(targetId);
  return topoSortWithCycles(anc, adj, nodes);
}
