import { useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import type { LoadedMap } from "../data";
import { useStore } from "../store";
import { getDomainTone } from "../lib/colors";
import { getRelationStyle } from "../lib/relationStyle";
import { ATLAS_NODE_WIDTH, ATLAS_NODE_HEIGHT } from "../lib/atlasLayout";
import type { GraphData, GraphNode } from "../types";
import { TopoNodeView } from "./TopoNode";
import { TopoEdgeView } from "./TopoEdge";
import { ClusterBubbleNode, type ClusterMember } from "./ClusterBubbleNode";
import { ClusterEdge } from "./ClusterEdge";
import { useSemanticDetail } from "../hooks/useSemanticZoom";

const nodeTypes = {
  topo: TopoNodeView,
  cluster: ClusterRegion,
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
  const graphMode = useStore((s) => s.graphMode);
  const setGraphMode = useStore((s) => s.setGraphMode);
  const focusDomainId = useStore((s) => s.focusDomainId);
  const collapseToOverview = useStore((s) => s.collapseToOverview);
  const expandDomain = useStore((s) => s.expandDomain);
  const select = useStore((s) => s.select);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const relations = useStore((s) => s.relations);
  const selectedId = useStore((s) => s.selectedId);
  const rf = useReactFlow();
  const detail = useSemanticDetail();

  const { data, positions, domainBounds } = map;
  const isOverview = graphMode === "overview";

  const filteredNodes = useMemo(() => {
    return data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
      if (focusDomainId && !isOverview && n.domainId !== focusDomainId) return false;
      if (topics.size && !topics.has(n.domainId)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText} ${n.explanation}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [data.nodes, focusDomainId, isOverview, kinds, topics, search, searchScope]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () =>
      data.edges.filter(
        (e) => relations.has(e.relation) && visibleIds.has(e.from) && visibleIds.has(e.to),
      ),
    [data.edges, relations, visibleIds],
  );

  const overview = useMemo(() => buildOverview(data), [data]);

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

  const clusterNodes: Node[] = useMemo(() => {
    if (isOverview || focusDomainId) return [];
    const visibleDomains = new Set(filteredNodes.map((n) => n.domainId));
    const pad = 28;
    const nodes: Node[] = [];
    for (const [domainId, bounds] of domainBounds) {
      if (!visibleDomains.has(domainId)) continue;
      const tone = getDomainTone(domainId);
      const domain = map.domainById.get(domainId);
      nodes.push({
        id: `cluster::${domainId}`,
        type: "cluster",
        position: { x: bounds.x - pad, y: bounds.y - pad },
        draggable: false,
        selectable: false,
        zIndex: -1,
        data: {
          width: bounds.width + pad * 2,
          height: bounds.height + pad * 2,
          tone,
          label: domain?.label ?? domainId,
        },
        style: {
          width: bounds.width + pad * 2,
          height: bounds.height + pad * 2,
          pointerEvents: "none",
        },
      });
    }
    return nodes;
  }, [domainBounds, filteredNodes, focusDomainId, isOverview, map.domainById]);

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

  const conceptNodes: Node[] = useMemo(
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
          data: {
            node: n,
            detail,
            isSelected,
            isRelated,
            dim,
            incomingHandleColor: nodeHandleState.incoming.get(n.id),
            outgoingHandleColor: nodeHandleState.outgoing.get(n.id),
          },
        };
      }),
    [detail, filteredNodes, nodeHandleState, positions, selectedId, relatedIds],
  );

  const nodes = useMemo(
    () => (isOverview ? overview.nodes : [...clusterNodes, ...conceptNodes]),
    [clusterNodes, conceptNodes, isOverview, overview.nodes],
  );

  const edges: Edge[] = useMemo(() => {
    if (isOverview) return overview.edges;
    return filteredEdges.map((e) => {
      const highlight = highlightedEdgeIds.has(e.id);
      const dim = selectedId !== null && !highlight;
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        type: "topo",
        data: { edge: e, detail, highlight, dim },
      };
    });
  }, [detail, filteredEdges, highlightedEdgeIds, isOverview, overview.edges, selectedId]);

  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: isOverview ? 0.24 : 0.18, duration: 350 }), 50);
    return () => clearTimeout(t);
  }, [focusDomainId, isOverview, rf, map.data.id]);

  useEffect(() => {
    if (isOverview || !selectedId) return;
    const pos = positions.get(selectedId);
    if (!pos) return;
    rf.setCenter(
      pos.x + ATLAS_NODE_WIDTH / 2,
      pos.y + ATLAS_NODE_HEIGHT / 2,
      { zoom: Math.max(0.9, rf.getZoom()), duration: 450 },
    );
  }, [isOverview, selectedId, positions, rf]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          if (node.type === "topo") select(node.id);
          if (node.type === "clusterBubble") {
            const domainId = (node.data as { domainId?: string }).domainId;
            if (domainId) expandDomain(domainId);
          }
        }}
        onPaneClick={() => useStore.getState().select(null)}
        proOptions={{ hideAttribution: true }}
        minZoom={0.08}
        maxZoom={2.4}
        fitView
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        defaultEdgeOptions={{ type: "topo" }}
      >
        {!isOverview && (
          <MiniMap
            pannable
            zoomable
            ariaLabel="Atlas overview"
            nodeColor={(n) => {
              const node = (n.data as { node?: { domainId: string } })?.node;
              if (!node) return "transparent";
              return getDomainTone(node.domainId).color;
            }}
            nodeStrokeColor={() => "transparent"}
            nodeBorderRadius={3}
            nodeStrokeWidth={0}
            maskColor="color-mix(in srgb, var(--bg) 72%, transparent)"
            maskStrokeColor="var(--border)"
            maskStrokeWidth={1}
            style={{ width: 180, height: 130 }}
          />
        )}
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      <div className="pointer-events-none absolute left-3 top-[68px] z-20 flex items-center gap-2">
        <div
          className="pointer-events-auto inline-flex items-center gap-0.5 rounded-pill border p-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-1)" }}
        >
          <ModeButton active={isOverview} onClick={collapseToOverview}>Overview</ModeButton>
          <ModeButton active={!isOverview && !focusDomainId} onClick={() => setGraphMode("detail")}>Detail</ModeButton>
        </div>
        {!isOverview && focusDomainId && (
          <button
            type="button"
            onClick={collapseToOverview}
            className="pointer-events-auto rounded-pill border px-3 py-2 text-[12px] font-semibold"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-2)", boxShadow: "var(--shadow-1)" }}
          >
            {map.domainById.get(focusDomainId)?.label ?? "Domain"}
          </button>
        )}
      </div>
    </>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-pill px-3 py-1.5 text-[12px] font-semibold transition-colors"
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--fg-on-color)" : "var(--fg-2)",
      }}
    >
      {children}
    </button>
  );
}

function buildOverview(data: GraphData): { nodes: Node[]; edges: Edge[] } {
  const nodesByDomain = new Map<string, GraphNode[]>();
  for (const node of data.nodes) {
    const group = nodesByDomain.get(node.domainId) ?? [];
    group.push(node);
    nodesByDomain.set(node.domainId, group);
  }

  const domainIds = data.domains
    .filter((domain) => nodesByDomain.has(domain.id))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((domain) => domain.id);

  const counts = domainIds.map((id) => nodesByDomain.get(id)?.length ?? 0);
  const minCount = Math.min(...counts, 1);
  const maxCount = Math.max(...counts, 1);
  const cols = Math.max(1, Math.ceil(Math.sqrt(domainIds.length)));
  const maxW = 340;
  const maxH = 240;
  const cellW = 420;
  const cellH = 320;

  const nodes: Node[] = domainIds.map((domainId, index) => {
    const members = nodesByDomain.get(domainId) ?? [];
    const domain = data.domains.find((d) => d.id === domainId);
    const tone = getDomainTone(domainId);
    const t =
      maxCount === minCount
        ? 0.55
        : (Math.sqrt(members.length) - Math.sqrt(minCount)) /
          (Math.sqrt(maxCount) - Math.sqrt(minCount));
    const width = 230 + t * (maxW - 230);
    const height = 170 + t * (maxH - 170);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * cellW + (cellW - width) / 2;
    const y = row * cellH + (cellH - height) / 2;
    const clusterMembers: ClusterMember[] = members.map((member) => ({
      kind: member.kind,
      color: kindColor(member.kind),
    }));

    return {
      id: bubbleId(domainId),
      type: "clusterBubble",
      position: { x, y },
      draggable: false,
      selectable: false,
      data: {
        domainId,
        label: domain?.label ?? domainId,
        count: members.length,
        members: clusterMembers,
        color: tone.color,
        tint: tone.tint,
        border: tone.border,
        width,
        height,
      },
      style: { width, height },
    };
  });

  const nodeDomain = new Map(data.nodes.map((node) => [node.id, node.domainId]));
  const aggregate = new Map<string, { from: string; to: string; weight: number }>();
  for (const edge of data.edges) {
    const from = nodeDomain.get(edge.from);
    const to = nodeDomain.get(edge.to);
    if (!from || !to || from === to) continue;
    const key = `${from}|${to}`;
    const entry = aggregate.get(key);
    if (entry) entry.weight += 1;
    else aggregate.set(key, { from, to, weight: 1 });
  }

  const edges: Edge[] = [...aggregate.values()].map((edge) => ({
    id: `cluster-edge::${edge.from}::${edge.to}`,
    source: bubbleId(edge.from),
    target: bubbleId(edge.to),
    type: "cluster",
    data: {
      weight: edge.weight,
      sourceColor: getDomainTone(edge.from).color,
      targetColor: getDomainTone(edge.to).color,
    },
  }));

  return { nodes, edges };
}

function bubbleId(domainId: string): string {
  return `cluster-bubble::${domainId}`;
}

function kindColor(kind: string): string {
  switch (kind) {
    case "definition":
      return "var(--blue)";
    case "theorem":
      return "var(--purple)";
    case "lemma":
    case "property":
    case "construction":
      return "var(--green)";
    case "example":
    case "notation":
      return "var(--gold)";
    case "proposition":
    case "counterexample":
    case "non_example":
      return "var(--pink)";
    case "corollary":
    case "proof":
    case "axiom":
      return "var(--orange)";
    default:
      return "var(--teal)";
  }
}

function ClusterRegion({
  data,
}: {
  data: {
    width: number;
    height: number;
    tone: { color: string; tint: string; border: string };
    label: string;
  };
}) {
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        background: data.tone.tint,
        border: `1px dashed ${data.tone.border}`,
        borderRadius: 24,
        position: "relative",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-sans)",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: data.tone.color,
          opacity: 0.85,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 999,
            background: data.tone.color,
          }}
        />
        {data.label}
      </div>
    </div>
  );
}

export function GraphCanvas() {
  return <InnerGraph />;
}
