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
import { getThemePalette, type LanePalette } from "../themes";
import type { Relation } from "../types";

interface TopoNodeData {
  node: AtlasNode;
  selected: boolean;
  onRoute: boolean;
  dim: boolean;
  color: string;
  island?: string;
}

interface TopoEdgeData {
  relation: Relation;
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
  subtitle?: string;
  variant?: "chapter" | "island";
}

interface IslandLayoutGroup extends LaneData {
  x: number;
  y: number;
  ids: string[];
}

interface MathIslandAnchor {
  rank: number;
  x: number;
  y: number;
}

const NODE_TYPES = {
  topo: TopoNodeView,
  lane: LaneNodeView,
};

const EDGE_TYPES = {
  topo: TopoEdgeView,
};

const ATLAS_NODE_BY_ID = new Map(atlasNodes.map((n) => [n.id, n]));
const ATLAS_INDEX = new Map(atlasNodes.map((n, index) => [n.id, index]));

const ABSTRACT_GROUP_RULES: Array<{ key: string; label: string; test: (node: AtlasNode) => boolean }> = [
  {
    key: "foundations",
    label: "Foundations",
    test: (node) => /set theory|algebra|metric foundations/i.test(node.cluster),
  },
  {
    key: "spaces",
    label: "Spaces & Topologies",
    test: (node) => /topological spaces|generating topologies/i.test(node.cluster),
  },
  {
    key: "continuity",
    label: "Maps & Continuity",
    test: (node) => /continuous|continuity|homeomorphism|map/i.test(`${node.title} ${node.semanticRole ?? ""}`),
  },
  {
    key: "constructions",
    label: "Constructions",
    test: (node) => /constructions|subspace|product|quotient|basis|subbasis/i.test(`${node.cluster} ${node.title}`),
  },
  {
    key: "properties",
    label: "Connected & Separated",
    test: (node) => /connected|path-connected|hausdorff|separation/i.test(`${node.title} ${node.cluster}`),
  },
  {
    key: "compactness",
    label: "Compactness",
    test: (node) => /compact|cover|tube|heine|bounded|extreme/i.test(`${node.title} ${node.cluster}`),
  },
  {
    key: "homotopy",
    label: "Homotopy & Loops",
    test: (node) => /fundamental group$|homotopy|path|loop|retract|simply connected/i.test(`${node.cluster} ${node.title}`),
  },
  {
    key: "coverings",
    label: "Coverings & S¹",
    test: (node) => /circle|s¹|covering|lifting|torus|exponential/i.test(`${node.cluster} ${node.title}`),
  },
];

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
  const mapStructureMode = useStore((s) => s.mapStructureMode);
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

  const islandLayout = useMemo(
    () => buildIslandLayout(visibleNodeIds, relations, palette.lanes),
    [visibleNodeIds, relations, palette.lanes],
  );

  const rfNodes: Node[] = useMemo(() => {
    const laneNodes: Node[] = mapStructureMode === "islands"
      ? islandLayout.groups.map((group, index) => ({
        id: `island:${group.topic}`,
        type: "lane",
        position: { x: group.x, y: group.y },
        className: "island-node-wrapper",
        data: {
          ...group,
          ...palette.lanes[index % palette.lanes.length],
          variant: "island",
        } satisfies LaneData,
        draggable: false,
        selectable: false,
        zIndex: 0,
      }))
      : atlasLanes.map((lane, index) => {
        const lanePalette = palette.lanes[index % palette.lanes.length];
        return {
          id: `lane:${lane.topic}`,
          type: "lane",
          position: { x: -72, y: lane.y - 34 },
          data: {
            topic: lane.topic,
            width: lane.width + 120,
            height: lane.height + 28,
            variant: "chapter",
            ...lanePalette,
          } satisfies LaneData,
          draggable: false,
          selectable: false,
          zIndex: 0,
        };
      });

    const topoNodes: Node[] = atlasNodes
      .filter((n) => visibleNodeIds.has(n.id))
      .map((n) => {
        const islandPosition = islandLayout.positions.get(n.id);
        return {
          id: n.id,
          type: "topo",
          position: mapStructureMode === "islands" && islandPosition ? islandPosition : { x: n.x, y: n.y },
          data: {
            node: n,
            selected: n.id === selectedId,
            onRoute: activePathSet.has(n.id),
            dim: dimmedNodeIds.has(n.id),
            color: palette.kindColors[n.kind],
            island: islandLayout.groupByNode.get(n.id),
          } satisfies TopoNodeData,
          draggable: false,
          selectable: false,
          zIndex: 2,
        };
      });

    return [...laneNodes, ...topoNodes];
  }, [selectedId, activePathSet, visibleNodeIds, dimmedNodeIds, palette, mapStructureMode, islandLayout]);

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
        key={mapStructureMode}
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: mapStructureMode === "islands" ? 0.14 : 0.18, maxZoom: 1 }}
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
  const path = d.variant === "island" ? islandBlobPath(d.width, d.height) : chapterLanePath(d.width, d.height);
  return (
    <div
      className={`rf-lane-node ${d.variant === "island" ? "island-lane-node" : ""}`}
      style={{ width: d.width, height: d.height, pointerEvents: "none" } as CSSProperties}
    >
      <svg width={d.width} height={d.height} viewBox={`0 0 ${d.width} ${d.height}`} aria-hidden="true">
        <path d={path} fill={d.fill} stroke={d.border} strokeWidth={d.variant === "island" ? "2.4" : "1.6"} strokeLinejoin="round" />
      </svg>
      <span
        className="lane-label"
        style={{
          position: "absolute",
          left: d.variant === "island" ? 62 : 30,
          top: d.variant === "island" ? 46 : 18,
          maxWidth: d.variant === "island" ? d.width - 124 : 340,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: d.variant === "island" ? 22 : 18,
          fontWeight: 800,
          letterSpacing: d.variant === "island" ? "0.12em" : "0.18em",
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: d.label,
        }}
      >
        {d.topic}
        {d.subtitle ? <small>{d.subtitle}</small> : null}
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
      }}
    />
  );
}

function buildIslandLayout(visibleNodeIds: Set<string>, relations: Set<Relation>, lanes: LanePalette[]) {
  const routeEdges = data.edges
    .filter((e) => relations.has(e.relation) && visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to))
    .map((e) => orientEdge(e, "route"));
  const depth = computeRouteDepths(routeEdges);
  const degree = computeDegrees(routeEdges);

  const groups = new Map<string, AtlasNode[]>();
  const labels = new Map<string, string>();
  for (const node of atlasNodes) {
    if (!visibleNodeIds.has(node.id)) continue;
    const group = abstractGroupFor(node);
    labels.set(group.key, group.label);
    if (!groups.has(group.key)) groups.set(group.key, []);
    groups.get(group.key)!.push(node);
  }

  const ordered = [...groups.entries()].sort(([keyA, a], [keyB, b]) => {
    const labelA = labels.get(keyA) ?? keyA;
    const labelB = labels.get(keyB) ?? keyB;
    const anchorA = mathIslandAnchor(keyA, labelA, 0, averageDepth(a, depth));
    const anchorB = mathIslandAnchor(keyB, labelB, 0, averageDepth(b, depth));
    if (anchorA.rank !== anchorB.rank) return anchorA.rank - anchorB.rank;
    return averageDepth(a, depth) - averageDepth(b, depth);
  });
  const positions = new Map<string, { x: number; y: number }>();
  const groupByNode = new Map<string, string>();
  const islandGroups: IslandLayoutGroup[] = [];

  ordered.forEach(([key, members], groupIndex) => {
    const depthAverage = averageDepth(members, depth);
    const sorted = [...members].sort((a, b) => {
      const da = depth.get(a.id) ?? 0;
      const db = depth.get(b.id) ?? 0;
      if (da !== db) return da - db;
      const ga = degree.get(a.id) ?? 0;
      const gb = degree.get(b.id) ?? 0;
      if (ga !== gb) return gb - ga;
      return (ATLAS_INDEX.get(a.id) ?? 0) - (ATLAS_INDEX.get(b.id) ?? 0);
    });

    const label = labels.get(key) ?? key;
    const cols = Math.max(3, Math.min(8, Math.ceil(Math.sqrt(sorted.length * 2.1))));
    const rows = Math.ceil(sorted.length / cols);
    const width = Math.max(1120, cols * 350 + 430);
    const height = Math.max(540, rows * 165 + 340);
    const center = mathIslandAnchor(key, label, groupIndex, depthAverage);
    const islandX = center.x - width / 2;
    const islandY = center.y - height / 2;
    const lanePalette = lanes[groupIndex % lanes.length];

    islandGroups.push({
      topic: label,
      subtitle: `${sorted.length} stations · route island`,
      x: islandX,
      y: islandY,
      width,
      height,
      ids: sorted.map((n) => n.id),
      variant: "island",
      ...lanePalette,
    });

    const left = islandX + 130;
    const top = islandY + 158;
    const availableW = Math.max(0, width - ATLAS_NODE_W - 260);
    const availableH = Math.max(0, height - ATLAS_NODE_H - 280);
    const xStep = cols <= 1 ? 0 : availableW / (cols - 1);
    const yStep = rows <= 1 ? 0 : availableH / (rows - 1);

    sorted.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const rowStagger = row % 2 === 0 ? -xStep * 0.10 : xStep * 0.18;
      const routePull = ((depth.get(node.id) ?? 0) - depthAverage) * 10;
      const jitterX = (((index * 37 + groupIndex * 19) % 41) - 20) * 2.6;
      const jitterY = (((index * 53 + groupIndex * 23) % 37) - 18) * 2.3;
      const waveY = Math.sin((col + groupIndex * 0.7) * 0.9) * 34;
      positions.set(node.id, {
        x: left + (cols === 1 ? availableW / 2 : col * xStep) + rowStagger + routePull + jitterX,
        y: top + (rows === 1 ? availableH / 2 : row * yStep) + waveY + jitterY,
      });
      groupByNode.set(node.id, label);
    });
  });

  return { positions, groups: islandGroups, groupByNode };
}

function mathIslandAnchor(key: string, label: string, fallbackIndex: number, depthAverage: number): MathIslandAnchor {
  const text = `${key} ${label}`.toLowerCase();
  const known: Array<{ test: RegExp; anchor: MathIslandAnchor }> = [
    { test: /foundation|set|algebra|metric/, anchor: { rank: 0, x: -4200, y: 0 } },
    { test: /space|topolog/, anchor: { rank: 1, x: -1850, y: -760 } },
    { test: /map|continuity|homeomorphism/, anchor: { rank: 2, x: 700, y: -1180 } },
    { test: /construction|basis|subspace|product|quotient/, anchor: { rank: 3, x: 640, y: 1120 } },
    { test: /connected|separated|hausdorff/, anchor: { rank: 4, x: 3300, y: -900 } },
    { test: /compact|heine|bounded|extreme/, anchor: { rank: 5, x: 3600, y: 1260 } },
    { test: /homotopy|loop|fundamental|retract/, anchor: { rank: 6, x: 6100, y: -1080 } },
    { test: /covering|s¹|circle|lifting|torus|exponential/, anchor: { rank: 7, x: 7550, y: 880 } },
    { test: /fixed|brouwer|application|overture/, anchor: { rank: 8, x: 8800, y: -240 } },
  ];
  const matched = known.find(({ test }) => test.test(text));
  const base = matched?.anchor ?? {
    rank: 20 + fallbackIndex,
    x: -3200 + depthAverage * 920 + (fallbackIndex % 3) * 700,
    y: ((fallbackIndex * 997) % 7 - 3) * 760,
  };
  return {
    rank: base.rank,
    x: base.x + Math.sin((fallbackIndex + 1) * 1.77 + depthAverage * 0.41) * 190,
    y: base.y + Math.cos((fallbackIndex + 1) * 1.21 + depthAverage * 0.29) * 160,
  };
}

function abstractGroupFor(node: AtlasNode) {
  const rule = ABSTRACT_GROUP_RULES.find((candidate) => candidate.test(node));
  if (rule) return { key: rule.key, label: rule.label };
  const semanticLayer = node.semanticLayer?.trim();
  if (semanticLayer && !/unknown|misc/i.test(semanticLayer)) {
    return { key: `semantic:${semanticLayer}`, label: semanticLayer };
  }
  return { key: `topic:${node.cluster}`, label: node.cluster };
}

function computeRouteDepths(edges: Array<{ from: string; to: string }>) {
  const predecessors = new Map<string, string[]>();
  for (const node of atlasNodes) predecessors.set(node.id, []);
  for (const edge of edges) predecessors.get(edge.to)?.push(edge.from);
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const visit = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const d = (predecessors.get(id) ?? []).reduce((max, predecessor) => Math.max(max, visit(predecessor) + 1), 0);
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const node of atlasNodes) visit(node.id);
  return depth;
}

function computeDegrees(edges: Array<{ from: string; to: string }>) {
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }
  return degree;
}

function averageDepth(nodes: AtlasNode[], depth: Map<string, number>) {
  if (!nodes.length) return 0;
  return nodes.reduce((sum, node) => sum + (depth.get(node.id) ?? 0), 0) / nodes.length;
}

function chapterLanePath(width: number, height: number) {
  const notch = 34;
  return `M ${notch} 0 H ${width - notch} Q ${width} 0 ${width} ${notch} V ${height - notch} Q ${width} ${height} ${width - notch} ${height} H ${notch} Q 0 ${height} 0 ${height - notch} V ${notch} Q 0 0 ${notch} 0 Z`;
}

function islandBlobPath(width: number, height: number) {
  return [
    `M ${width * 0.13} ${height * 0.11}`,
    `C ${width * 0.27} ${height * -0.02}, ${width * 0.58} ${height * 0.02}, ${width * 0.78} ${height * 0.10}`,
    `C ${width * 0.98} ${height * 0.18}, ${width * 1.02} ${height * 0.43}, ${width * 0.94} ${height * 0.62}`,
    `C ${width * 0.86} ${height * 0.86}, ${width * 0.65} ${height * 1.02}, ${width * 0.40} ${height * 0.95}`,
    `C ${width * 0.16} ${height * 0.90}, ${width * -0.03} ${height * 0.74}, ${width * 0.03} ${height * 0.48}`,
    `C ${width * 0.05} ${height * 0.31}, ${width * 0.02} ${height * 0.20}, ${width * 0.13} ${height * 0.11}`,
    "Z",
  ].join(" ");
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
