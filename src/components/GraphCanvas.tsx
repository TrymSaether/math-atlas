import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import type { LoadedMap } from "../data";
import { useStore } from "../store";
import { ancestors, buildAdjacency, descendants } from "../lib/graph";
import { clusterLayout, dependencyLayout, overviewLayout } from "../lib/layout";
import { findRoute } from "../lib/route";
import { getRelationStyle } from "../lib/relationStyle";
import { useSemanticDetail } from "../hooks/useSemanticZoom";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { DomainRegionNode } from "./DomainRegionNode";
import { ClusterBubbleNode } from "./ClusterBubbleNode";
import { ClusterEdge } from "./ClusterEdge";
import { MinimapCard } from "./MinimapCard";
import { Dock } from "./Dock";
import type { RouteRole } from "./GraphNodeCard";

const nodeTypes = {
  topo: TopoNodeView,
  domainRegion: DomainRegionNode,
  clusterBubble: ClusterBubbleNode,
};
const edgeTypes = { topo: TopoEdgeView, cluster: ClusterEdge };

function InnerGraph() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <LoadedGraph map={map} key={mapId} />;
}

function LoadedGraph({ map }: { map: LoadedMap }) {
  const layoutMode = useStore((s) => s.layoutMode);
  const focusDomainId = useStore((s) => s.focusDomainId);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const highlight = useStore((s) => s.highlight);
  const showOrphans = useStore((s) => s.showOrphans);
  const hiddenTopics = useStore((s) => s.hiddenTopics);
  const focusMode = useStore((s) => s.focusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const routePlanned = useStore((s) => s.routePlanned);
  const routeNonce = useStore((s) => s.routeNonce);
  const rf = useReactFlow();
  const detail = useSemanticDetail();
  const isOverview = layoutMode === "overview";
  const { data } = map;

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((node) => {
      if (focusDomainId && !isOverview && node.domainId !== focusDomainId) return false;
      if (kinds.size > 0 && !kinds.has(node.kind)) return false;
      if (topics.size && !topics.has(node.domainId)) return false;
      if (hiddenTopics.has(node.domainId)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${node.title} ${node.number} ${node.kind}`.toLowerCase()
            : `${node.title} ${node.number} ${node.kind} ${node.topicCluster} ${node.tags.join(" ")} ${node.formalStatement} ${node.originalText} ${node.explanation}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [data.nodes, focusDomainId, hiddenTopics, isOverview, kinds, search, searchScope, topics]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (edge) =>
          (relations.size === 0 || relations.has(edge.relation)) &&
          visibleIds.has(edge.from) &&
          visibleIds.has(edge.to),
      ),
    [data.edges, relations, visibleIds],
  );

  const { rawNodes, rawEdges, regions } = useMemo(() => {
    if (layoutMode === "overview") {
      const layout = overviewLayout({ nodes: data.nodes, edges: data.edges, domains: data.domains });
      return { rawNodes: layout.nodes, rawEdges: layout.edges, regions: layout.regions };
    }
    if (layoutMode === "dependency") {
      const layout = dependencyLayout({
        nodes: filteredNodes,
        edges: filteredEdges,
        domains: data.domains,
        showOrphans: showOrphans || Boolean(focusDomainId),
      });
      return { rawNodes: layout.nodes, rawEdges: layout.edges, regions: layout.regions };
    }
    const layout = clusterLayout({ nodes: filteredNodes, edges: filteredEdges, domains: data.domains });
    return { rawNodes: layout.nodes, rawEdges: layout.edges, regions: layout.regions };
  }, [data.domains, data.edges, data.nodes, filteredEdges, filteredNodes, layoutMode, showOrphans]);

  const adj = useMemo(() => buildAdjacency(filteredEdges, relations), [filteredEdges, relations]);

  const undirected = useMemo(() => {
    const graph = new Map<string, Set<string>>();
    for (const edge of filteredEdges) {
      (graph.get(edge.from) ?? graph.set(edge.from, new Set()).get(edge.from)!).add(edge.to);
      (graph.get(edge.to) ?? graph.set(edge.to, new Set()).get(edge.to)!).add(edge.from);
    }
    return graph;
  }, [filteredEdges]);

  const focusSet = useMemo(() => {
    if (!focusMode || !selectedId || !visibleIds.has(selectedId)) return null;
    const seen = new Set([selectedId]);
    let frontier = [selectedId];
    for (let i = 0; i < focusDepth; i++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const neighbor of undirected.get(id) ?? []) {
          if (seen.has(neighbor)) continue;
          seen.add(neighbor);
          next.push(neighbor);
        }
      }
      frontier = next;
    }
    return seen;
  }, [focusDepth, focusMode, selectedId, undirected, visibleIds]);

  const routePath = useMemo(
    () => (routePlanned ? findRoute(routeFrom, routeTo, filteredEdges) : null),
    [filteredEdges, routeFrom, routePlanned, routeTo],
  );
  const routeSet = useMemo(() => new Set(routePath ?? []), [routePath]);
  const routeEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!routePath) return keys;
    for (let i = 0; i < routePath.length - 1; i++) {
      keys.add(`${routePath[i]}|${routePath[i + 1]}`);
      keys.add(`${routePath[i + 1]}|${routePath[i]}`);
    }
    return keys;
  }, [routePath]);

  const { ancSet, descSet, edgeHi } = useMemo(() => {
    if (!selectedId || !visibleIds.has(selectedId)) {
      return { ancSet: new Set<string>(), descSet: new Set<string>(), edgeHi: new Set<string>() };
    }
    const a =
      highlight === "immediate"
        ? new Set((adj.in.get(selectedId) ?? []).map((entry) => entry.id))
        : ancestors(adj, selectedId);
    const d =
      highlight === "immediate"
        ? new Set((adj.out.get(selectedId) ?? []).map((entry) => entry.id))
        : descendants(adj, selectedId);
    const highlightedEdges = new Set<string>();
    for (const edge of filteredEdges) {
      const involves = edge.from === selectedId || edge.to === selectedId;
      if (involves) highlightedEdges.add(edge.id);
      if (highlight === "full") {
        if ((a.has(edge.from) || edge.from === selectedId) && (a.has(edge.to) || edge.to === selectedId)) {
          highlightedEdges.add(edge.id);
        }
        if ((d.has(edge.from) || edge.from === selectedId) && (d.has(edge.to) || edge.to === selectedId)) {
          highlightedEdges.add(edge.id);
        }
      }
    }
    return { ancSet: a, descSet: d, edgeHi: highlightedEdges };
  }, [adj, filteredEdges, highlight, selectedId, visibleIds]);

  const regionNodes: Node[] = useMemo(
    () =>
      regions.map((region) => ({
        id: `domain-region-${region.id}`,
        type: "domainRegion",
        position: { x: region.x, y: region.y },
        data: region,
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -10,
        style: { zIndex: -10 },
      })),
    [regions],
  );

  const nodeHandleState = useMemo(() => {
    const incoming = new Map<string, string>();
    const outgoing = new Map<string, string>();
    for (const edge of filteredEdges) {
      const color = getRelationStyle(edge.relation).color;
      if (!outgoing.has(edge.from)) outgoing.set(edge.from, color);
      if (!incoming.has(edge.to)) incoming.set(edge.to, color);
    }
    return { incoming, outgoing };
  }, [filteredEdges]);

  const nodes: Node[] = useMemo(() => {
    if (isOverview) return rawNodes;
    return rawNodes.map((node) => {
      const isSel = node.id === selectedId;
      const isAnc = ancSet.has(node.id);
      const isDesc = descSet.has(node.id);
      const onRoute = routeSet.has(node.id);
      const anyHi = selectedId !== null && visibleIds.has(selectedId);
      let dim = anyHi && !isSel && !isAnc && !isDesc;
      if (focusSet && !focusSet.has(node.id) && !onRoute) dim = true;
      const routeRole: RouteRole =
        node.id === routeFrom && onRoute ? "from" : node.id === routeTo && onRoute ? "to" : onRoute ? "waypoint" : null;
      return {
        ...node,
        selected: isSel,
        data: {
          ...node.data,
          detail,
          dim,
          highlight: isSel ? "primary" : isAnc ? "anc" : isDesc ? "desc" : null,
          routeRole,
          routeNonce,
          hasIncoming: nodeHandleState.incoming.has(node.id),
          hasOutgoing: nodeHandleState.outgoing.has(node.id),
          incomingHandleColor: nodeHandleState.incoming.get(node.id),
          outgoingHandleColor: nodeHandleState.outgoing.get(node.id),
        },
      };
    });
  }, [
    ancSet,
    descSet,
    detail,
    focusSet,
    isOverview,
    nodeHandleState,
    rawNodes,
    routeFrom,
    routeNonce,
    routeSet,
    routeTo,
    selectedId,
    visibleIds,
  ]);

  const edges: Edge[] = useMemo(() => {
    if (isOverview) return rawEdges;
    return rawEdges.map((edge) => {
      const highlighted = edgeHi.has(edge.id);
      const isRoute = routeEdgeKeys.has(`${edge.source}|${edge.target}`);
      const anyHi = selectedId !== null && visibleIds.has(selectedId);
      let dim = anyHi && !highlighted;
      if (focusSet && !isRoute) {
        const inFocus = focusSet.has(edge.source) && focusSet.has(edge.target);
        if (!inFocus) dim = true;
      }
      return {
        ...edge,
        zIndex: isRoute ? 10 : undefined,
        data: { ...edge.data, detail, dim: dim && !isRoute, highlight: highlighted && !isRoute, route: isRoute, routeNonce },
      };
    });
  }, [detail, edgeHi, focusSet, isOverview, rawEdges, routeEdgeKeys, routeNonce, selectedId, visibleIds]);

  useEffect(() => {
    const timer = setTimeout(() => rf.fitView({ padding: 0.18, duration: 500 }), 70);
    return () => clearTimeout(timer);
  }, [focusDomainId, layoutMode, map.data.id, rf]);

  useEffect(() => {
    if (isOverview || !selectedId) return;
    const node = rawNodes.find((entry) => entry.id === selectedId);
    if (!node) return;
    rf.setCenter(node.position.x + 110, node.position.y + 50, { zoom: Math.max(0.9, rf.getZoom()), duration: 420 });
  }, [isOverview, rawNodes, rf, selectedId]);

  useEffect(() => {
    if (routeNonce === 0 || !routePath || routePath.length === 0) return;
    const ids = new Set(routePath);
    const routeNodes = rawNodes.filter((node) => ids.has(node.id));
    if (routeNodes.length === 0) return;
    const timer = setTimeout(
      () => rf.fitView({ padding: 0.3, duration: 550, nodes: routeNodes.map((node) => ({ id: node.id })) }),
      60,
    );
    return () => clearTimeout(timer);
  }, [rawNodes, rf, routeNonce, routePath]);

  return (
    <>
      <ReactFlow
        nodes={[...regionNodes, ...nodes]}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={() => useStore.getState().select(null)}
        onNodeClick={(_, node) => {
          if (node.type === "clusterBubble") {
            const domainId = (node.data as { domainId?: string }).domainId;
            if (domainId) useStore.getState().expandCluster(domainId);
            return;
          }
          if (node.type === "topo") useStore.getState().select(node.id);
        }}
        onNodeContextMenu={(event, node) => {
          if (node.type === "domainRegion" || node.type === "clusterBubble") return;
          event.preventDefault();
          useStore.getState().setRouteTo(node.id);
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.06}
        maxZoom={2.4}
        fitView
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        defaultEdgeOptions={{ type: "topo" }}
      >
        <RFBackground variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--grid-dot)" />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      {!isOverview && <MinimapCard nodes={nodes} regions={regions} routeSet={routeSet} selectedId={selectedId} />}
      <Dock />
    </>
  );
}

export function GraphCanvas() {
  return <InnerGraph />;
}
