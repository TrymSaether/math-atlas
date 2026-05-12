import { useCallback, useMemo, type CSSProperties } from "react";
import ReactFlow, {
  Background as RFBackground,
  BackgroundVariant,
  BaseEdge,
  Controls,
  Handle,
  MiniMap,
  Position,
  getBezierPath,
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
    const laneNodes: Node[] = atlasLanes.map((lane) => ({
      id: `lane:${lane.topic}`,
      type: "lane",
      position: { x: -40, y: lane.y - 18 },
      data: { topic: lane.topic, width: lane.width + 80, height: lane.height + 28 } satisfies LaneData,
      draggable: false,
      selectable: false,
      zIndex: 0,
    }));

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
    <div className="rf-lane-node" style={{ width: d.width, height: d.height }}>
      <span>{d.topic}</span>
    </div>
  );
}

function TopoEdgeView(props: EdgeProps<TopoEdgeData>) {
  const { sourceX, sourceY, targetX, targetY } = props;
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });
  const relation = props.data?.relation ?? "statement";
  const color = ROUTE_META[relation].color;
  const active = props.data?.active ?? false;
  const dim = props.data?.dim ?? false;
  const dash = relation === "proof" ? "8 8" : undefined;
  const baseWidth = relation === "statement" ? 2.1 : relation === "proof" ? 1.8 : 1.35;
  const baseOpacity = relation === "statement" ? 0.46 : relation === "proof" ? 0.44 : 0.5;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: color,
        strokeWidth: active ? Math.max(4, baseWidth * 2.4) : baseWidth,
        strokeOpacity: dim ? 0.08 : active ? 0.96 : baseOpacity,
        strokeDasharray: active && relation === "proof" ? "10 8" : dash,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
        filter: active
          ? "drop-shadow(0 1px 0 rgba(255,253,246,0.9)) drop-shadow(0 0 2px rgba(0,77,120,0.18))"
          : undefined,
      }}
    />
  );
}
