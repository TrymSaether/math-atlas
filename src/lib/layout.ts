import dagre from "dagre";
import type { Node, Edge, MarkerType } from "reactflow";
import type { TopoEdge, TopoNode } from "../types";
import { cmpNum } from "./graph";

export interface LayoutInput {
  nodes: TopoNode[];
  edges: TopoEdge[];
  showOrphans?: boolean;
}

const NODE_W = 240;
const NODE_H = 92;
const COL_W = 280;
const ROW_H = 150;
const LANE_GAP = 60;

/**
 * Swimlane dependency layout: chapters become horizontal lanes, items
 * are spread along the X axis by their number within the chapter. Real
 * dependency edges curve between lanes. This gives an at-a-glance
 * "course timeline" that the dagre-only layout could not provide because
 * most nodes have no inferred edges and dagre collapsed them to rank 0.
 *
 * When `showOrphans === false`, items with neither incoming nor outgoing
 * edges in the current edge set are dropped.
 */
export function dependencyLayout({
  nodes, edges, showOrphans = true,
}: LayoutInput): { nodes: Node[]; edges: Edge[]; lanes: Lane[] } {
  const hasEdge = new Set<string>();
  for (const e of edges) { hasEdge.add(e.from); hasEdge.add(e.to); }
  const filtered = showOrphans ? nodes : nodes.filter((n) => hasEdge.has(n.id));

  const byChapter = new Map<string, TopoNode[]>();
  for (const n of filtered) {
    if (!byChapter.has(n.chapter)) byChapter.set(n.chapter, []);
    byChapter.get(n.chapter)!.push(n);
  }
  const chapters = [...byChapter.keys()].sort();

  const rfNodes: Node[] = [];
  const lanes: Lane[] = [];
  let y = 0;
  let maxCols = 0;
  for (const c of chapters) {
    const items = byChapter.get(c)!.sort(cmpNum);
    maxCols = Math.max(maxCols, items.length);
    items.forEach((n, col) => {
      rfNodes.push({
        id: n.id,
        type: "topo",
        position: { x: col * COL_W, y },
        data: { node: n },
      });
    });
    lanes.push({
      chapter: c,
      title: items[0]?.sectionTitle ?? "",
      y,
      height: NODE_H + LANE_GAP / 2,
      width: items.length * COL_W,
    });
    y += NODE_H + LANE_GAP;
  }
  // Fill all lane widths to the widest so the lane backgrounds align.
  const fullW = maxCols * COL_W;
  for (const l of lanes) l.width = fullW;

  const visible = new Set(filtered.map((n) => n.id));
  const rfEdges: Edge[] = edges
    .filter((e) => visible.has(e.from) && visible.has(e.to))
    .map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      type: "topo",
      markerEnd: { type: "arrowclosed" as MarkerType, width: 14, height: 14, color: edgeColor(e) },
      data: { edge: e },
    }));
  return { nodes: rfNodes, edges: rfEdges, lanes };
}

/** Optional: classic dagre LR layout, kept for the cluster/path overlays. */
export function dagreLayout({ nodes, edges }: LayoutInput) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 90, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) g.setEdge(e.from, e.to);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { id: n.id, type: "topo", position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 }, data: { node: n } } as Node;
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
    const r = 90 + Math.sqrt(members.length) * 60;
    members.forEach((n, i) => {
      const a = (i / members.length) * Math.PI * 2;
      rfNodes.push({
        id: n.id, type: "topo",
        position: { x: cx + Math.cos(a) * r - NODE_W / 2, y: cy + Math.sin(a) * r - NODE_H / 2 },
        data: { node: n, cluster: k },
      });
    });
  });
  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id, source: e.from, target: e.to, type: "topo",
    markerEnd: { type: "arrowclosed" as MarkerType, width: 12, height: 12, color: edgeColor(e) },
    data: { edge: e },
  }));
  return { nodes: rfNodes, edges: rfEdges };
}

export interface Lane {
  chapter: string;
  title: string;
  y: number;
  height: number;
  width: number;
}

function edgeColor(e: TopoEdge): string {
  return e.relation === "proof" ? "#a78bff" : e.relation === "illustration" ? "#ffd58a" : "#5ce1ff";
}
