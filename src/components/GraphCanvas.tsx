import { useMemo, useEffect } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
} from "reactflow";
import type { LoadedMap } from "../data";
import { useStore } from "../store";
import { getDomainTone } from "../lib/colors";
import { ATLAS_NODE_WIDTH, ATLAS_NODE_HEIGHT } from "../lib/atlasLayout";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";

const nodeTypes = { topo: TopoNodeView };
const edgeTypes = { topo: TopoEdgeView };

function InnerGraph() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <LoadedGraph map={map} key={mapId} />;
}

function LoadedGraph({ map }: { map: LoadedMap }) {
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const rf = useReactFlow();

  const { data, positions } = map;

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
      if (topics.size && !topics.has(n.domainId)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [data, kinds, topics, search, searchScope]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (e) => relations.has(e.relation) && visibleIds.has(e.from) && visibleIds.has(e.to),
      ),
    [data.edges, relations, visibleIds],
  );

  const relatedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>();
    for (const e of filteredEdges) {
      if (e.from === selectedId) set.add(e.to);
      if (e.to === selectedId) set.add(e.from);
    }
    return set;
  }, [selectedId, filteredEdges]);

  const highlightedEdgeIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    return new Set(filteredEdges.filter((e) => e.from === selectedId || e.to === selectedId).map((e) => e.id));
  }, [selectedId, filteredEdges]);

  const nodes: Node[] = useMemo(
    () =>
      filteredNodes.map((n) => {
        const pos = positions.get(n.id) ?? { x: 0, y: 0 };
        const isSelected = n.id === selectedId;
        const isRelated = relatedIds.has(n.id);
        const dim = selectedId !== null && !isSelected && !isRelated;
        return {
          id: n.id,
          type: "topo",
          position: pos,
          draggable: false,
          data: { node: n, isSelected, isRelated, dim },
        };
      }),
    [filteredNodes, positions, selectedId, relatedIds],
  );

  const edges: Edge[] = useMemo(
    () =>
      filteredEdges.map((e) => {
        const highlight = highlightedEdgeIds.has(e.id);
        const dim = selectedId !== null && !highlight;
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          type: "topo",
          data: { highlight, dim },
        };
      }),
    [filteredEdges, highlightedEdgeIds, selectedId],
  );

  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.18, duration: 0 }), 30);
    return () => clearTimeout(t);
  }, [rf, map.data.id]);

  useEffect(() => {
    if (!selectedId) return;
    const pos = positions.get(selectedId);
    if (!pos) return;
    rf.setCenter(
      pos.x + ATLAS_NODE_WIDTH / 2,
      pos.y + ATLAS_NODE_HEIGHT / 2,
      { zoom: Math.max(0.9, rf.getZoom()), duration: 450 },
    );
  }, [selectedId, positions, rf]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={() => useStore.getState().select(null)}
      proOptions={{ hideAttribution: true }}
      minZoom={0.1}
      maxZoom={2.4}
      fitView
      panOnScroll
      selectionOnDrag={false}
      nodesDraggable={false}
      defaultEdgeOptions={{ type: "topo" }}
    >
      <RFBackground
        variant={BackgroundVariant.Dots}
        gap={22}
        size={0.8}
        color="rgba(0,0,0,0.07)"
      />
      <MiniMap
        pannable
        zoomable
        ariaLabel="Atlas overview"
        nodeColor={(n) => {
          const node = (n.data as any)?.node;
          if (!node) return "#0A84FF";
          return getDomainTone(node.domainId).color;
        }}
        nodeStrokeColor={() => "transparent"}
        nodeBorderRadius={3}
        nodeStrokeWidth={0}
        maskColor="rgba(247, 245, 240, 0.72)"
        maskStrokeColor="rgba(0,0,0,0.12)"
        maskStrokeWidth={1}
        style={{ width: 180, height: 130 }}
      />
    </ReactFlow>
  );
}

export function GraphCanvas() {
  return <InnerGraph />;
}
