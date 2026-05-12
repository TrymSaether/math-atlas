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
import { data } from "../data";
import { useStore } from "../store";
import { dependencyLayout, clusterLayout, type Lane } from "../lib/layout";
import { buildAdjacency, ancestors, descendants } from "../lib/graph";
import { nodeKindColors, canvas, stroke } from "../lib/colors";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { LaneNode } from "./LaneNode";
import { layout } from "../design-tokens";

const nodeTypes = { topo: TopoNodeView, lane: LaneNode };
const edgeTypes = { topo: TopoEdgeView };

function InnerGraph() {
  const view = useStore((s) => s.view);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const highlight = useStore((s) => s.highlight);
  const showOrphans = useStore((s) => s.showOrphans);
  const rf = useReactFlow();

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
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
        (e) => relations.has(e.relation) && visibleIds.has(e.from) && visibleIds.has(e.to)
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

  const laneNodes: Node[] = useMemo(
    () =>
<<<<<<< Updated upstream
      lanes.map((l) => ({
        id: `lane-${l.topic}`,
        type: "lane",
        position: { x: -160, y: l.y - 20 },
        data: { topic: l.topic, subtitle: l.subtitle, width: l.width, height: l.height },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -1,
        style: { zIndex: -1 },
      })),
    [lanes]
||||||| Stash base
      lanes.map((l, index) => {
        const lanePalette = palette.lanes[index % palette.lanes.length];
        return {
          id: `lane-${l.topic}`,
          type: "lane",
          position: { x: -160, y: l.y - 20 },
          data: { topic: l.topic, subtitle: l.subtitle, width: l.width, height: l.height, palette: lanePalette },
          draggable: false,
          selectable: false,
          focusable: false,
          zIndex: -1,
          style: { zIndex: -1 },
        };
      }),
    [lanes, palette]
=======
      lanes.map((l, index) => {
        const lanePalette = palette.lanes[index % palette.lanes.length];
        return {
          id: `lane-${l.topic}`,
          type: "lane",
          position: { x: layout.canvas.laneOffset.x, y: l.y + layout.canvas.laneOffset.y },
          data: { topic: l.topic, subtitle: l.subtitle, width: l.width, height: l.height, palette: lanePalette },
          draggable: false,
          selectable: false,
          focusable: false,
          zIndex: -1,
          style: { zIndex: -1 },
        };
      }),
    [lanes, palette]
>>>>>>> Stashed changes
  );

  const nodes: Node[] = useMemo(
    () =>
      rawNodes.map((n) => {
        const isSel = n.id === selectedId;
        const isAnc = ancSet.has(n.id);
        const isDesc = descSet.has(n.id);
        const anyHi = selectedId !== null && visibleIds.has(selectedId);
        const dim = anyHi && !isSel && !isAnc && !isDesc;
        return {
          ...n, selected: isSel,
          data: { ...n.data, dim, highlight: isSel ? "primary" : isAnc ? "anc" : isDesc ? "desc" : null },
        };
      }),
    [rawNodes, selectedId, ancSet, descSet, visibleIds]
  );

  const edges: Edge[] = useMemo(
    () =>
      rawEdges.map((e) => {
        const hi = edgeHi.has(e.id);
        const anyHi = selectedId !== null && visibleIds.has(selectedId);
        return { ...e, data: { ...e.data, dim: anyHi && !hi, highlight: hi } };
      }),
    [rawEdges, edgeHi, selectedId, visibleIds]
  );

  // Fit on view-mode change.
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: layout.canvas.fitViewPadding, duration: layout.canvas.fitViewDuration }), layout.canvas.initialAnimationDelay);
    return () => clearTimeout(t);
  }, [view, rf]);

  // Pan/zoom to selection.
  useEffect(() => {
    if (!selectedId) return;
    const node = rawNodes.find((n) => n.id === selectedId);
    if (!node) return;
    rf.setCenter(node.position.x + 120, node.position.y + 46, { zoom: Math.max(0.9, rf.getZoom()), duration: layout.canvas.centerAnimationDuration });
  }, [selectedId, rawNodes, rf]);

  return (
    <ReactFlow
      nodes={[...laneNodes, ...nodes]}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={() => useStore.getState().select(null)}
      proOptions={{ hideAttribution: true }}
      minZoom={layout.canvas.minZoom}
      maxZoom={layout.canvas.maxZoom}
      fitView
      defaultEdgeOptions={{ type: "topo" }}
    >
      <RFBackground
        variant={BackgroundVariant.Dots}
<<<<<<< Updated upstream
        gap={28}
        size={1}
        color={canvas.gridBackground}
||||||| Stash base
        gap={28}
        size={1}
        color="var(--canvas-grid)"
=======
        gap={layout.canvas.gridGap}
        size={layout.canvas.miniMapSize}
        color="var(--canvas-grid)"
>>>>>>> Stashed changes
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
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 12,
          backdropFilter: "blur(8px)",
        }}
      />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <InnerGraph />
    </ReactFlowProvider>
  );
}
