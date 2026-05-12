import { useCallback, useMemo, type CSSProperties } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  BaseEdge,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "reactflow";
import {
  atlasNodes,
  atlasLanes,
  computeLearningPath,
  ATLAS_NODE_W,
  ATLAS_NODE_H,
  NODE_KIND_META,
  ROUTE_META,
  type AtlasNode,
} from "../atlas";
import { data } from "../data";
import { orientEdge } from "../lib/graph";
import { MathText } from "../lib/katex";
import { useStore } from "../store";

interface TopoNodeData {
  node: AtlasNode;
  selected: boolean;
  onRoute: boolean;
  dim: boolean;
}

interface TopoEdgeData {
  relation: "statement" | "proof" | "illustration";
  active: boolean;
  dim: boolean;
}

interface LaneData {
  topic: string;
  width: number;
  height: number;
  fill: string;
  border: string;
  label: string;
  radius: string;
}

const NODE_TYPES = {
  topo: TopoNodeView,
  lane: LaneNodeView,
};

const EDGE_TYPES = {
  topo: TopoEdgeView,
};

const LANE_PALETTE = [
  {
    fill: "rgba(0, 107, 166, 0.12)",
    border: "rgba(0, 107, 166, 0.20)",
    label: "rgba(20, 71, 103, 0.62)",
    radius: "46% 54% 50% 48% / 44% 40% 60% 56%",
  },
  {
    fill: "rgba(122, 77, 152, 0.12)",
    border: "rgba(122, 77, 152, 0.19)",
    label: "rgba(75, 51, 93, 0.62)",
    radius: "54% 46% 56% 44% / 50% 58% 42% 50%",
  },
  {
    fill: "rgba(217, 121, 4, 0.13)",
    border: "rgba(217, 121, 4, 0.19)",
    label: "rgba(119, 77, 22, 0.62)",
    radius: "50% 52% 44% 56% / 56% 46% 54% 44%",
  },
  {
    fill: "rgba(71, 113, 93, 0.12)",
    border: "rgba(71, 113, 93, 0.19)",
    label: "rgba(45, 84, 67, 0.62)",
    radius: "58% 42% 50% 50% / 44% 54% 46% 56%",
  },
  {
    fill: "rgba(138, 59, 59, 0.11)",
    border: "rgba(138, 59, 59, 0.18)",
    label: "rgba(95, 48, 48, 0.62)",
    radius: "48% 52% 58% 42% / 52% 42% 58% 48%",
  },
];

const ATLAS_NODE_BY_ID = new Map(atlasNodes.map((n) => [n.id, n]));

export function GraphCanvas() {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const search = useStore((s) => s.search).trim().toLowerCase();
  const kinds = useStore((s) => s.kinds);
  const relations = useStore((s) => s.relations);
  const showOrphans = useStore((s) => s.showOrphans);
  const pathTargetId = useStore((s) => s.pathTargetId);

  const activePathSet = useMemo(() => {
    const target = pathTargetId ?? selectedId ?? "";
    return new Set(computeLearningPath(target, relations));
  }, [pathTargetId, selectedId, relations]);

  // A node "matches" search if any of its searchable text contains the query.
  // When no search is active, every node matches.
  const matchesSearch = useCallback(
    (node: AtlasNode) =>
      !search ||
      `${node.shortLabel} ${node.title} ${node.kind} ${node.cluster}`
        .toLowerCase()
        .includes(search),
    [search],
  );

  // Visible = passes kind filter AND (no search OR matches search).
  // Edges respect the relation filter. Orphans (no surviving edges) hide
  // unless showOrphans is on.
  const { visibleNodeIds, dimmedNodeIds } = useMemo(() => {
    const kindOk = (n: AtlasNode) => kinds.has(n.kind);
    const passing = atlasNodes.filter(kindOk);
    const visible = new Set(passing.map((n) => n.id));
    if (!showOrphans) {
      const hasEdge = new Set<string>();
      for (const e of data.edges) {
        if (!relations.has(e.relation)) continue;
        if (visible.has(e.from) && visible.has(e.to)) {
          hasEdge.add(e.from);
          hasEdge.add(e.to);
        }
      }
      for (const id of [...visible]) if (!hasEdge.has(id)) visible.delete(id);
    }
    const dimmed = new Set<string>();
    if (search) {
      for (const n of passing) {
        if (visible.has(n.id) && !matchesSearch(n)) dimmed.add(n.id);
      }
    }
    return { visibleNodeIds: visible, dimmedNodeIds: dimmed };
  }, [kinds, relations, showOrphans, search, matchesSearch]);

  const rfNodes: Node[] = useMemo(() => {
    const laneNodes: Node[] = atlasLanes.map((lane, index) => {
      const palette = LANE_PALETTE[index % LANE_PALETTE.length];
      return {
        id: `lane:${lane.topic}`,
        type: "lane",
        position: { x: -62, y: lane.y - 26 },
        data: {
          topic: lane.topic,
          width: lane.width + 124,
          height: lane.height + 44,
          ...palette,
        } satisfies LaneData,
        draggable: false,
        selectable: false,
        zIndex: 0,
      };
    });

    const topoNodes: Node[] = atlasNodes
      .filter((n) => visibleNodeIds.has(n.id))
      .map((n) => ({
        id: n.id,
        type: "topo",
        position: { x: n.x, y: n.y },
        data: {
          node: n,
          selected: n.id === selectedId,
          onRoute: activePathSet.has(n.id),
          dim: dimmedNodeIds.has(n.id),
        } satisfies TopoNodeData,
        draggable: false,
        selectable: false,
        zIndex: 2,
      }));

    return [...laneNodes, ...topoNodes];
  }, [selectedId, activePathSet, visibleNodeIds, dimmedNodeIds]);

  const rfEdges: Edge[] = useMemo(() => {
    return data.edges
      .filter(
        (e) =>
          ATLAS_NODE_BY_ID.has(e.from) &&
          ATLAS_NODE_BY_ID.has(e.to) &&
          relations.has(e.relation) &&
          visibleNodeIds.has(e.from) &&
          visibleNodeIds.has(e.to),
      )
      .map((e) => {
        const route = orientEdge(e, "route");
        const active = activePathSet.has(e.from) && activePathSet.has(e.to);
        const dim = dimmedNodeIds.has(e.from) || dimmedNodeIds.has(e.to);
        return {
          id: e.id,
          source: route.from,
          target: route.to,
          type: "topo",
          data: { relation: e.relation, active, dim } satisfies TopoEdgeData,
          zIndex: active ? 1 : 0,
        };
      });
  }, [relations, visibleNodeIds, dimmedNodeIds, activePathSet]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === "topo") select(node.id);
    },
    [select],
  );

  return (
    <div className="topo-flow-shell">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        defaultEdgeOptions={{ type: "topo" }}
      >
        <RFBackground variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(120,105,80,0.18)" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(255,253,246,0.55)"
          nodeColor={(n) => {
            if (n.type === "lane") return "rgba(0,0,0,0.04)";
            const d = n.data as TopoNodeData;
            return NODE_KIND_META[d.node.kind].color;
          }}
          nodeStrokeWidth={0}
          style={{ background: "rgba(255,253,246,0.85)", border: "1px solid rgba(74,62,45,0.18)" }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function TopoNodeView({ data: d }: NodeProps<TopoNodeData>) {
  const { node, selected, onRoute, dim } = d;
  const meta = NODE_KIND_META[node.kind];
  return (
    <div
      className={[
        "rf-topo-node",
        selected ? "selected" : "",
        onRoute ? "on-route" : "",
        dim ? "search-dim" : "",
      ].join(" ")}
      style={{
        width: ATLAS_NODE_W,
        minHeight: ATLAS_NODE_H,
        borderColor: meta.color,
        "--node-color": meta.color,
      } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} className="!opacity-0" style={{ background: "transparent", border: "none" }} />
      <span className="node-kicker">
        <b>{node.shortLabel}</b>
        <em>{node.cluster}</em>
      </span>
      <span className="node-title">
        <MathText text={node.title} />
      </span>
    </div>
  );
}

function LaneNodeView({ data: d }: NodeProps<LaneData>) {
  return (
    <div
      className="rf-lane-node"
      style={{
        width: d.width,
        height: d.height,
        display: "grid",
        alignItems: "start",
        padding: "22px 34px",
        border: `1px solid ${d.border}`,
        borderRadius: d.radius,
        background: `radial-gradient(circle at 22% 18%, rgba(255,253,246,0.58), transparent 34%), ${d.fill}`,
        boxShadow: "inset 0 0 42px rgba(104,95,80,0.04)",
        color: d.label,
        pointerEvents: "none",
      } as CSSProperties}
    >
      <span
        style={{
          maxWidth: 260,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.08em",
          lineHeight: 1.12,
          textTransform: "uppercase",
        }}
      >
        {d.topic}
      </span>
    </div>
  );
}

function TopoEdgeView(props: EdgeProps<TopoEdgeData>) {
  const { sourceX, sourceY, targetX, targetY } = props;
  const path = roundedMetroPath(sourceX, sourceY, targetX, targetY);
  const relation = props.data?.relation ?? "statement";
  const color = ROUTE_META[relation].color;
  const active = props.data?.active ?? false;
  const dim = props.data?.dim ?? false;
  const baseWidth = relation === "statement" ? 5.2 : relation === "proof" ? 4.8 : 4.2;
  const activeWidth = relation === "statement" ? 9.2 : relation === "proof" ? 8.2 : 7.2;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: color,
        strokeWidth: active ? activeWidth : baseWidth,
        strokeOpacity: dim ? 0.08 : active ? 0.98 : 0.3,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
        filter: active
          ? "drop-shadow(0 1px 0 rgba(255,253,246,0.9)) drop-shadow(0 0 4px rgba(0,77,120,0.22))"
          : undefined,
      }}
    />
  );
}

function roundedMetroPath(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  if (Math.abs(dy) < 6) return `M${sourceX} ${sourceY} L${targetX} ${targetY}`;

  const xDir = dx >= 0 ? 1 : -1;
  const yDir = dy >= 0 ? 1 : -1;
  const midX = sourceX + dx / 2;
  const bend = Math.max(0, Math.min(24, Math.abs(dx) / 2 - 2, Math.abs(dy) / 2));

  if (bend < 4) {
    return `M${sourceX} ${sourceY} L${midX} ${sourceY} L${midX} ${targetY} L${targetX} ${targetY}`;
  }

  return [
    `M${sourceX} ${sourceY}`,
    `H${midX - xDir * bend}`,
    `Q${midX} ${sourceY} ${midX} ${sourceY + yDir * bend}`,
    `V${targetY - yDir * bend}`,
    `Q${midX} ${targetY} ${midX + xDir * bend} ${targetY}`,
    `H${targetX}`,
  ].join(" ");
}
