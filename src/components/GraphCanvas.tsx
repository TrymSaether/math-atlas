import { useEffect, useMemo, useRef } from "react";
import ReactFlow, { useReactFlow, useViewport, type Edge, type Node } from "reactflow";
import type { LoadedMap } from "../data";
import { ATLAS_NODE_HEIGHT, ATLAS_NODE_WIDTH, computeClusterLayout } from "../lib/atlasLayout";
import { getDomainTone } from "../lib/colors";
import { bfsPath } from "../lib/graph";
import { nodeSearchText } from "../lib/nodeContent";
import { classifyEdge } from "../lib/relationStyle";
import { categoryOf, type NodeCategory } from "../lib/nodeCategory";
import { useStore } from "../store";
import { CanvasControls } from "./CanvasControls";
import { DomainRegionNode } from "./DomainRegionNode";
import { MinimapCard } from "./MinimapCard";
import { RouteToast } from "./RouteToast";
import { TopoEdgeView } from "./TopoEdge";
import { TopoNodeView } from "./TopoNode";

const nodeTypes = { topo: TopoNodeView, domainRegion: DomainRegionNode };
const edgeTypes = { topo: TopoEdgeView };

export type NodeEmphasis = "landmark" | "normal" | "minor";

// Level-of-detail tier, quantized from zoom so nodes only re-render when
// crossing a threshold (not on every continuous zoom delta).
//  - "far"  : title only — meta row + footer hidden; cards read as labels.
//  - "mid"  : title + compact kind badge.
//  - "near" : full card chrome (current detail).
export type NodeLOD = "far" | "mid" | "near";

function lodForZoom(zoom: number): NodeLOD {
  if (zoom < 0.32) return "far";
  if (zoom < 0.62) return "mid";
  return "near";
}

interface NodeData {
  node: import("../types").TopoNode;
  category: NodeCategory;
  emphasis: NodeEmphasis;
  lod: NodeLOD;
  isSelected: boolean;
  isRelated: boolean;
  dim: boolean;
  hasIncoming: boolean;
  hasOutgoing: boolean;
  handleColor: string | undefined;
  /** Traversal pulse delay (ms) when this node lies on the active route. */
  routePulseDelay: number | undefined;
  routeRunKey: number;
  /** Marks the route's chosen start/end so they keep a ring. */
  routeEndpoint: "from" | "to" | undefined;
}

/** Cohesive "route" overlay color — the academic accent, distinct from domains. */
const ROUTE_COLOR = "var(--accent)";

function InnerGraph() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <LoadedGraph map={map} key={mapId} />;
}

function LoadedGraph({ map }: { map: LoadedMap }) {
  const view = useStore((s) => s.view);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const focusMode = useStore((s) => s.focusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const showRegions = useStore((s) => s.showRegions);
  const showMinimap = useStore((s) => s.showMinimap);
  const rf = useReactFlow();

  const { data } = map;
  const { zoom } = useViewport();
  // Hide non-highlighted edges only at extreme zoom-out where they become noise.
  const edgeLODHidden = zoom < 0.18;
  const lod = lodForZoom(zoom);

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((node) => {
      if (!kinds.has(node.kind)) return false;
      if (topics.size && !topics.has(node.domainId)) return false;
      if (search) {
        const haystack =
          searchScope === "title"
            ? `${node.title} ${node.kind}`.toLowerCase()
            : nodeSearchText(node);
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [data.nodes, kinds, topics, search, searchScope]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (edge) =>
          relations.has(edge.relation) &&
          visibleIds.has(edge.from) &&
          visibleIds.has(edge.to) &&
          (showSoftDeps || classifyEdge(edge) === "hard"),
      ),
    [data.edges, relations, visibleIds, showSoftDeps],
  );

  // Importance tiers from computed impact: a handful of load-bearing landmarks,
  // and the leaves nothing depends on. Drives node emphasis (size/weight).
  const emphasisById = useMemo(() => {
    const impact = map.metrics.impactByNodeId;
    const ranked = [...impact.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    const landmarkCount = Math.min(14, Math.ceil(ranked.length * 0.1));
    const landmarks = new Set(ranked.slice(0, landmarkCount).map(([id]) => id));
    const tier = new Map<string, NodeEmphasis>();
    for (const node of data.nodes) {
      const v = impact.get(node.id) ?? 0;
      tier.set(node.id, landmarks.has(node.id) ? "landmark" : v === 0 ? "minor" : "normal");
    }
    return tier;
  }, [map.metrics.impactByNodeId, data.nodes]);

  const activeLayout = useMemo(() => {
    if (view === "cluster") {
      return computeClusterLayout(filteredNodes, data.domains, map.degreeByNodeId);
    }
    return { positions: map.positions, domainBounds: map.domainBounds };
  }, [data.domains, filteredNodes, map.degreeByNodeId, map.domainBounds, map.positions, view]);

  const visibleDomainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of filteredNodes) {
      counts.set(node.domainId, (counts.get(node.domainId) ?? 0) + 1);
    }
    return counts;
  }, [filteredNodes]);

  // Adjacency over the *filtered* edge set. Cheap derived from the cached
  // global adjacency but limited to visible nodes/relations.
  const filteredAdjacency = useMemo(() => {
    const adj = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      const set = adj.get(a) ?? new Set<string>();
      set.add(b);
      adj.set(a, set);
    };
    for (const edge of filteredEdges) {
      link(edge.from, edge.to);
      link(edge.to, edge.from);
    }
    return adj;
  }, [filteredEdges]);

  const immediateRelatedIds = useMemo(() => {
    if (!selectedId || !visibleIds.has(selectedId)) return new Set<string>();
    return new Set(filteredAdjacency.get(selectedId) ?? []);
  }, [selectedId, visibleIds, filteredAdjacency]);

  // Route planner: shortest dependency path between the two chosen concepts,
  // over the *visible* graph so the drawn route is always renderable.
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const routeRunKey = useStore((s) => s.routeRunKey);

  const route = useMemo(() => {
    if (!routeFrom || !routeTo) return null;
    if (!visibleIds.has(routeFrom) || !visibleIds.has(routeTo)) {
      return { path: [] as string[], edgeIds: [] as string[], found: false };
    }
    const path = bfsPath(filteredAdjacency, routeFrom, routeTo);
    if (!path) return { path: [], edgeIds: [], found: false };
    const key = (a: string, b: string) => `${a}\u0000${b}`;
    const edgeByPair = new Map<string, string>();
    for (const edge of filteredEdges) {
      edgeByPair.set(key(edge.from, edge.to), edge.id);
      edgeByPair.set(key(edge.to, edge.from), edge.id);
    }
    const edgeIds: string[] = [];
    for (let i = 0; i < path.length - 1; i += 1) {
      const id = edgeByPair.get(key(path[i], path[i + 1]));
      if (id) edgeIds.push(id);
    }
    return { path, edgeIds, found: true };
  }, [routeFrom, routeTo, visibleIds, filteredAdjacency, filteredEdges]);

  // Per-segment reveal/pulse delays. Total traversal is bounded (~760 ms) so a
  // long path doesn't crawl; a short one keeps a legible stagger.
  const routeViz = useMemo(() => {
    const edgeReveal = new Map<string, number>();
    const nodePulse = new Map<string, number>();
    if (!route?.found || route.edgeIds.length === 0) return { edgeReveal, nodePulse };
    const seg = Math.max(70, Math.min(170, Math.round(760 / route.edgeIds.length)));
    route.edgeIds.forEach((id, i) => edgeReveal.set(id, i * seg));
    route.path.forEach((id, i) => nodePulse.set(id, i * seg));
    return { edgeReveal, nodePulse };
  }, [route]);

  const focusSet = useMemo(() => {
    if (!focusMode || !selectedId || !visibleIds.has(selectedId)) return null;
    const seen = new Set<string>([selectedId]);
    let frontier = [selectedId];
    for (let depth = 0; depth < focusDepth; depth += 1) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const neighbor of filteredAdjacency.get(id) ?? []) {
          if (seen.has(neighbor)) continue;
          seen.add(neighbor);
          next.push(neighbor);
        }
      }
      frontier = next;
    }
    return seen;
  }, [focusMode, selectedId, visibleIds, filteredAdjacency, focusDepth]);

  const contextIds = focusSet ?? immediateRelatedIds;

  const highlightedEdgeIds = useMemo(() => {
    if (!selectedId || !visibleIds.has(selectedId)) return new Set<string>();
    return new Set(
      filteredEdges
        .filter((edge) => edge.from === selectedId || edge.to === selectedId)
        .map((edge) => edge.id),
    );
  }, [selectedId, visibleIds, filteredEdges]);

  const nodeHandleState = useMemo(() => {
    const incoming = new Set<string>();
    const outgoing = new Set<string>();
    for (const edge of filteredEdges) {
      outgoing.add(edge.from);
      incoming.add(edge.to);
    }
    return { incoming, outgoing };
  }, [filteredEdges]);

  const regionNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    if (!showRegions) return nodes;
    for (const [domainId, bounds] of activeLayout.domainBounds) {
      const count = visibleDomainCounts.get(domainId) ?? 0;
      if (count === 0) continue;
      const tone = getDomainTone(domainId);
      const domain = map.domainById.get(domainId);
      nodes.push({
        id: `domain-region::${domainId}`,
        type: "domainRegion",
        position: { x: bounds.x, y: bounds.y },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -10,
        data: {
          domainId,
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
    return nodes;
  }, [activeLayout.domainBounds, visibleDomainCounts, map.domainById, showRegions]);

  // Stable per-node data refs: only allocate a new data object when something
  // material changed for that specific node. Keeps React Flow's per-node memo
  // intact so selection changes don't re-render every node.
  const dataCacheRef = useRef(new Map<string, NodeData>());
  const conceptNodes: Node[] = useMemo(() => {
    const prevCache = dataCacheRef.current;
    const nextCache = new Map<string, NodeData>();
    const selectionActive = selectedId !== null && visibleIds.has(selectedId);

    const result = filteredNodes.map((node) => {
      const position = activeLayout.positions.get(node.id) ?? { x: 0, y: 0 };
      const isSelected = node.id === selectedId;
      const isRelated = !isSelected && contextIds.has(node.id);
      const dim = selectionActive && !isSelected && !contextIds.has(node.id);
      const hasIncoming = nodeHandleState.incoming.has(node.id);
      const hasOutgoing = nodeHandleState.outgoing.has(node.id);
      const category = categoryOf(node.kind);
      const emphasis = emphasisById.get(node.id) ?? "normal";
      const handleColor = getDomainTone(node.domainId).color;
      const routePulseDelay = routeViz.nodePulse.get(node.id);
      const routeEndpoint =
        node.id === routeFrom ? "from" : node.id === routeTo ? "to" : undefined;

      const prev = prevCache.get(node.id);
      const reuse =
        prev &&
        prev.node === node &&
        prev.isSelected === isSelected &&
        prev.isRelated === isRelated &&
        prev.dim === dim &&
        prev.hasIncoming === hasIncoming &&
        prev.hasOutgoing === hasOutgoing &&
        prev.category === category &&
        prev.emphasis === emphasis &&
        prev.lod === lod &&
        prev.handleColor === handleColor &&
        prev.routePulseDelay === routePulseDelay &&
        prev.routeRunKey === routeRunKey &&
        prev.routeEndpoint === routeEndpoint;

      const data: NodeData = reuse
        ? prev!
        : {
            node,
            category,
            emphasis,
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
      nextCache.set(node.id, data);

      return {
        id: node.id,
        type: "topo",
        position,
        draggable: false,
        data,
      };
    });

    dataCacheRef.current = nextCache;
    return result;
  }, [filteredNodes, activeLayout.positions, selectedId, contextIds, visibleIds, nodeHandleState, emphasisById, lod, routeViz, routeFrom, routeTo, routeRunKey]);

  const nodes = useMemo(() => [...regionNodes, ...conceptNodes], [regionNodes, conceptNodes]);

  const edges: Edge[] = useMemo(() => {
    const out: Edge[] = [];
    const reduced = map.metrics.reducedEdgeIds;
    for (const edge of filteredEdges) {
      const highlight = highlightedEdgeIds.has(edge.id);
      const inFocus = !focusSet || (focusSet.has(edge.from) && focusSet.has(edge.to));
      const focused = Boolean(focusSet && inFocus);
      const routeDelay = routeViz.edgeReveal.get(edge.id);
      const onRoute = routeDelay !== undefined;
      // Swimlane view: for the hard backbone, draw only the transitive reduction
      // at rest — implied edges are dropped. Soft edges (shown only when toggled
      // on) are a supplementary overlay and skip reduction. Highlighted/focused/
      // route edges always stay so cones and the traced path read complete.
      const isHard = classifyEdge(edge) === "hard";
      if (view === "dependency" && isHard && !reduced.has(edge.id) && !highlight && !focused && !onRoute) continue;
      const dim = !onRoute && selectedId !== null && visibleIds.has(selectedId) && (focusSet ? !inFocus : !highlight);
      // Low zoom: only keep edges incident to the selection (or whole focus set).
      if (edgeLODHidden && !highlight && !focused && !onRoute) continue;
      out.push({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        type: "topo",
        data: {
          edge,
          highlight,
          dim,
          routeReveal: onRoute ? { delay: routeDelay, runKey: routeRunKey, color: ROUTE_COLOR } : undefined,
        },
      });
    }
    return out;
  }, [filteredEdges, highlightedEdgeIds, focusSet, selectedId, visibleIds, edgeLODHidden, view, map.metrics.reducedEdgeIds, routeViz, routeRunKey]);

  // Default view shows the entire map. The swimlane layout is built to be
  // compact (bands hug their content) so fit-all reads as a legible overview
  // rather than a sliver lost in dead space.
  useEffect(() => {
    const timeout = window.setTimeout(
      () => rf.fitView({ padding: 0.12, duration: view === "cluster" ? 520 : 0 }),
      40,
    );
    return () => window.clearTimeout(timeout);
  }, [rf, map.data.id, view]);

  useEffect(() => {
    if (!selectedId) return;
    const position = activeLayout.positions.get(selectedId);
    if (!position) return;
    rf.setCenter(
      position.x + ATLAS_NODE_WIDTH / 2,
      position.y + ATLAS_NODE_HEIGHT / 2,
      { zoom: Math.max(0.9, rf.getZoom()), duration: 450 },
    );
  }, [selectedId, activeLayout.positions, rf]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={() => useStore.getState().select(null)}
        proOptions={{ hideAttribution: true }}
        minZoom={0.08}
        maxZoom={2.4}
        fitView
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        defaultEdgeOptions={{ type: "topo" }}
      />
      {showMinimap && (
        <MinimapCard nodes={conceptNodes} regions={activeLayout.domainBounds} selectedId={selectedId} />
      )}
      <CanvasControls />
      <RouteToast
        fromTitle={routeFrom ? map.nodeById.get(routeFrom)?.title : undefined}
        toTitle={routeTo ? map.nodeById.get(routeTo)?.title : undefined}
        count={route?.found ? route.path.length : 0}
        found={route ? route.found : null}
      />
    </>
  );
}

export function GraphCanvas() {
  return <InnerGraph />;
}
