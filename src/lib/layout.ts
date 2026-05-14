import dagre from "dagre";
import type { Node, Edge, MarkerType } from "reactflow";
import type { TopoEdge, TopoNode } from "../types";
import { RELATION_COLOR } from "../types";
import { cmpNum } from "./graph";
import { getAtlasGroup } from "./atlasGroups";

export interface LayoutInput {
  nodes: TopoNode[];
  edges: TopoEdge[];
  showOrphans?: boolean;
}

const NODE_W = 248;
const NODE_H = 108;
const GROUP_PAD_X = 28;
const GROUP_HEADER_H = 78;
const GROUP_GAP_X = 46;
const GROUP_GAP_Y = 40;
const NODE_GAP_X = 28;
const NODE_GAP_Y = 26;
const ATLAS_COL_W = 610;

/**
 * Atlas layout: nodes are arranged inside colored concept regions. The X/Y
 * position of a region is stable and grid-like, while nodes inside each region
 * are ordered by dependency depth and then by textbook/index number. This gives
 * routes room to travel between groups instead of producing a tangled force map.
 */
export function dependencyLayout({
  nodes,
  edges,
  showOrphans = true,
}: LayoutInput): { nodes: Node[]; edges: Edge[]; lanes: Lane[] } {
  const hasEdge = new Set<string>();
  for (const e of edges) {
    hasEdge.add(e.from);
    hasEdge.add(e.to);
  }

  const filtered = showOrphans ? nodes : nodes.filter((n) => hasEdge.has(n.id));
  const visible = new Set(filtered.map((n) => n.id));
  const visibleEdges = edges.filter((e) => visible.has(e.from) && visible.has(e.to));
  const depth = computeDepths(filtered, visibleEdges);

  const byTopic = new Map<string, TopoNode[]>();
  for (const n of filtered) {
    const topic = n.topicCluster || "General";
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(n);
  }

  const topics = [...byTopic.keys()].sort((a, b) => {
    const ka = minKey(byTopic.get(a)!);
    const kb = minKey(byTopic.get(b)!);
    return cmpKey(ka, kb) || a.localeCompare(b);
  });

  const columnCount = topics.length <= 2 ? 2 : topics.length <= 6 ? 3 : 4;
  const columnHeights = Array.from({ length: columnCount }, () => 0);
  const rfNodes: Node[] = [];
  const lanes: Lane[] = [];

  for (const topic of topics) {
    const items = byTopic.get(topic)!.slice().sort((a, b) => {
      const da = depth.get(a.id) ?? 0;
      const db = depth.get(b.id) ?? 0;
      return da - db || cmpNum(a, b);
    });

    const itemCount = items.length;
    const innerCols = itemCount <= 2 ? 1 : itemCount <= 7 ? 2 : 3;
    const rows = Math.max(1, Math.ceil(itemCount / innerCols));
    const width = GROUP_PAD_X * 2 + innerCols * NODE_W + (innerCols - 1) * NODE_GAP_X;
    const height = GROUP_HEADER_H + rows * NODE_H + Math.max(0, rows - 1) * NODE_GAP_Y + GROUP_PAD_X;

    let col = 0;
    for (let i = 1; i < columnHeights.length; i++) {
      if (columnHeights[i] < columnHeights[col]) col = i;
    }

    const x = col * ATLAS_COL_W;
    const y = columnHeights[col];
    columnHeights[col] += height + GROUP_GAP_Y;

    const group = getAtlasGroup(topic);
    lanes.push({
      topic: group.label,
      subtitle: `${itemCount} concept${itemCount === 1 ? "" : "s"}`,
      x,
      y,
      height,
      width,
      color: group.color,
      rgb: group.rgb,
      icon: group.icon,
    });

    items.forEach((n, index) => {
      const localCol = index % innerCols;
      const localRow = Math.floor(index / innerCols);
      rfNodes.push({
        id: n.id,
        type: "topo",
        position: {
          x: x + GROUP_PAD_X + localCol * (NODE_W + NODE_GAP_X),
          y: y + GROUP_HEADER_H + localRow * (NODE_H + NODE_GAP_Y),
        },
        data: { node: n, group },
      });
    });
  }

  const rfEdges: Edge[] = visibleEdges.map((e) => ({
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

  return { nodes: rfNodes, edges: rfEdges, lanes };
}

function computeDepths(nodes: TopoNode[], edges: TopoEdge[]): Map<string, number> {
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
    if (visiting.has(id)) return 0;
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

/** Optional: classic dagre LR layout. */
export function dagreLayout({ nodes, edges }: LayoutInput) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 44, ranksep: 110, marginx: 32, marginy: 32 });
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

export function clusterLayout({ nodes, edges }: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const groups = new Map<string, TopoNode[]>();
  for (const n of nodes) {
    if (!groups.has(n.topicCluster)) groups.set(n.topicCluster, []);
    groups.get(n.topicCluster)!.push(n);
  }
  const keys = [...groups.keys()].sort();
  const RING = Math.max(900, keys.length * 200);
  const rfNodes: Node[] = [];

  keys.forEach((k, gi) => {
    const theta = (gi / keys.length) * Math.PI * 2;
    const cx = Math.cos(theta) * RING;
    const cy = Math.sin(theta) * RING;
    const members = groups.get(k)!.sort(cmpNum);
    const r = 110 + Math.sqrt(members.length) * 70;
    members.forEach((n, i) => {
      const a = (i / members.length) * Math.PI * 2;
      rfNodes.push({
        id: n.id,
        type: "topo",
        position: {
          x: cx + Math.cos(a) * r - NODE_W / 2,
          y: cy + Math.sin(a) * r - NODE_H / 2,
        },
        data: { node: n, cluster: k },
      });
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
  return { nodes: rfNodes, edges: rfEdges };
}

export interface Lane {
  topic: string;
  subtitle: string;
  x: number;
  y: number;
  height: number;
  width: number;
  color: string;
  rgb: string;
  icon: string;
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
    const x = a[1][i] ?? 0;
    const y = b[1][i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function edgeColor(e: TopoEdge): string {
  return RELATION_COLOR[e.relation] ?? "var(--primary)";
}
