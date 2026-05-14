import dagre from "dagre";
import type { Node, Edge, MarkerType } from "reactflow";
import type { GraphDomain, TopoEdge, TopoNode } from "../types";
import { RELATION_COLOR } from "../types";
import { cmpNum } from "./graph";

export interface LayoutInput {
  nodes: TopoNode[];
  edges: TopoEdge[];
  domains?: GraphDomain[];
  showOrphans?: boolean;
}

const NODE_W = 220; // Node width
const NODE_H = 100; // Node height
const COL_W = 320; // Horizontal spacing between columns (depth levels)
const SUBROW_H = 140; // Vertical spacing between nodes in same lane
const LANE_GAP = 100; // Vertical gap between lanes/topics

/**
 * Swimlane dependency layout: each topic cluster becomes a horizontal
 * lane, ordered by the mathematical progression. Items are spread
 * along the X axis by their textbook number within the topic so the
 * timeline reads left-to-right while the vertical axis groups by theme.
 *
 * When `showOrphans === false`, items with neither incoming nor outgoing
 * edges in the current edge set are dropped.
 */
export function dependencyLayout({
  nodes,
  edges,
  domains = [],
  showOrphans = true,
}: LayoutInput): { nodes: Node[]; edges: Edge[]; regions: DomainRegion[] } {
  const hasEdge = new Set<string>();
  for (const e of edges) {
    hasEdge.add(e.from);
    hasEdge.add(e.to);
  }
  const filtered = showOrphans ? nodes : nodes.filter((n) => hasEdge.has(n.id));
  const visible = new Set(filtered.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visible.has(e.from) && visible.has(e.to),
  );

  // Compute depth = longest predecessor path length in the visible DAG.
  // Items with no incoming visible edge get depth 0; arrows flow left-to-right.
  const depth = computeDepths(filtered, visibleEdges);

  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const byDomain = new Map<string, TopoNode[]>();
  for (const n of filtered) {
    if (!byDomain.has(n.domainId)) byDomain.set(n.domainId, []);
    byDomain.get(n.domainId)!.push(n);
  }
  const domainIds = [...byDomain.keys()].sort((a, b) => {
    const da = domainById.get(a);
    const db = domainById.get(b);
    if (da && db && da.order !== db.order) return da.order - db.order;
    if (da && !db) return -1;
    if (!da && db) return 1;
    const ka = minKey(byDomain.get(a)!);
    const kb = minKey(byDomain.get(b)!);
    return cmpKey(ka, kb);
  });

  const rfNodes: Node[] = [];
  const regions: DomainRegion[] = [];
  let y = 0;
  for (const domainId of domainIds) {
    const domain = domainById.get(domainId);
    const items = byDomain.get(domainId)!.sort(cmpNum);
    // Bucket items by depth within this lane so ties stack vertically.
    const byDepth = new Map<number, TopoNode[]>();
    for (const n of items) {
      const d = depth.get(n.id) ?? 0;
      if (!byDepth.has(d)) byDepth.set(d, []);
      byDepth.get(d)!.push(n);
    }
    let laneStacks = 1;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const d of [...byDepth.keys()].sort((a, b) => a - b)) {
      const group = byDepth.get(d)!;
      laneStacks = Math.max(laneStacks, group.length);
      group.forEach((n, i) => {
        const x = d * COL_W;
        const nodeY = y + i * SUBROW_H;
        minX = Math.min(minX, x);
        minY = Math.min(minY, nodeY);
        maxX = Math.max(maxX, x + NODE_W);
        maxY = Math.max(maxY, nodeY + NODE_H);
        rfNodes.push({
          id: n.id,
          type: "topo",
          position: { x, y: nodeY },
          data: { node: n },
        });
      });
    }
    const laneH = laneStacks * SUBROW_H;
    regions.push({
      id: domainId,
      label: domain?.label ?? items[0]?.topicCluster ?? domainId,
      count: items.length,
      x: minX - 44,
      y: minY - 44,
      width: Math.max(maxX - minX + 88, 320),
      height: Math.max(maxY - minY + 76, 156),
      color: domain?.color ?? "var(--primary)",
      tint: domain?.tint ?? "rgba(var(--primary-rgb),0.05)",
      border: domain?.border ?? "rgba(var(--primary-rgb),0.35)",
    });
    y += laneH + LANE_GAP - SUBROW_H + NODE_H;
  }

  const rfEdges: Edge[] = visibleEdges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: "topo",
    markerEnd: {
      type: "arrowclosed" as MarkerType,
      width: 14,
      height: 14,
      color: edgeColor(e),
    },
    data: { edge: e },
  }));
  return { nodes: rfNodes, edges: rfEdges, regions };
}

function computeDepths(
  nodes: TopoNode[],
  edges: TopoEdge[],
): Map<string, number> {
  const inMap = new Map<string, string[]>();
  for (const n of nodes) inMap.set(n.id, []);
  for (const e of edges) {
    if (inMap.has(e.to)) inMap.get(e.to)!.push(e.from);
  }
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const compute = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const preds = inMap.get(id) ?? [];
    let d = 0;
    for (const p of preds) d = Math.max(d, compute(p) + 1);
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const n of nodes) compute(n.id);
  return depth;
}

/** Optional: classic dagre LR layout, kept for the cluster/path overlays. */
export function dagreLayout({ nodes, edges }: LayoutInput) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 36,
    ranksep: 90,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) g.setEdge(e.from, e.to);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return {
      id: n.id,
      type: "topo",
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      data: { node: n },
    } as Node;
  });
}

export function clusterLayout({ nodes, edges, domains = [] }: LayoutInput): {
  nodes: Node[];
  edges: Edge[];
  regions: DomainRegion[];
} {
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const groups = new Map<string, TopoNode[]>();
  for (const n of nodes) {
    if (!groups.has(n.domainId)) groups.set(n.domainId, []);
    groups.get(n.domainId)!.push(n);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const da = domainById.get(a);
    const db = domainById.get(b);
    if (da && db && da.order !== db.order) return da.order - db.order;
    if (da && !db) return -1;
    if (!da && db) return 1;
    const ka = minKey(groups.get(a)!);
    const kb = minKey(groups.get(b)!);
    return cmpKey(ka, kb);
  });
  const RING = Math.max(900, keys.length * 200);
  const rfNodes: Node[] = [];
  const regions: DomainRegion[] = [];

  keys.forEach((domainId, gi) => {
    const domain = domainById.get(domainId);
    const theta = (gi / keys.length) * Math.PI * 2;
    const cx = Math.cos(theta) * RING;
    const cy = Math.sin(theta) * RING;
    const members = groups.get(domainId)!.sort(cmpNum);
    const r = 90 + Math.sqrt(members.length) * 60;
    let regionRadius = 130;
    members.forEach((n, i) => {
      const a = (i / members.length) * Math.PI * 2;
      const x = cx + Math.cos(a) * r - NODE_W / 2;
      const y = cy + Math.sin(a) * r - NODE_H / 2;
      for (const [cornerX, cornerY] of [
        [x, y],
        [x + NODE_W, y],
        [x, y + NODE_H],
        [x + NODE_W, y + NODE_H],
      ]) {
        regionRadius = Math.max(
          regionRadius,
          Math.hypot(cornerX - cx, cornerY - cy) + 64,
        );
      }
      rfNodes.push({
        id: n.id,
        type: "topo",
        position: { x, y },
        data: { node: n, cluster: domain?.label ?? n.topicCluster },
      });
    });
    regions.push({
      id: domainId,
      label: domain?.label ?? members[0]?.topicCluster ?? domainId,
      count: members.length,
      x: cx - regionRadius,
      y: cy - regionRadius,
      width: regionRadius * 2,
      height: regionRadius * 2,
      color: domain?.color ?? "var(--primary)",
      tint: domain?.tint ?? "rgba(var(--primary-rgb),0.05)",
      border: domain?.border ?? "rgba(var(--primary-rgb),0.35)",
      shape: "circle",
    });
  });
  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: "topo",
    markerEnd: {
      type: "arrowclosed" as MarkerType,
      width: 12,
      height: 12,
      color: edgeColor(e),
    },
    data: { edge: e },
  }));
  return { nodes: rfNodes, edges: rfEdges, regions };
}

export interface DomainRegion {
  id: string;
  label: string;
  count: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  tint: string;
  border: string;
  shape?: "rect" | "circle";
}

function minKey(items: TopoNode[]): [string, number[]] {
  let best: [string, number[]] | null = null;
  for (const n of items) {
    const k = parseKey(n.chapter, n.number);
    if (!best || cmpKey(k, best) < 0) best = k;
  }
  return best ?? ["", [0]];
}

function parseKey(chapter: string, number: string): [string, number[]] {
  const nums = number.split(".").map((p) => Number(p) || 0);
  return [chapter, nums];
}

function cmpKey(a: [string, number[]], b: [string, number[]]): number {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  const len = Math.max(a[1].length, b[1].length);
  for (let i = 0; i < len; i++) {
    const x = a[1][i] ?? 0,
      y = b[1][i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function edgeColor(e: TopoEdge): string {
  return RELATION_COLOR[e.relation] ?? "var(--primary)";
}
