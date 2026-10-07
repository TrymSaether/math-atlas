import dagre from "dagre";
import type { Edge, MarkerType, Node } from "reactflow";
import type { GraphDomain, GraphEdge, GraphNode } from "../types";
import { cmpNum } from "./graph";
import { getRelationStyle } from "./relationStyle";

export interface LayoutInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  domains?: GraphDomain[];
  showOrphans?: boolean;
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

export interface ClusterEdgeData {
  weight: number;
  sourceLabel: string;
  targetLabel: string;
  sourceColor: string;
  targetColor: string;
}

const NODE_W = 220;
const NODE_H = 100;
const COL_W = 320;
const SUBROW_H = 140;
const LANE_GAP = 100;

export function dependencyLayout({
  nodes,
  edges,
  domains = [],
  showOrphans = true,
}: LayoutInput): { nodes: Node[]; edges: Edge[]; regions: DomainRegion[] } {
  const hasEdge = new Set<string>();
  for (const edge of edges) {
    hasEdge.add(edge.from);
    hasEdge.add(edge.to);
  }
  const filtered = showOrphans ? nodes : nodes.filter((node) => hasEdge.has(node.id));
  const visible = new Set(filtered.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to));
  const depth = computeDepths(filtered, visibleEdges);
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const byDomain = groupByDomain(filtered);
  const domainIds = sortDomainIds([...byDomain.keys()], byDomain, domainById);

  const rfNodes: Node[] = [];
  const regions: DomainRegion[] = [];
  let y = 0;

  for (const domainId of domainIds) {
    const domain = domainById.get(domainId);
    const items = byDomain.get(domainId)!.sort(cmpNum);
    const byDepth = new Map<number, GraphNode[]>();
    for (const node of items) {
      const d = depth.get(node.id) ?? 0;
      const list = byDepth.get(d) ?? [];
      list.push(node);
      byDepth.set(d, list);
    }

    let laneStacks = 1;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const d of [...byDepth.keys()].sort((a, b) => a - b)) {
      const group = byDepth.get(d)!;
      laneStacks = Math.max(laneStacks, group.length);
      group.forEach((node, i) => {
        const x = d * COL_W;
        const nodeY = y + i * SUBROW_H;
        minX = Math.min(minX, x);
        minY = Math.min(minY, nodeY);
        maxX = Math.max(maxX, x + NODE_W);
        maxY = Math.max(maxY, nodeY + NODE_H);
        rfNodes.push({ id: node.id, type: "topo", position: { x, y: nodeY }, data: { node } });
      });
    }

    const laneH = laneStacks * SUBROW_H;
    if (Number.isFinite(minX)) {
      regions.push({
        id: domainId,
        label: domain?.label ?? items[0]?.topicCluster ?? domainId,
        count: items.length,
        x: minX - 44,
        y: minY - 44,
        width: Math.max(maxX - minX + 88, 320),
        height: Math.max(maxY - minY + 76, 156),
        color: domain?.color || "var(--accent)",
        tint: domain?.tint || "var(--accent-soft)",
        border: domain?.border || "var(--accent-border)",
      });
    }
    y += laneH + LANE_GAP - SUBROW_H + NODE_H;
  }

  return { nodes: rfNodes, edges: mapEdges(visibleEdges), regions };
}

export function clusterLayout({ nodes, edges, domains = [] }: LayoutInput): {
  nodes: Node[];
  edges: Edge[];
  regions: DomainRegion[];
} {
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const groups = groupByDomain(nodes);
  const domainIds = sortDomainIds([...groups.keys()], groups, domainById);
  const ring = Math.max(900, domainIds.length * 210);
  const rfNodes: Node[] = [];
  const regions: DomainRegion[] = [];

  domainIds.forEach((domainId, index) => {
    const domain = domainById.get(domainId);
    const theta = (index / domainIds.length) * Math.PI * 2;
    const cx = Math.cos(theta) * ring;
    const cy = Math.sin(theta) * ring;
    const members = groups.get(domainId)!.sort(cmpNum);
    const r = 90 + Math.sqrt(members.length) * 60;
    let regionRadius = 130;

    members.forEach((node, i) => {
      const a = (i / members.length) * Math.PI * 2;
      const x = cx + Math.cos(a) * r - NODE_W / 2;
      const y = cy + Math.sin(a) * r - NODE_H / 2;
      for (const [cornerX, cornerY] of [[x, y], [x + NODE_W, y], [x, y + NODE_H], [x + NODE_W, y + NODE_H]]) {
        regionRadius = Math.max(regionRadius, Math.hypot(cornerX - cx, cornerY - cy) + 64);
      }
      rfNodes.push({ id: node.id, type: "topo", position: { x, y }, data: { node, cluster: domain?.label ?? node.topicCluster } });
    });

    regions.push({
      id: domainId,
      label: domain?.label ?? members[0]?.topicCluster ?? domainId,
      count: members.length,
      x: cx - regionRadius,
      y: cy - regionRadius,
      width: regionRadius * 2,
      height: regionRadius * 2,
      color: domain?.color || "var(--accent)",
      tint: domain?.tint || "var(--accent-soft)",
      border: domain?.border || "var(--accent-border)",
      shape: "circle",
    });
  });

  return { nodes: rfNodes, edges: mapEdges(edges), regions };
}

export function overviewLayout({ nodes, edges, domains = [] }: LayoutInput): {
  nodes: Node[];
  edges: Edge[];
  regions: DomainRegion[];
} {
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const byDomain = groupByDomain(nodes);
  const domainIds = sortDomainIds([...byDomain.keys()], byDomain, domainById);
  const cols = Math.max(1, Math.ceil(Math.sqrt(domainIds.length)));
  const bubbleW = 280;
  const bubbleH = 200;
  const gapX = 80;
  const gapY = 80;

  const rfNodes: Node[] = domainIds.map((domainId, index) => {
    const members = byDomain.get(domainId)!.sort(cmpNum);
    const domain = domainById.get(domainId);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      id: `cluster-bubble-${domainId}`,
      type: "clusterBubble",
      position: { x: col * (bubbleW + gapX), y: row * (bubbleH + gapY) },
      data: {
        domainId,
        label: domain?.label ?? members[0]?.topicCluster ?? domainId,
        count: members.length,
        sampleTitles: members.slice(0, 4).map((node) => node.title),
        color: domain?.color || "var(--accent)",
        tint: domain?.tint || "var(--accent-soft)",
        border: domain?.border || "var(--accent-border)",
        width: bubbleW,
        height: bubbleH,
      },
      draggable: false,
      selectable: true,
      style: { width: bubbleW, height: bubbleH, pointerEvents: "all" },
    };
  });

  const nodeDomain = new Map(nodes.map((node) => [node.id, node.domainId]));
  const aggregate = new Map<string, { from: string; to: string; weight: number }>();
  for (const edge of edges) {
    const fromDomain = nodeDomain.get(edge.from);
    const toDomain = nodeDomain.get(edge.to);
    if (!fromDomain || !toDomain || fromDomain === toDomain) continue;
    const key = `${fromDomain}|${toDomain}`;
    const entry = aggregate.get(key);
    if (entry) entry.weight += 1;
    else aggregate.set(key, { from: fromDomain, to: toDomain, weight: 1 });
  }

  const rfEdges: Edge[] = [...aggregate.values()].map((edge) => {
    const source = domainById.get(edge.from);
    const target = domainById.get(edge.to);
    return {
      id: `cluster-edge-${edge.from}-${edge.to}`,
      source: `cluster-bubble-${edge.from}`,
      target: `cluster-bubble-${edge.to}`,
      type: "cluster",
      data: {
        weight: edge.weight,
        sourceLabel: source?.label ?? edge.from,
        targetLabel: target?.label ?? edge.to,
        sourceColor: source?.color || "var(--accent)",
        targetColor: target?.color || "var(--accent)",
      } satisfies ClusterEdgeData,
    };
  });

  return { nodes: rfNodes, edges: rfEdges, regions: [] };
}

export function dagreLayout({ nodes, edges }: LayoutInput): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 90, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) g.setNode(node.id, { width: NODE_W, height: NODE_H });
  for (const edge of edges) g.setEdge(edge.from, edge.to);
  dagre.layout(g);
  return nodes.map((node) => {
    const p = g.node(node.id);
    return { id: node.id, type: "topo", position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 }, data: { node } };
  });
}

function groupByDomain(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const groups = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const list = groups.get(node.domainId) ?? [];
    list.push(node);
    groups.set(node.domainId, list);
  }
  return groups;
}

function sortDomainIds(
  domainIds: string[],
  groups: Map<string, GraphNode[]>,
  domainById: Map<string, GraphDomain>,
): string[] {
  return domainIds.sort((a, b) => {
    const da = domainById.get(a);
    const db = domainById.get(b);
    if (da && db && da.order !== db.order) return da.order - db.order;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return cmpKey(minKey(groups.get(a) ?? []), minKey(groups.get(b) ?? []));
  });
}

function mapEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: "topo",
    markerEnd: {
      type: "arrowclosed" as MarkerType,
      width: 14,
      height: 14,
      color: getRelationStyle(edge.relation).color,
    },
    data: { edge },
  }));
}

function computeDepths(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const incoming = new Map<string, string[]>();
  for (const node of nodes) incoming.set(node.id, []);
  for (const edge of edges) incoming.get(edge.to)?.push(edge.from);
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const compute = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let d = 0;
    for (const predecessor of incoming.get(id) ?? []) d = Math.max(d, compute(predecessor) + 1);
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };

  for (const node of nodes) compute(node.id);
  return depth;
}

function minKey(items: GraphNode[]): [string, number[]] {
  let best: [string, number[]] | null = null;
  for (const node of items) {
    const k = parseKey(node.chapter, node.number);
    if (!best || cmpKey(k, best) < 0) best = k;
  }
  return best ?? ["", [0]];
}

function parseKey(chapter: string, number: string): [string, number[]] {
  return [chapter, number.split(".").map((part) => Number(part) || 0)];
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
