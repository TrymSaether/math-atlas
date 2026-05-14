import { useMemo, useEffect } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from "reactflow";
import { useStore } from "../store";
import { dependencyLayout, clusterLayout, type Lane } from "../lib/layout";
import { buildAdjacency, ancestors, descendants, buildLearningPath } from "../lib/graph";
import { nodeKindColors, canvas, stroke } from "../lib/colors";
import type { GraphData } from "../types";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { GraphGroupRegion } from "./GraphGroupRegion";

const nodeTypes = { topo: TopoNodeView, lane: GraphGroupRegion };
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
  const pathTargetId = useStore((s) => s.pathTargetId);
  const rf = useReactFlow();

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (kinds.size > 0 && !kinds.has(n.kind)) return false;
      if (topics.size && !topics.has(n.topicCluster)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [kinds, topics, search, searchScope]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (e) => (relations.size === 0 || relations.has(e.relation)) && visibleIds.has(e.from) && visibleIds.has(e.to)
      ),
    [relations, visibleIds]
  );

  const { rawNodes, rawEdges, lanes } = useMemo(() => {
    if (view === "dependency") {
      const r = dependencyLayout({ nodes: filteredNodes, edges: filteredEdges, showOrphans });
      return { rawNodes: r.nodes, rawEdges: r.edges, lanes: r.lanes };
    }
    const r = clusterLayout({ nodes: filteredNodes, edges: filteredEdges });
    return { rawNodes: r.nodes, rawEdges: r.edges, lanes: [] as Lane[] };
  }, [view, filteredNodes, filteredEdges, showOrphans]);

  const adj = useMemo(() => buildAdjacency(filteredEdges, relations), [filteredEdges, relations]);

  const routeNodeIds = useMemo(() => {
    if (!pathTargetId || !visibleIds.has(pathTargetId)) return new Set<string>();
    return new Set(buildLearningPath(pathTargetId, filteredEdges, relations, filteredNodes).map((n) => n.id));
  }, [pathTargetId, visibleIds, filteredEdges, relations, filteredNodes]);

  const routeEdgeIds = useMemo(() => {
    if (!routeNodeIds.size) return new Set<string>();
    return new Set(filteredEdges.filter((e) => routeNodeIds.has(e.from) && routeNodeIds.has(e.to)).map((e) => e.id));
  }, [filteredEdges, routeNodeIds]);

  const { ancSet, descSet, edgeHi } = useMemo(() => {
    if (!selectedId || !visibleIds.has(selectedId)) {
      return { ancSet: new Set<string>(), descSet: new Set<string>(), edgeHi: new Set<string>(routeEdgeIds) };
    }
    let a: Set<string>, d: Set<string>;
    if (highlight === "immediate") {
      a = new Set((adj.in.get(selectedId) ?? []).map((x) => x.id));
      d = new Set((adj.out.get(selectedId) ?? []).map((x) => x.id));
    } else {
      a = ancestors(adj, selectedId);
      d = descendants(adj, selectedId);
    }
    const eHi = new Set<string>(routeEdgeIds);
    for (const e of filteredEdges) {
      const involves = e.from === selectedId || e.to === selectedId;
      if (involves) eHi.add(e.id);
      if (highlight === "full") {
        if ((a.has(e.from) || e.from === selectedId) && (a.has(e.to) || e.to === selectedId)) eHi.add(e.id);
        if ((d.has(e.from) || e.from === selectedId) && (d.has(e.to) || e.to === selectedId)) eHi.add(e.id);
      }
    }
    return { ancSet: a, descSet: d, edgeHi: eHi };
  }, [selectedId, adj, filteredEdges, highlight, visibleIds, routeEdgeIds]);

  const laneNodes: Node[] = useMemo(
    () =>
      lanes.map((l) => ({
        id: `lane-${l.topic}`,
        type: "lane",
        position: { x: l.x - 14, y: l.y - 14 },
        data: { topic: l.topic, subtitle: l.subtitle, width: l.width + 28, height: l.height + 28, color: l.color, rgb: l.rgb, icon: l.icon },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -1,
        style: { zIndex: -1 },
      })),
    [lanes]
  );

  const nodes: Node[] = useMemo(
    () =>
      rawNodes.map((n) => {
        const isSel = n.id === selectedId;
        const isAnc = ancSet.has(n.id);
        const isDesc = descSet.has(n.id);
        const isRoute = routeNodeIds.has(n.id);
        const anyHi = (selectedId !== null && visibleIds.has(selectedId)) || routeNodeIds.size > 0;
        const dim = anyHi && !isSel && !isAnc && !isDesc && !isRoute;
        return {
          ...n, selected: isSel,
          data: { ...n.data, dim, highlight: isSel ? "primary" : isRoute ? "route" : isAnc ? "anc" : isDesc ? "desc" : null },
        };
      }),
    [rawNodes, selectedId, ancSet, descSet, visibleIds, routeNodeIds]
  );

  const edges: Edge[] = useMemo(
    () =>
      rawEdges.map((e) => {
        const hi = edgeHi.has(e.id);
        const isRoute = routeEdgeIds.has(e.id);
        const anyHi = (selectedId !== null && visibleIds.has(selectedId)) || routeEdgeIds.size > 0;
        return { ...e, data: { ...e.data, dim: anyHi && !hi, highlight: hi, route: isRoute } };
      }),
    [rawEdges, edgeHi, selectedId, visibleIds, routeEdgeIds]
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
    rf.setCenter(node.position.x + 124, node.position.y + 54, { zoom: Math.max(0.92, rf.getZoom()), duration: 450 });
  }, [selectedId, rawNodes, rf]);

  return (
    <ReactFlow
      nodes={[...laneNodes, ...nodes]}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={() => useStore.getState().select(null)}
      proOptions={{ hideAttribution: true }}
      minZoom={0.06}
      maxZoom={2.4}
      fitView
      defaultEdgeOptions={{ type: "topo" }}
    >
      <RFBackground
        variant={BackgroundVariant.Dots}
        gap={28}
        size={1}
        color={canvas.gridBackground}
      />
      <MiniMap
        pannable zoomable
        ariaLabel="Concept map overview"
        nodeColor={(n) => {
          if (n.type === "lane") return "transparent";
          const k = (n.data as any)?.node?.kind;
          return k ? nodeKindColors[k as keyof typeof nodeKindColors] ?? nodeKindColors.definition : nodeKindColors.definition;
        }}
        nodeStrokeColor={(n) =>
          n.type === "lane" ? "transparent" : n.selected ? stroke.primaryHover : stroke.primary
        }
        nodeBorderRadius={3}
        nodeStrokeWidth={1}
        maskColor={canvas.maskBackground}
        maskStrokeColor={canvas.maskStroke}
        maskStrokeWidth={1.5}
        style={{
          background: canvas.background,
          border: "1px solid var(--border)",
          borderRadius: 12,
          backdropFilter: "blur(8px)",
        }}
      />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
}

export function GraphCanvas({ data }: { data: GraphData }) {
  return (
    <ReactFlowProvider>
      <InnerGraph data={data} />
    </ReactFlowProvider>
  );
}
