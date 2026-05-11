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
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { LaneNode } from "./LaneNode";

const nodeTypes = { topo: TopoNodeView, lane: LaneNode };
const edgeTypes = { topo: TopoEdgeView };

const KIND_HEX: Record<string, string> = {
  definition: "#5ce1ff", theorem: "#a78bff", lemma: "#7af3c4",
  example: "#ffd58a", proposition: "#ff8fb1", corollary: "#ffb86c",
};

function InnerGraph() {
  const view = useStore((s) => s.view);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const chapters = useStore((s) => s.chapters);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const highlight = useStore((s) => s.highlight);
  const showOrphans = useStore((s) => s.showOrphans);
  const rf = useReactFlow();

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
      if (chapters.size && !chapters.has(n.chapter)) return false;
      if (topics.size && !topics.has(n.topicCluster)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.tags.join(" ")} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [kinds, chapters, topics, search, searchScope]);

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
      lanes.map((l) => ({
        id: `lane-${l.chapter}`,
        type: "lane",
        position: { x: -160, y: l.y - 20 },
        data: { chapter: l.chapter, title: l.title, width: l.width, height: l.height },
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
        color="rgba(120,140,255,0.22)"
      />
      <MiniMap
        pannable zoomable
        nodeColor={(n) => KIND_HEX[(n.data as any)?.node?.kind ?? "definition"] || "#888"}
        nodeStrokeColor={(n) => (n.selected ? "#ffffff" : "transparent")}
        nodeStrokeWidth={3}
        maskColor="rgba(5,6,10,0.7)"
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
