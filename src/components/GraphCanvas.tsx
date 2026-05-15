import { useMemo, useEffect } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from "reactflow";
import { useStore } from "../store";
import { dependencyLayout, clusterLayout } from "../lib/layout";
import { buildAdjacency, ancestors, descendants } from "../lib/graph";
import { findRoute } from "../lib/route";
import { canvas } from "../lib/colors";
import { getRelationStyle } from "../lib/relationStyle";
import type { GraphData } from "../types";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { DomainRegionNode } from "./DomainRegionNode";
import { Dock } from "./Dock";
import { MinimapCard } from "./MinimapCard";
import type { RouteRole } from "./GraphNodeCard";

const nodeTypes = { topo: TopoNodeView, domainRegion: DomainRegionNode };
const edgeTypes = { topo: TopoEdgeView };

function InnerGraph({ data }: { data: GraphData }) {
  const view = useStore((s) => s.view);
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
  const learningStates = useStore((s) => s.learningStates);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const routePlanned = useStore((s) => s.routePlanned);
  const routeNonce = useStore((s) => s.routeNonce);
  const rf = useReactFlow();

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (kinds.size > 0 && !kinds.has(n.kind)) return false;
      if (topics.size && !topics.has(n.domainId)) return false;
      if (hiddenTopics.has(n.domainId)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.topicCluster} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [kinds, topics, hiddenTopics, search, searchScope]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (e) => (relations.size === 0 || relations.has(e.relation)) && visibleIds.has(e.from) && visibleIds.has(e.to)
      ),
    [relations, visibleIds]
  );

  const { rawNodes, rawEdges, regions } = useMemo(() => {
    if (view === "dependency") {
      const r = dependencyLayout({ nodes: filteredNodes, edges: filteredEdges, domains: data.domains, showOrphans });
      return { rawNodes: r.nodes, rawEdges: r.edges, regions: r.regions };
    }
    const r = clusterLayout({ nodes: filteredNodes, edges: filteredEdges, domains: data.domains });
    return { rawNodes: r.nodes, rawEdges: r.edges, regions: r.regions };
  }, [view, filteredNodes, filteredEdges, data.domains, showOrphans]);

  const adj = useMemo(() => buildAdjacency(filteredEdges, relations), [filteredEdges, relations]);

  // Undirected adjacency for focus neighborhood + route.
  const undirected = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of filteredEdges) {
      (m.get(e.from) ?? m.set(e.from, new Set()).get(e.from)!).add(e.to);
      (m.get(e.to) ?? m.set(e.to, new Set()).get(e.to)!).add(e.from);
    }
    return m;
  }, [filteredEdges]);

  // Focus mode — nodes within `focusDepth` hops of the selection.
  const focusSet = useMemo(() => {
    if (!focusMode || !selectedId || !visibleIds.has(selectedId)) return null;
    const seen = new Set([selectedId]);
    let frontier = [selectedId];
    for (let i = 0; i < focusDepth; i++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const nb of undirected.get(id) ?? []) {
          if (!seen.has(nb)) {
            seen.add(nb);
            next.push(nb);
          }
        }
      }
      frontier = next;
    }
    return seen;
  }, [focusMode, selectedId, focusDepth, undirected, visibleIds]);

  // Route — shortest path between the planner's endpoints.
  const routePath = useMemo(
    () => (routePlanned ? findRoute(routeFrom, routeTo, filteredEdges) : null),
    [routePlanned, routeFrom, routeTo, filteredEdges]
  );
  const routeSet = useMemo(() => new Set(routePath ?? []), [routePath]);
  const routeEdgeKeys = useMemo(() => {
    const s = new Set<string>();
    if (!routePath) return s;
    for (let i = 0; i < routePath.length - 1; i++) {
      s.add(`${routePath[i]}|${routePath[i + 1]}`);
      s.add(`${routePath[i + 1]}|${routePath[i]}`);
    }
    return s;
  }, [routePath]);

  const { ancSet, descSet, edgeHi } = useMemo(() => {
    if (!selectedId || !visibleIds.has(selectedId)) {
      return { ancSet: new Set<string>(), descSet: new Set<string>(), edgeHi: new Set<string>() };
    }
    let a: Set<string>, d: Set<string>;
    if (highlight === "immediate") {
      a = new Set((adj.in.get(selectedId) ?? []).map((x) => x.id));
      d = new Set((adj.out.get(selectedId) ?? []).map((x) => x.id));
    } else {
      a = ancestors(adj, selectedId);
      d = descendants(adj, selectedId);
    }
    const eHi = new Set<string>();
    for (const e of filteredEdges) {
      const involves = e.from === selectedId || e.to === selectedId;
      if (involves) eHi.add(e.id);
      if (highlight === "full") {
        if ((a.has(e.from) || e.from === selectedId) && (a.has(e.to) || e.to === selectedId)) eHi.add(e.id);
        if ((d.has(e.from) || e.from === selectedId) && (d.has(e.to) || e.to === selectedId)) eHi.add(e.id);
      }
    }
    return { ancSet: a, descSet: d, edgeHi: eHi };
  }, [selectedId, adj, filteredEdges, highlight, visibleIds]);

  const regionNodes: Node[] = useMemo(
    () =>
      regions.map((region) => ({
        id: `domain-region-${region.id}`,
        type: "domainRegion",
        position: { x: region.x, y: region.y },
        data: {
          label: region.label,
          count: region.count,
          width: region.width,
          height: region.height,
          color: region.color,
          tint: region.tint,
          border: region.border,
          shape: region.shape,
        },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -10,
        style: { zIndex: -10 },
      })),
    [regions]
  );

  const nodeHandleState = useMemo(() => {
    const incoming = new Map<string, string>();
    const outgoing = new Map<string, string>();

    for (const edge of filteredEdges) {
      const relationColor = getRelationStyle(edge.relation).color;
      if (!outgoing.has(edge.from)) outgoing.set(edge.from, relationColor);
      if (!incoming.has(edge.to)) incoming.set(edge.to, relationColor);
    }

    return { incoming, outgoing };
  }, [filteredEdges]);

  const nodes: Node[] = useMemo(
    () =>
      rawNodes.map((n) => {
        const isSel = n.id === selectedId;
        const isAnc = ancSet.has(n.id);
        const isDesc = descSet.has(n.id);
        const onRoute = routeSet.has(n.id);
        const anyHi = selectedId !== null && visibleIds.has(selectedId);
        let dim = anyHi && !isSel && !isAnc && !isDesc;
        if (focusSet && !focusSet.has(n.id) && !onRoute) dim = true;
        const routeRole: RouteRole =
          n.id === routeFrom && onRoute ? "from" : n.id === routeTo && onRoute ? "to" : onRoute ? "waypoint" : null;
        return {
          ...n,
          selected: isSel,
          data: {
            ...n.data,
            dim,
            highlight: isSel ? "primary" : isAnc ? "anc" : isDesc ? "desc" : null,
            learningState: learningStates[n.id] ?? "not-started",
            routeRole,
            routeNonce,
            hasIncoming: nodeHandleState.incoming.has(n.id),
            hasOutgoing: nodeHandleState.outgoing.has(n.id),
            incomingHandleColor: nodeHandleState.incoming.get(n.id),
            outgoingHandleColor: nodeHandleState.outgoing.get(n.id),
          },
        };
      }),
    [
      rawNodes,
      selectedId,
      ancSet,
      descSet,
      visibleIds,
      focusSet,
      routeSet,
      routeFrom,
      routeTo,
      routeNonce,
      learningStates,
      nodeHandleState,
    ]
  );

  const edges: Edge[] = useMemo(
    () =>
      rawEdges.map((e) => {
        const hi = edgeHi.has(e.id);
        const isRoute = routeEdgeKeys.has(`${e.source}|${e.target}`);
        const anyHi = selectedId !== null && visibleIds.has(selectedId);
        let dim = anyHi && !hi;
        if (focusSet && !isRoute) {
          const inFocus = focusSet.has(e.source) && focusSet.has(e.target);
          if (!inFocus) dim = true;
        }
        return {
          ...e,
          zIndex: isRoute ? 10 : undefined,
          data: { ...e.data, dim: dim && !isRoute, highlight: hi && !isRoute, route: isRoute, routeNonce },
        };
      }),
    [rawEdges, edgeHi, selectedId, visibleIds, focusSet, routeEdgeKeys, routeNonce]
  );

  // Fit on view-mode change.
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.18, duration: 600 }), 80);
    return () => clearTimeout(t);
  }, [view, rf]);

  // Pan/zoom to selection.
  useEffect(() => {
    if (!selectedId) return;
    const node = rawNodes.find((n) => n.id === selectedId);
    if (!node) return;
    rf.setCenter(node.position.x + 120, node.position.y + 46, { zoom: Math.max(0.9, rf.getZoom()), duration: 450 });
  }, [selectedId, rawNodes, rf]);

  // Fit the route into view when a new route is planned.
  useEffect(() => {
    if (routeNonce === 0 || !routePath || routePath.length === 0) return;
    const ids = new Set(routePath);
    const routeNodes = rawNodes.filter((n) => ids.has(n.id));
    if (routeNodes.length === 0) return;
    const t = setTimeout(
      () => rf.fitView({ padding: 0.3, duration: 600, nodes: routeNodes.map((n) => ({ id: n.id })) }),
      60
    );
    return () => clearTimeout(t);
  }, [routeNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ReactFlow
        nodes={[...regionNodes, ...nodes]}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={() => useStore.getState().select(null)}
        onNodeContextMenu={(event, node) => {
          if (node.type === "domainRegion") return;
          event.preventDefault();
          useStore.getState().setRouteTo(node.id);
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.06}
        maxZoom={2.4}
        fitView
        defaultEdgeOptions={{ type: "topo" }}
      >
        <RFBackground variant={BackgroundVariant.Dots} gap={28} size={1} color={canvas.gridBackground} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      <MinimapCard nodes={nodes} regions={regions} routeSet={routeSet} selectedId={selectedId} />
      <Dock />
    </>
  );
}

export function GraphCanvas({ data }: { data: GraphData }) {
  return (
    <ReactFlowProvider>
      <InnerGraph data={data} />
    </ReactFlowProvider>
  );
}
