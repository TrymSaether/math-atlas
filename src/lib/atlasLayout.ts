import dagre from "dagre";
import type { GraphData, GraphDomain, GraphNode } from "../types";
import type { GraphMetrics } from "./graphMetrics";

export interface Position {
  x: number;
  y: number;
}

const NODE_WIDTH = 264;
const NODE_HEIGHT = 100;
const RANK_SEP = 92;
const NODE_SEP = 36;
const CLUSTER_PAD = 40;

// Swimlane layout geometry.
const ROW_GAP = 28; // vertical gap between stacked nodes
const COL_GAP_INNER = 24; // gap between sub-columns inside one depth cell
const DEPTH_GAP = 104; // gap between adjacent depth cells (reads as "next level")
const LANE_GAP = 96; // vertical gap between domain lanes
const LANE_PAD_Y = 56; // inner vertical padding inside a lane band
const LANE_PAD_X = 48; // inner horizontal padding at lane ends
const MAX_ROWS_PER_CELL = 7; // a depth cell wraps into a grid block past this height

/** A single domain lane laid out relative to its own top-left, before stacking. */
interface LaneLayout {
  domainId: string;
  width: number;
  height: number;
  rel: Map<string, Position>;
}

// Deterministic seeded PRNG (mulberry32).
function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface AtlasLayout {
  positions: Map<string, Position>;
  domainBounds: Map<string, DomainBounds>;
}

export interface DomainBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "rect" | "circle";
}

/**
 * Global dagre layout: every node is laid out in a single graph so cross-domain
 * edges participate in ranking. Compound nesting (subgraph per domain) keeps
 * members of a domain spatially together without isolating them from the rest
 * of the dependency structure.
 */
export function computeAtlasLayout(data: GraphData): AtlasLayout {
  const positions = new Map<string, Position>();
  const domainBounds = new Map<string, DomainBounds>();
  if (data.nodes.length === 0) return { positions, domainBounds };

  const nodeIds = new Set(data.nodes.map((n) => n.id));
  const domainOrder = data.domains.map((d) => d.id);
  for (const n of data.nodes) {
    if (!domainOrder.includes(n.domainId)) domainOrder.push(n.domainId);
  }

  const g = new dagre.graphlib.Graph({ directed: true, compound: true });
  g.setGraph({
    rankdir: "TB",
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: 40,
    marginy: 40,
    ranker: "tight-tree",
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Cluster (compound) parents per domain.
  for (const domainId of domainOrder) {
    g.setNode(`cluster::${domainId}`, { label: domainId, clusterLabelPos: "top" });
  }

  const domainByNodeId = new Map<string, string>();
  for (const node of data.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    g.setParent(node.id, `cluster::${node.domainId}`);
    domainByNodeId.set(node.id, node.domainId);
  }

  for (const edge of data.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
    // Weight intra-domain edges higher so dagre keeps cluster members close.
    // Cross-domain edges get minlen=0 so they don't stretch ranks vertically.
    const sameDomain = domainByNodeId.get(edge.from) === domainByNodeId.get(edge.to);
    g.setEdge(edge.from, edge.to, {
      weight: sameDomain ? 4 : 1,
      minlen: 1,
    });
  }

  dagre.layout(g);

  for (const node of data.nodes) {
    const laid = g.node(node.id);
    positions.set(node.id, { x: laid.x - NODE_WIDTH / 2, y: laid.y - NODE_HEIGHT / 2 });
  }

  for (const domainId of domainOrder) {
    const cluster = g.node(`cluster::${domainId}`) as unknown as
      | { x: number; y: number; width: number; height: number }
      | undefined;
    if (!cluster || !Number.isFinite(cluster.width) || cluster.width === 0) continue;
    domainBounds.set(domainId, {
      x: cluster.x - cluster.width / 2 - CLUSTER_PAD,
      y: cluster.y - cluster.height / 2 - CLUSTER_PAD,
      width: cluster.width + CLUSTER_PAD * 2,
      height: cluster.height + CLUSTER_PAD * 2,
    });
  }

  return { positions, domainBounds };
}

/**
 * Swimlane layout: a layered DAG drawn as an atlas.
 *
 *   x = epistemic depth  (foundations on the left, advanced results on the right)
 *   y = domain lane       (one horizontal band per domain, ordered by domain.order)
 *
 * Within a (domain, depth) cell, nodes are stacked vertically, most-impactful
 * first. Columns share a global x-grid so a vertical scan reads "same depth"
 * across every lane. Lane bands span the full canvas width so they read as
 * geography, not bounding boxes.
 *
 * Positions are deterministic: ordering is fully determined by depth, impact,
 * and the stable node ordering — no jitter, so spatial memory survives reloads.
 */
export function computeSwimlaneLayout(
  data: GraphData,
  metrics: GraphMetrics,
): AtlasLayout {
  const positions = new Map<string, Position>();
  const domainBounds = new Map<string, DomainBounds>();
  if (data.nodes.length === 0) return { positions, domainBounds };

  const { depthByNodeId, impactByNodeId } = metrics;

  // Lane order: declared domain order first, then any stragglers.
  const laneOrder = data.domains.map((d) => d.id);
  for (const node of data.nodes) {
    if (!laneOrder.includes(node.domainId)) laneOrder.push(node.domainId);
  }

  const nodesByDomain = new Map<string, GraphNode[]>();
  for (const node of data.nodes) {
    const list = nodesByDomain.get(node.domainId) ?? [];
    list.push(node);
    nodesByDomain.set(node.domainId, list);
  }

  // Pass 1 — lay out each lane relative to its own top-left (0,0) and record its
  // box. Absolute placement is deferred so lanes can be shelf-packed into columns.
  const lanes: LaneLayout[] = [];
  for (const domainId of laneOrder) {
    const members = nodesByDomain.get(domainId);
    if (!members || members.length === 0) continue;

    // Bucket members by their (global) depth.
    const byDepth = new Map<number, GraphNode[]>();
    for (const node of members) {
      const depth = depthByNodeId.get(node.id) ?? 0;
      const list = byDepth.get(depth) ?? [];
      list.push(node);
      byDepth.set(depth, list);
    }

    // Depth levels this lane actually uses, in order (foundations left → advanced
    // right). Absent global levels are skipped so lanes stay dense.
    const usedDepths = [...byDepth.keys()].sort((a, b) => a - b);

    // Sort each cell most-impactful first.
    for (const list of byDepth.values()) {
      list.sort((a, b) => {
        const diff = (impactByNodeId.get(b.id) ?? 0) - (impactByNodeId.get(a.id) ?? 0);
        if (diff !== 0) return diff;
        return compareNodeOrder(a, b);
      });
    }

    // A depth cell wraps into a grid block (rows × sub-columns) when it has more
    // than MAX_ROWS_PER_CELL nodes, so a big pile of dependency-less nodes packs
    // into a square block instead of one absurdly tall strip. The tallest block
    // sets the lane height.
    const cellRows = (n: number) => Math.min(n, MAX_ROWS_PER_CELL);
    let maxRows = 0;
    for (const depth of usedDepths) maxRows = Math.max(maxRows, cellRows(byDepth.get(depth)!.length));

    const laneHeight = LANE_PAD_Y * 2 + maxRows * NODE_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP;
    const laneMidY = laneHeight / 2;

    const rel = new Map<string, Position>();
    let cursorX = LANE_PAD_X;
    for (const depth of usedDepths) {
      const list = byDepth.get(depth)!;
      const rows = cellRows(list.length);
      const cols = Math.ceil(list.length / rows);
      const blockHeight = rows * NODE_HEIGHT + (rows - 1) * ROW_GAP;
      const blockTop = laneMidY - blockHeight / 2;
      // Fill row-major: highest-impact lands top-left.
      list.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        rel.set(node.id, {
          x: cursorX + col * (NODE_WIDTH + COL_GAP_INNER),
          y: blockTop + row * (NODE_HEIGHT + ROW_GAP),
        });
      });
      const blockWidth = cols * NODE_WIDTH + (cols - 1) * COL_GAP_INNER;
      cursorX += blockWidth + DEPTH_GAP;
    }

    const laneWidth = cursorX - DEPTH_GAP + LANE_PAD_X;
    lanes.push({ domainId, width: laneWidth, height: laneHeight, rel });
  }

  // Pass 2 — stack every lane in a single vertical column, in domain order
  // (top → bottom). All bands are normalized to the widest lane and share the
  // left edge, so they read as aligned geography and depth-0 lines up across
  // every lane for a clean vertical "same-depth" scan.
  const maxLaneWidth = lanes.reduce((max, lane) => Math.max(max, lane.width), 0);
  let laneTop = 0;
  for (const lane of lanes) {
    for (const [id, p] of lane.rel) {
      positions.set(id, { x: p.x, y: laneTop + p.y });
    }
    domainBounds.set(lane.domainId, {
      x: 0,
      y: laneTop,
      width: maxLaneWidth,
      height: lane.height,
      shape: "rect",
    });
    laneTop += lane.height + LANE_GAP;
  }

  return { positions, domainBounds };
}

export function computeClusterLayout(
  nodes: GraphNode[],
  domains: GraphDomain[],
  degreeByNodeId?: Map<string, number>,
): AtlasLayout {
  const nodesByDomain = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const list = nodesByDomain.get(node.domainId) ?? [];
    list.push(node);
    nodesByDomain.set(node.domainId, list);
  }

  const domainIds = domains
    .map((domain) => domain.id)
    .filter((id) => nodesByDomain.has(id));
  for (const id of nodesByDomain.keys()) {
    if (!domainIds.includes(id)) domainIds.push(id);
  }

  const positions = new Map<string, Position>();
  const domainBounds = new Map<string, DomainBounds>();
  if (domainIds.length === 0) return { positions, domainBounds };

  const domainCount = domainIds.length;
  const domainRing = domainCount === 1 ? 0 : Math.max(720, domainCount * 190);

  domainIds.forEach((domainId, domainIndex) => {
    const members = [...(nodesByDomain.get(domainId) ?? [])].sort((a, b) => {
      if (degreeByNodeId) {
        const diff = (degreeByNodeId.get(b.id) ?? 0) - (degreeByNodeId.get(a.id) ?? 0);
        if (diff !== 0) return diff;
      }
      return compareNodeOrder(a, b);
    });
    const domainAngle = domainCount === 1
      ? 0
      : -Math.PI / 2 + (domainIndex / domainCount) * Math.PI * 2;
    const cx = Math.cos(domainAngle) * domainRing;
    const cy = Math.sin(domainAngle) * domainRing;
    const itemRing = Math.max(132, 88 + Math.sqrt(members.length) * 56);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    members.forEach((node, itemIndex) => {
      const rand = seeded(hashString(`${domainId}:${node.id}`));
      const angle = members.length === 1
        ? 0
        : -Math.PI / 2 + (itemIndex / members.length) * Math.PI * 2;
      const radius = members.length === 1
        ? 0
        : itemRing + (rand() - 0.5) * 24;
      const x = cx + Math.cos(angle) * radius - NODE_WIDTH / 2;
      const y = cy + Math.sin(angle) * radius - NODE_HEIGHT / 2;
      positions.set(node.id, { x, y });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, y + NODE_HEIGHT);
    });

    if (!Number.isFinite(minX)) return;

    const width = maxX - minX;
    const height = maxY - minY;
    const diameter = Math.max(width, height) + 112;
    domainBounds.set(domainId, {
      x: cx - diameter / 2,
      y: cy - diameter / 2,
      width: diameter,
      height: diameter,
      shape: "circle",
    });
  });

  return { positions, domainBounds };
}

function compareNodeOrder(a: GraphNode, b: GraphNode): number {
  const chapter = a.chapter.localeCompare(b.chapter);
  if (chapter !== 0) return chapter;
  const an = numberParts(a.number);
  const bn = numberParts(b.number);
  const length = Math.max(an.length, bn.length);
  for (let i = 0; i < length; i++) {
    const diff = (an[i] ?? 0) - (bn[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.title.localeCompare(b.title);
}

function numberParts(value: string): number[] {
  return value.split(".").map((part) => Number(part) || 0);
}

export const ATLAS_NODE_WIDTH = NODE_WIDTH;
export const ATLAS_NODE_HEIGHT = NODE_HEIGHT;
