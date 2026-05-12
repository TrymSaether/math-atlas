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
  type AtlasNode,
} from "../atlas";
import { data } from "../data";
import { orientEdge } from "../lib/graph";
import { MathText } from "../lib/katex";
import { useStore } from "../store";
import { getThemePalette } from "../themes";

interface TopoNodeData {
  node: AtlasNode;
  selected: boolean;
  onRoute: boolean;
  dim: boolean;
  color: string;
}

interface TopoEdgeData {
  relation: "statement" | "proof" | "illustration";
  active: boolean;
  dim: boolean;
  color: string;
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

const ATLAS_NODE_BY_ID = new Map(atlasNodes.map((n) => [n.id, n]));

export function GraphCanvas() {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const search = useStore((s) => s.search).trim().toLowerCase();
  const kinds = useStore((s) => s.kinds);
  const relations = useStore((s) => s.relations);
  const showOrphans = useStore((s) => s.showOrphans);
  const pathTargetId = useStore((s) => s.pathTargetId);
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const palette = getThemePalette(themeId, colorMode);

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
      const lanePalette = palette.lanes[index % palette.lanes.length];
      return {
        id: `lane:${lane.topic}`,
        type: "lane",
        position: { x: -72, y: lane.y - 34 },
        data: {
          topic: lane.topic,
          width: lane.width + 120,
          height: lane.height + 28,
          ...lanePalette,
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
          color: palette.kindColors[n.kind],
        } satisfies TopoNodeData,
        draggable: false,
        selectable: false,
        zIndex: 2,
      }));

    return [...laneNodes, ...topoNodes];
  }, [selectedId, activePathSet, visibleNodeIds, dimmedNodeIds, palette]);

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
          data: {
            relation: e.relation,
            active,
            dim,
            color: palette.routeColors[e.relation],
          } satisfies TopoEdgeData,
          zIndex: active ? 1 : 0,
        };
      });
  }, [relations, visibleNodeIds, dimmedNodeIds, activePathSet, palette]);

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
          maskColor={palette.miniMapMask}
          nodeColor={(n) => {
            if (n.type === "lane") return "rgba(0,0,0,0.03)";
            const d = n.data as TopoNodeData;
            return d.color;
          }}
          nodeStrokeWidth={0}
          style={{ background: palette.miniMapBackground, border: palette.miniMapBorder }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function TopoNodeView({ data: d }: NodeProps<TopoNodeData>) {
  const { node, selected, onRoute, dim, color } = d;
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
        borderColor: color,
        "--node-color": color,
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
  const notch = 34;
  const path = `M ${notch} 0 H ${d.width - notch} Q ${d.width} 0 ${d.width} ${notch} V ${d.height - notch} Q ${d.width} ${d.height} ${d.width - notch} ${d.height} H ${notch} Q 0 ${d.height} 0 ${d.height - notch} V ${notch} Q 0 0 ${notch} 0 Z`;
  return (
    <div className="rf-lane-node" style={{ width: d.width, height: d.height, pointerEvents: "none" } as CSSProperties}>
      <svg width={d.width} height={d.height} viewBox={`0 0 ${d.width} ${d.height}`} aria-hidden="true">
        <path d={path} fill={d.fill} stroke={d.border} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span
        style={{
          position: "absolute",
          left: 30,
          top: 18,
          maxWidth: 340,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "0.18em",
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: d.label,
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
  const color = props.data?.color ?? "#006BA6";
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
        strokeOpacity: dim ? 0.04 : active ? 0.95 : 0.16,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
        filter: active ? "drop-shadow(0 0 8px color-mix(in srgb, currentColor 30%, transparent))" : undefined,
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
