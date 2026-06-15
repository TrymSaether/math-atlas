/**
 * Graph algorithms over a CliMap, hand-rolled (no graphology dependency) and
 * cycle-safe throughout. The dependency DAG uses the artifact convention
 * `from → to` ⇒ "to depends on from" (from is the prerequisite). Helpers that
 * talk about prerequisites/dependents respect that; undirected helpers (path,
 * components) ignore direction.
 */
import type { CliMap } from "../core/model";
import type { ArtifactEdge } from "../../../src/data/artifactSchema";

/** All concept ids reachable as prerequisites of `start` (transitive, excl. start). */
export function prerequisiteChain(map: CliMap, start: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const stack = [...(map.prereqsOf.get(start) ?? [])];
  // DFS post-order so deepest foundations surface first.
  const visit = (id: string): void => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const p of map.prereqsOf.get(id) ?? []) visit(p);
    order.push(id);
  };
  for (const p of stack) visit(p);
  return order;
}

/** Degree-0 concepts (no edges of any relation). */
export function orphans(map: CliMap): string[] {
  return map.nodes.filter((n) => n.degree === 0).map((n) => n.id);
}

/** Concepts with no prerequisites (DAG roots / foundations). */
export function roots(map: CliMap): string[] {
  return map.nodes
    .filter((n) => (map.prereqsOf.get(n.id)?.length ?? 0) === 0)
    .map((n) => n.id);
}

export interface Cycle {
  nodes: string[];
}

/** Detect cycles in the dependency DAG via DFS colouring. Returns each cycle once. */
export function detectCycles(map: CliMap): Cycle[] {
  const color = new Map<string, 0 | 1 | 2>(); // 0 white, 1 gray, 2 black
  const stack: string[] = [];
  const cycles: Cycle[] = [];
  const adj = (id: string): string[] => map.dependentsOf.get(id) ?? [];

  const visit = (id: string): void => {
    color.set(id, 1);
    stack.push(id);
    for (const next of adj(id)) {
      const c = color.get(next) ?? 0;
      if (c === 0) visit(next);
      else if (c === 1) {
        const i = stack.indexOf(next);
        if (i >= 0) cycles.push({ nodes: stack.slice(i) });
      }
    }
    stack.pop();
    color.set(id, 2);
  };

  for (const n of map.nodes) if ((color.get(n.id) ?? 0) === 0) visit(n.id);
  return cycles;
}

/** Kahn's topological order over the dependency DAG (foundations first). */
export function topoSort(map: CliMap): { order: string[]; hasCycle: boolean } {
  const indeg = new Map<string, number>();
  for (const n of map.nodes)
    indeg.set(n.id, map.prereqsOf.get(n.id)?.length ?? 0);
  const queue = map.nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const dep of map.dependentsOf.get(id) ?? []) {
      indeg.set(dep, (indeg.get(dep) ?? 1) - 1);
      if (indeg.get(dep) === 0) queue.push(dep);
    }
  }
  return { order, hasCycle: order.length !== map.nodes.length };
}

export interface PathStep {
  id: string;
  edge?: ArtifactEdge;
  forward?: boolean; // edge traversed along its from→to direction
}

/** Shortest undirected path between two concepts (BFS), with the edges used. */
export function shortestPath(
  map: CliMap,
  a: string,
  b: string,
): PathStep[] | undefined {
  if (!map.nodeById.has(a) || !map.nodeById.has(b)) return undefined;
  if (a === b) return [{ id: a }];

  const prev = new Map<
    string,
    { from: string; edge: ArtifactEdge; forward: boolean }
  >();
  const queue = [a];
  const seen = new Set([a]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === b) break;
    const incident = [
      ...(map.outBy.get(cur) ?? []).map((e) => ({
        e,
        next: e.to,
        forward: true,
      })),
      ...(map.inBy.get(cur) ?? []).map((e) => ({
        e,
        next: e.from,
        forward: false,
      })),
    ];
    for (const { e, next, forward } of incident) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, { from: cur, edge: e, forward });
      queue.push(next);
    }
  }
  if (!seen.has(b)) return undefined;

  const steps: PathStep[] = [];
  let cur = b;
  while (cur !== a) {
    const p = prev.get(cur)!;
    steps.unshift({ id: cur, edge: p.edge, forward: p.forward });
    cur = p.from;
  }
  steps.unshift({ id: a });
  return steps;
}

/** Weakly-connected components (undirected union-find). Largest first. */
export function components(map: CliMap): string[][] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) {
      const nxt = parent.get(x)!;
      parent.set(x, r);
      x = nxt;
    }
    return r;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const n of map.nodes) parent.set(n.id, n.id);
  for (const e of map.edges) union(e.from, e.to);

  const groups = new Map<string, string[]>();
  for (const n of map.nodes) {
    const r = find(n.id);
    (groups.get(r) ?? groups.set(r, []).get(r)!).push(n.id);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length);
}

/** Betweenness centrality (Brandes, unweighted, undirected). Normalised 0..1. */
export function betweenness(map: CliMap): Map<string, number> {
  const ids = map.nodes.map((n) => n.id);
  const cb = new Map<string, number>(ids.map((id) => [id, 0]));
  const adj = (id: string): string[] => [...(map.neighbors.get(id) ?? [])];

  for (const s of ids) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(ids.map((id) => [id, []]));
    const sigma = new Map<string, number>(ids.map((id) => [id, 0]));
    const dist = new Map<string, number>(ids.map((id) => [id, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);
    const queue = [s];
    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj(v)) {
        if (dist.get(w) === -1) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }
    const delta = new Map<string, number>(ids.map((id) => [id, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      }
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }

  // Normalise by max so the column is readable.
  let max = 0;
  for (const v of cb.values()) max = Math.max(max, v);
  if (max > 0) for (const [k, v] of cb) cb.set(k, v / max);
  return cb;
}
