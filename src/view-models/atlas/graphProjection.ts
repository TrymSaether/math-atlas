import type { Edge, Node } from "@xyflow/react";
import type { LoadedMap, MapId } from "../../data";
import {
  ATLAS_NODE_HEIGHT,
  ATLAS_NODE_WIDTH,
  computeClusterLayout,
  type AtlasLayout,
  type Position,
} from "../../lib/atlasLayout";
import type { DomainTone } from "../../lib/colors";
import { nodeSearchText } from "../../lib/nodeContent";
import { categoryOf, type NodeCategory } from "../../lib/nodeCategory";
import { classifyEdge } from "../../lib/relationStyle";
import type { RouteResult } from "../../lib/route";
import type { TopoNode } from "../../types";

type HandleSide = "left" | "right" | "top" | "bottom";

export type NodeEmphasis = "landmark" | "normal" | "minor";

// Quantized so node data changes only when the viewport crosses a detail tier.
export type NodeLOD = "far" | "mid" | "near";

export interface GraphNodeViewData {
  node: TopoNode;
  category: NodeCategory;
  emphasis: NodeEmphasis;
  lod: NodeLOD;
  isSelected: boolean;
  isRelated: boolean;
  dim: boolean;
  hasIncoming: boolean;
  hasOutgoing: boolean;
  handleColor: string | undefined;
  routePulseDelay: number | undefined;
  routeRunKey: number;
  routeEndpoint: "from" | "to" | undefined;
  [key: string]: unknown;
}

export interface GraphEdgeViewData {
  edge: LoadedMap["data"]["edges"][number];
  highlight: boolean;
  dim: boolean;
  routeReveal: { delay: number; runKey: number; color: string } | undefined;
  [key: string]: unknown;
}

export interface GraphProjectionInput {
  map: LoadedMap;
  mapId: MapId;
  view: "dependency" | "cluster";
  search: string;
  searchScope: "all" | "title";
  kinds: ReadonlySet<string>;
  topics: ReadonlySet<string>;
  relations: ReadonlySet<string>;
  selectedId: string | null;
  focusMode: boolean;
  focusDepth: number;
  showSoftDeps: boolean;
  showRegions: boolean;
  routeFrom: string | null;
  routeTo: string | null;
  routeRunKey: number;
  route: RouteResult;
  zoom: number;
  domainToneFor: (domainId: string) => Pick<DomainTone, "color" | "tint" | "border">;
  previousNodeData?: ReadonlyMap<string, GraphNodeViewData>;
}

export interface GraphProjection {
  nodes: Node[];
  conceptNodes: Node<GraphNodeViewData>[];
  edges: Edge<GraphEdgeViewData>[];
  activeLayout: AtlasLayout;
  nodeDataCache: Map<string, GraphNodeViewData>;
  visibleIds: Set<string>;
  focusIds: Set<string> | null;
}

/** Cohesive route overlay color, distinct from domain colors. */
const ROUTE_COLOR = "var(--accent)";

export function lodForZoom(zoom: number): NodeLOD {
  if (zoom < 0.32) return "far";
  if (zoom < 0.62) return "mid";
  return "near";
}

export function edgeHandlePair(
  from: string,
  to: string,
  positions: ReadonlyMap<string, Position>,
): { sourceHandle: string; targetHandle: string } | null {
  const source = positions.get(from);
  const target = positions.get(to);
  if (!source || !target) return null;

  const sourceCenter = {
    x: source.x + ATLAS_NODE_WIDTH / 2,
    y: source.y + ATLAS_NODE_HEIGHT / 2,
  };
  const targetCenter = {
    x: target.x + ATLAS_NODE_WIDTH / 2,
    y: target.y + ATLAS_NODE_HEIGHT / 2,
  };
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  let sourceSide: HandleSide;
  let targetSide: HandleSide;
  if (Math.abs(dx) >= Math.abs(dy)) {
    sourceSide = dx >= 0 ? "right" : "left";
    targetSide = dx >= 0 ? "left" : "right";
  } else {
    sourceSide = dy >= 0 ? "bottom" : "top";
    targetSide = dy >= 0 ? "top" : "bottom";
  }

  return {
    sourceHandle: `source-${sourceSide}`,
    targetHandle: `target-${targetSide}`,
  };
}

function emphasisByNodeId(map: LoadedMap): Map<string, NodeEmphasis> {
  const impact = map.metrics.impactByNodeId;
  const ranked = [...impact.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const landmarkCount = Math.min(14, Math.ceil(ranked.length * 0.1));
  const landmarks = new Set(ranked.slice(0, landmarkCount).map(([id]) => id));
  const tiers = new Map<string, NodeEmphasis>();

  for (const node of map.data.nodes) {
    const value = impact.get(node.id) ?? 0;
    let emphasis: NodeEmphasis = landmarks.has(node.id) ? "landmark" : value === 0 ? "minor" : "normal";
    if (node.priority === "core" && emphasis === "minor") emphasis = "normal";
    else if (node.priority === "peripheral" && emphasis === "normal") emphasis = "minor";
    tiers.set(node.id, emphasis);
  }

  return tiers;
}

function filteredAdjacency(edges: LoadedMap["data"]["edges"]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (from: string, to: string) => {
    const neighbors = adjacency.get(from) ?? new Set<string>();
    neighbors.add(to);
    adjacency.set(from, neighbors);
  };

  for (const edge of edges) {
    link(edge.from, edge.to);
    link(edge.to, edge.from);
  }
  return adjacency;
}

function focusNeighborhood(
  adjacency: ReadonlyMap<string, ReadonlySet<string>>,
  selectedId: string,
  depthLimit: number,
): Set<string> {
  const seen = new Set<string>([selectedId]);
  let frontier = [selectedId];
  for (let depth = 0; depth < depthLimit; depth += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  return seen;
}

/**
 * Project the loaded atlas and current UI state into React Flow nodes and edges.
 * The function has no React or store dependency; every output is derived from
 * explicit inputs so filtering, focus, routing, reduction, handles and LOD can
 * be characterized without mounting the canvas.
 */
export function buildGraphProjection(input: GraphProjectionInput): GraphProjection {
  const {
    map,
    mapId,
    view,
    search,
    searchScope,
    kinds,
    topics,
    relations,
    selectedId,
    focusMode,
    focusDepth,
    showSoftDeps,
    showRegions,
    routeFrom,
    routeTo,
    routeRunKey,
    route,
    zoom,
    domainToneFor,
  } = input;
  const { data } = map;
  const normalizedSearch = search.toLowerCase().trim();
  const edgeLODHidden = zoom < 0.18;
  const lod = lodForZoom(zoom);

  const filteredNodes = data.nodes.filter((node) => {
    if (route.nodeIds.has(node.id)) return true;
    if (!kinds.has(node.kind)) return false;
    if (topics.size && !topics.has(node.domain)) return false;
    if (normalizedSearch) {
      const haystack = searchScope === "title" ? `${node.label} ${node.kind}`.toLowerCase() : nodeSearchText(node);
      if (!haystack.includes(normalizedSearch)) return false;
    }
    return true;
  });
  const visibleIds = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges = data.edges.filter(
    (edge) =>
      (route.edgeIds.has(edge.id) ||
        (relations.has(edge.relation) && (showSoftDeps || classifyEdge(edge) === "hard"))) &&
      visibleIds.has(edge.from) &&
      visibleIds.has(edge.to),
  );

  const activeLayout =
    view === "cluster"
      ? computeClusterLayout(filteredNodes, data.domains, map.degreeByNodeId)
      : { positions: map.positions, domainBounds: map.domainBounds };

  const domainCounts = new Map<string, number>();
  for (const node of filteredNodes) {
    domainCounts.set(node.domain, (domainCounts.get(node.domain) ?? 0) + 1);
  }

  const adjacency = filteredAdjacency(filteredEdges);
  const immediateRelatedIds =
    selectedId && visibleIds.has(selectedId) ? new Set(adjacency.get(selectedId) ?? []) : new Set<string>();
  const focusIds =
    focusMode && selectedId && visibleIds.has(selectedId) ? focusNeighborhood(adjacency, selectedId, focusDepth) : null;
  const contextIds = focusIds ?? immediateRelatedIds;

  const highlightedEdgeIds =
    selectedId && visibleIds.has(selectedId)
      ? new Set(
          filteredEdges.filter((edge) => edge.from === selectedId || edge.to === selectedId).map((edge) => edge.id),
        )
      : new Set<string>();

  const incoming = new Set<string>();
  const outgoing = new Set<string>();
  for (const edge of filteredEdges) {
    outgoing.add(edge.from);
    incoming.add(edge.to);
  }

  const edgeReveal = new Map<string, number>();
  const nodePulse = new Map<string, number>();
  if (route.found && route.ordered.length > 0) {
    const segmentDuration = Math.max(40, Math.min(130, Math.round(900 / route.ordered.length)));
    const orderIndex = new Map<string, number>();
    route.ordered.forEach((id, index) => {
      orderIndex.set(id, index);
      nodePulse.set(id, index * segmentDuration);
    });
    for (const edge of filteredEdges) {
      if (!route.edgeIds.has(edge.id)) continue;
      const index = orderIndex.get(edge.to) ?? orderIndex.get(edge.from) ?? 0;
      edgeReveal.set(edge.id, index * segmentDuration);
    }
  }

  const regionNodes: Node[] = [];
  if (showRegions) {
    for (const [domainId, bounds] of activeLayout.domainBounds) {
      const count = domainCounts.get(domainId) ?? 0;
      if (count === 0) continue;
      const tone = domainToneFor(domainId);
      const domain = map.domainById.get(domainId);
      regionNodes.push({
        id: `domain-region::${domainId}`,
        type: "domainRegion",
        position: { x: bounds.x, y: bounds.y },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -10,
        data: {
          domainId,
          mapId,
          label: domain?.label ?? domainId,
          count,
          width: bounds.width,
          height: bounds.height,
          color: tone.color,
          tint: tone.tint,
          border: tone.border,
          shape: bounds.shape ?? "rect",
        },
        style: {
          width: bounds.width,
          height: bounds.height,
          pointerEvents: "none",
        },
      });
    }
  }

  const emphasis = emphasisByNodeId(map);
  const previousNodeData = input.previousNodeData ?? new Map<string, GraphNodeViewData>();
  const nodeDataCache = new Map<string, GraphNodeViewData>();
  const selectionActive = selectedId !== null && visibleIds.has(selectedId);
  const conceptNodes: Node<GraphNodeViewData>[] = filteredNodes.map((node) => {
    const position = activeLayout.positions.get(node.id) ?? { x: 0, y: 0 };
    const isSelected = node.id === selectedId;
    const isRelated = !isSelected && contextIds.has(node.id);
    const dim = selectionActive && !isSelected && !contextIds.has(node.id);
    const hasIncoming = incoming.has(node.id);
    const hasOutgoing = outgoing.has(node.id);
    const category = categoryOf(node.kind);
    const nodeEmphasis = emphasis.get(node.id) ?? "normal";
    const handleColor = domainToneFor(node.domain).color;
    const routePulseDelay = nodePulse.get(node.id);
    const routeEndpoint = node.id === routeFrom ? "from" : node.id === routeTo ? "to" : undefined;
    const previous = previousNodeData.get(node.id);
    const reuse =
      previous &&
      previous.node === node &&
      previous.isSelected === isSelected &&
      previous.isRelated === isRelated &&
      previous.dim === dim &&
      previous.hasIncoming === hasIncoming &&
      previous.hasOutgoing === hasOutgoing &&
      previous.category === category &&
      previous.emphasis === nodeEmphasis &&
      previous.lod === lod &&
      previous.handleColor === handleColor &&
      previous.routePulseDelay === routePulseDelay &&
      previous.routeRunKey === routeRunKey &&
      previous.routeEndpoint === routeEndpoint;

    const nodeData: GraphNodeViewData = reuse
      ? previous
      : {
          node,
          category,
          emphasis: nodeEmphasis,
          lod,
          isSelected,
          isRelated,
          dim,
          hasIncoming,
          hasOutgoing,
          handleColor,
          routePulseDelay,
          routeRunKey,
          routeEndpoint,
        };
    nodeDataCache.set(node.id, nodeData);

    return {
      id: node.id,
      type: "topo",
      className: "atlas-flow-node",
      position,
      draggable: false,
      data: nodeData,
    };
  });

  const edges: Edge<GraphEdgeViewData>[] = [];
  for (const edge of filteredEdges) {
    const highlight = highlightedEdgeIds.has(edge.id);
    const inFocus = !focusIds || (focusIds.has(edge.from) && focusIds.has(edge.to));
    const focused = Boolean(focusIds && inFocus);
    const routeDelay = edgeReveal.get(edge.id);
    const onRoute = routeDelay !== undefined;
    const isHard = classifyEdge(edge) === "hard";
    if (
      view === "dependency" &&
      isHard &&
      !map.metrics.reducedEdgeIds.has(edge.id) &&
      !highlight &&
      !focused &&
      !onRoute
    ) {
      continue;
    }
    const dim = !onRoute && selectedId !== null && visibleIds.has(selectedId) && (focusIds ? !inFocus : !highlight);
    if (edgeLODHidden && !highlight && !focused && !onRoute) continue;
    const handles = edgeHandlePair(edge.from, edge.to, activeLayout.positions);
    edges.push({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      sourceHandle: handles?.sourceHandle,
      targetHandle: handles?.targetHandle,
      type: "topo",
      data: {
        edge,
        highlight,
        dim,
        routeReveal: onRoute ? { delay: routeDelay, runKey: routeRunKey, color: ROUTE_COLOR } : undefined,
      },
    });
  }

  return {
    nodes: [...regionNodes, ...conceptNodes],
    conceptNodes,
    edges,
    activeLayout,
    nodeDataCache,
    visibleIds,
    focusIds,
  };
}
