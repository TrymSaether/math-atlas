import { useCallback, useMemo, type CSSProperties } from "react";
import ReactFlow, {
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
}

const NODE_TYPES = {
  topo: TopoNodeView,
  lane: LaneNodeView,
};

const EDGE_TYPES = {
  topo: TopoEdgeView,
};

const SELECTED_STATION_COLOR = "#005b8d";
const ROUTE_ZOOM = 1.04;

const LANE_PALETTE = [
  { fill: "rgba(26, 115, 232, 0.07)", border: "rgba(26, 115, 232, 0.44)", label: "rgba(26, 70, 135, 0.42)" },
  { fill: "rgba(15, 157, 88, 0.07)", border: "rgba(15, 157, 88, 0.44)", label: "rgba(23, 96, 62, 0.42)" },
  { fill: "rgba(251, 140, 0, 0.075)", border: "rgba(251, 140, 0, 0.46)", label: "rgba(143, 83, 13, 0.44)" },
  { fill: "rgba(126, 87, 194, 0.07)", border: "rgba(126, 87, 194, 0.44)", label: "rgba(83, 58, 136, 0.42)" },
  { fill: "rgba(219, 68, 55, 0.07)", border: "rgba(219, 68, 55, 0.44)", label: "rgba(132, 54, 46, 0.42)" },
  { fill: "rgba(0, 172, 193, 0.07)", border: "rgba(0, 172, 193, 0.44)", label: "rgba(18, 103, 115, 0.42)" },
  { fill: "rgba(121, 85, 72, 0.07)", border: "rgba(121, 85, 72, 0.44)", label: "rgba(90, 65, 56, 0.42)" },
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

  const matchesSearch = useCallback(
    (node: AtlasNode) =>
      !search ||
      `${node.shortLabel} ${node.title} ${node.kind} ${node.cluster}`
        .toLowerCase()
        .includes(search),
    [search],
  );

  const { visibleNodeIds, dimmedNodeIds } = useMemo(() => {
    const passing = atlasNodes.filter((n) => kinds.has(n.kind));
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
        position: { x: -72, y: lane.y - 34 },
        data: { topic: lane.topic, width: lane.width + 120, height: lane.height + 28, ...palette } satisfies LaneData,
        draggable: false,
        selectable: false,
        zIndex: 0,
      };
    });

    const topoNodes: Node[] = atlasNodes
      .filter((n) => visibleNodeIds.has(n.id))
      .map((n) => {
        const selected = n.id === selectedId;
        const onRoute = activePathSet.has(n.id);
        return {
          id: n.id,
          type: "topo",
          position: { x: n.x, y: n.y },
          data: { node: n, selected, onRoute, dim: dimmedNodeIds.has(n.id) } satisfies TopoNodeData,
          draggable: false,
          selectable: false,
          zIndex: selected ? 5 : onRoute ? 4 : 2,
        };
      });

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
          zIndex: active ? 3 : 1,
        };
      });
  }, [relations, visibleNodeIds, dimmedNodeIds, activePathSet]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.type === "topo") select(node.id);
  }, [select]);

  return (
    <div className="topo-flow-shell">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
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
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(255,253,246,0.55)"
          nodeColor={(n) => {
            if (n.type === "lane") return "rgba(0,0,0,0.03)";
            const d = n.data as TopoNodeData;
            return d.selected ? SELECTED_STATION_COLOR : NODE_KIND_META[d.node.kind].color;
          }}
          nodeStrokeWidth={0}
          style={{ background: "rgba(255,253,246,0.85)", border: "1px solid rgba(74,62,45,0.10)" }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function TopoNodeView({ data: d }: NodeProps<TopoNodeData>) {
  const { node, selected, onRoute, dim } = d;
  const meta = NODE_KIND_META[node.kind];
  const stationColor = selected ? SELECTED_STATION_COLOR : meta.color;
  return (
    <div
      className={["rf-topo-node", selected ? "selected" : "", onRoute ? "on-route" : "", dim ? "search-dim" : ""].join(" ")}
      style={{
        width: selected ? ATLAS_NODE_W + 26 : ATLAS_NODE_W,
        minHeight: selected ? ATLAS_NODE_H + 10 : ATLAS_NODE_H,
        borderColor: stationColor,
        "--node-color": stationColor,
        "--kind-color": meta.color,
      } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} className="!opacity-0" style={{ background: "transparent", border: "none" }} />
      <span className="node-kicker">
        <strong className="node-id">{node.shortLabel}</strong>
        <span className="node-kind-badge" style={{ background: meta.color }}>{node.kind}</span>
      </span>
      <span className="node-title"><MathText text={node.title} /></span>
      <span className="node-cluster">{node.cluster}</span>
    </div>
  );
}

function LaneNodeView({ data: d }: NodeProps<LaneData>) {
  const notch = 34;
  const path = `M ${notch} 0 H ${d.width - notch} Q ${d.width} 0 ${d.width} ${notch} V ${d.height - notch} Q ${d.width} ${d.height} ${d.width - notch} ${d.height} H ${notch} Q 0 ${d.height} 0 ${d.height - notch} V ${notch} Q 0 0 ${notch} 0 Z`;
  return (
    <div className="rf-lane-node" style={{ width: d.width, height: d.height, pointerEvents: "none" } as CSSProperties}>
      <svg width={d.width} height={d.height} viewBox={`0 0 ${d.width} ${d.height}`} aria-hidden="true">
        <path d={path} fill={d.fill} stroke={d.border} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span style={{ position: "absolute", left: 30, top: 18, maxWidth: 340, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: "0.18em", lineHeight: 1.05, textTransform: "uppercase", color: d.label }}>
        {d.topic}
      </span>
    </div>
  );
}

function TopoEdgeView(props: EdgeProps<TopoEdgeData>) {
  const { sourceX, sourceY, targetX, targetY } = props;
  const active = props.data?.active ?? false;
  const path = roundedMetroPath(sourceX, sourceY, targetX, targetY, active ? ROUTE_ZOOM : 1);
  const relation = props.data?.relation ?? "statement";
  const color = ROUTE_META[relation].color;
  const dim = props.data?.dim ?? false;
  const baseWidth = relation === "statement" ? 4.4 : relation === "proof" ? 4 : 3.4;
  const activeWidth = relation === "statement" ? 11.5 : relation === "proof" ? 10.2 : 8.8;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: active ? SELECTED_STATION_COLOR : color,
        strokeWidth: active ? activeWidth : baseWidth,
        strokeOpacity: dim ? 0.035 : active ? 0.98 : 0.12,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
        filter: active ? "drop-shadow(0 0 5px rgba(0,91,141,0.20))" : undefined,
      }}
    />
  );
}

function roundedMetroPath(sourceX: number, sourceY: number, targetX: number, targetY: number, zoom = 1) {
  const cx = (sourceX + targetX) / 2;
  const cy = (sourceY + targetY) / 2;
  const sx = cx + (sourceX - cx) * zoom;
  const sy = cy + (sourceY - cy) * zoom;
  const tx = cx + (targetX - cx) * zoom;
  const ty = cy + (targetY - cy) * zoom;
  const dx = tx - sx;
  const dy = ty - sy;
  if (Math.abs(dy) < 6) return `M${sx} ${sy} L${tx} ${ty}`;

  const xDir = dx >= 0 ? 1 : -1;
  const yDir = dy >= 0 ? 1 : -1;
  const midX = sx + dx / 2;
  const bend = Math.max(0, Math.min(24, Math.abs(dx) / 2 - 2, Math.abs(dy) / 2));

  if (bend < 4) return `M${sx} ${sy} L${midX} ${sy} L${midX} ${ty} L${tx} ${ty}`;

  return [`M${sx} ${sy}`, `H${midX - xDir * bend}`, `Q${midX} ${sy} ${midX} ${sy + yDir * bend}`, `V${ty - yDir * bend}`, `Q${midX} ${ty} ${midX + xDir * bend} ${ty}`, `H${tx}`].join(" ");
}
