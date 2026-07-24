import { useCallback, useEffect, useMemo, useRef } from "react";
import { ReactFlow, useReactFlow, useViewport } from "@xyflow/react";
import { useReducedMotion } from "motion/react";
import type { MapId } from "@/maps";
import type { AtlasMap } from "./model";
import { savedViewportFor, saveViewport } from "./viewportStorage";
import { ATLAS_NODE_HEIGHT, ATLAS_NODE_WIDTH } from "./layout";
import { getDomainTone } from "./colors";
import { useRouteResult } from "./route";
import { useStore } from "@/app/store";
import { buildGraphProjection, type GraphNodeViewData, type NodeEmphasis, type NodeLOD } from "./projection";
import { DomainRegionNode } from "./DomainRegionNode";
import { MinimapCard } from "./MinimapCard";
import { TopoEdgeView } from "./TopoEdge";
import { TopoNodeView } from "./TopoNode";

export type { NodeEmphasis, NodeLOD };

const nodeTypes = { topo: TopoNodeView, domainRegion: DomainRegionNode };
const edgeTypes = { topo: TopoEdgeView };

function InnerGraph() {
  const mapId = useStore((state) => state.mapId);
  const map = useStore((state) => state.loadedMaps[mapId]);
  if (!map) return null;
  return <LoadedGraph map={map} mapId={mapId} key={mapId} />;
}

function LoadedGraph({ map, mapId }: { map: AtlasMap; mapId: MapId }) {
  const view = useStore((state) => state.view);
  const search = useStore((state) => state.search)
    .toLowerCase()
    .trim();
  const searchScope = useStore((state) => state.searchScope);
  const kinds = useStore((state) => state.kinds);
  const topics = useStore((state) => state.topics);
  const relations = useStore((state) => state.relations);
  const selectedId = useStore((state) => state.selectedId);
  const focusMode = useStore((state) => state.focusMode);
  const focusDepth = useStore((state) => state.focusDepth);
  const showSoftDeps = useStore((state) => state.showSoftDeps);
  const showRegions = useStore((state) => state.showRegions);
  const showMinimap = useStore((state) => state.showMinimap);
  const routeFrom = useStore((state) => state.routeFrom);
  const routeTo = useStore((state) => state.routeTo);
  const routeRunKey = useStore((state) => state.routeRunKey);
  const setRouteSequence = useStore((state) => state.setRouteSequence);
  const route = useRouteResult();
  const reactFlow = useReactFlow();
  const { x, y, zoom } = useViewport();
  const reduceMotion = useReducedMotion();
  const defaultFocusId = useMemo(() => {
    const highestImpact = [...map.metrics.impactByNodeId.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return (
      highestImpact ?? map.data.nodes.find((node) => node.priority === "core")?.id ?? map.data.nodes[0]?.id ?? null
    );
  }, [map]);

  useEffect(() => {
    setRouteSequence(route.ordered);
  }, [route, setRouteSequence]);

  // Drop Liquid Glass blur while the canvas moves (it's expensive to recompute
  // over a moving backdrop). Driven by `onMove` with a debounced clear rather
  // than paired start/end events — a dropped `onMoveEnd` (interrupted animation,
  // initial fit) would otherwise leave `is-panning` stuck and kill all glass
  // translucency. The timer self-heals: the class always clears once motion stops.
  const panTimerRef = useRef<number | null>(null);
  const markPanning = useCallback(() => {
    document.documentElement.classList.add("is-panning");
    if (panTimerRef.current) clearTimeout(panTimerRef.current);
    panTimerRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove("is-panning");
      panTimerRef.current = null;
    }, 160);
  }, []);
  useEffect(
    () => () => {
      if (panTimerRef.current) clearTimeout(panTimerRef.current);
      document.documentElement.classList.remove("is-panning");
    },
    [],
  );

  // Preserve stable per-node data references so selection changes only update
  // concept nodes whose projected state actually changed.
  const nodeDataCacheRef = useRef(new Map<string, GraphNodeViewData>());
  const projection = useMemo(() => {
    const next = buildGraphProjection({
      map,
      mapId,
      view,
      search,
      searchScope,
      kinds,
      topics,
      relations,
      selectedId,
      focusMode,
      focusDepth,
      showSoftDeps,
      showRegions,
      routeFrom,
      routeTo,
      routeRunKey,
      route,
      zoom,
      domainToneFor: getDomainTone,
      // eslint-disable-next-line react-hooks/refs
      previousNodeData: nodeDataCacheRef.current,
    });
    // eslint-disable-next-line react-hooks/refs
    nodeDataCacheRef.current = next.nodeDataCache;
    return next;
  }, [
    map,
    mapId,
    view,
    search,
    searchScope,
    kinds,
    topics,
    relations,
    selectedId,
    focusMode,
    focusDepth,
    showSoftDeps,
    showRegions,
    routeFrom,
    routeTo,
    routeRunKey,
    route,
    zoom,
  ]);
  const layoutPositionsRef = useRef(projection.activeLayout.positions);
  layoutPositionsRef.current = projection.activeLayout.positions;

  const frameNode = useCallback(
    (nodeId: string, targetZoom: number, duration: number) => {
      const position = layoutPositionsRef.current.get(nodeId);
      const stage = document.querySelector<HTMLElement>(".shell-canvas-stage");
      if (!position || !stage) return false;
      const compact = window.matchMedia("(max-width: 820px)").matches;
      const zoom = Math.max(targetZoom, Math.min(1.1, reactFlow.getZoom()));
      const nodeCenterX = position.x + ATLAS_NODE_WIDTH / 2;
      const nodeCenterY = position.y + ATLAS_NODE_HEIGHT / 2;
      const targetX = stage.clientWidth * (compact ? 0.5 : 0.42);
      const targetY = stage.clientHeight * (compact ? 0.34 : 0.36);
      void reactFlow.setViewport(
        {
          x: targetX - nodeCenterX * zoom,
          y: targetY - nodeCenterY * zoom,
          zoom,
        },
        { duration },
      );
      return true;
    },
    [reactFlow],
  );

  const frameReadableView = useCallback(
    (duration: number) => {
      const compact = window.matchMedia("(max-width: 820px)").matches;
      const focusId = useStore.getState().selectedId ?? defaultFocusId;
      if (compact && focusId && frameNode(focusId, 0.78, duration)) return;
      void reactFlow.fitView({
        padding: compact ? 0.18 : 0.12,
        minZoom: compact ? 0.58 : 0.62,
        maxZoom: compact ? 0.9 : 0.86,
        duration,
      });
    },
    [defaultFocusId, frameNode, reactFlow],
  );

  // Restore only translations calculated for a compatible canvas. A viewport
  // saved on desktop cannot meaningfully position a compact canvas (and vice
  // versa), and large container changes should return to a readable frame.
  const viewportPersistenceKey = `${mapId}:${view}`;
  const restoredViewportKeyRef = useRef<string | null>(null);

  useEffect(() => {
    restoredViewportKeyRef.current = null;
    const savedViewport = savedViewportFor(mapId, view);
    const timeout = window.setTimeout(() => {
      const stage = document.querySelector<HTMLElement>(".shell-canvas-stage");
      const compact = window.matchMedia("(max-width: 820px)").matches;
      const width = stage?.clientWidth ?? window.innerWidth;
      const height = stage?.clientHeight ?? window.innerHeight;
      const compatible =
        savedViewport?.containerWidth !== undefined &&
        savedViewport.containerHeight !== undefined &&
        savedViewport.compact === compact &&
        Math.abs(savedViewport.containerWidth - width) / Math.max(width, 1) < 0.2 &&
        Math.abs(savedViewport.containerHeight - height) / Math.max(height, 1) < 0.2;
      if (savedViewport && compatible) {
        reactFlow.setViewport(savedViewport, { duration: 0 });
      } else {
        frameReadableView(reduceMotion ? 0 : view === "cluster" ? 520 : 0);
      }
      restoredViewportKeyRef.current = viewportPersistenceKey;
    }, 60);
    return () => window.clearTimeout(timeout);
  }, [frameReadableView, reactFlow, mapId, view, viewportPersistenceKey, reduceMotion]);

  useEffect(() => {
    if (restoredViewportKeyRef.current !== viewportPersistenceKey) return;
    const timeout = window.setTimeout(() => {
      const stage = document.querySelector<HTMLElement>(".shell-canvas-stage");
      saveViewport(mapId, view, {
        x,
        y,
        zoom,
        containerWidth: stage?.clientWidth ?? window.innerWidth,
        containerHeight: stage?.clientHeight ?? window.innerHeight,
        compact: window.matchMedia("(max-width: 820px)").matches,
      });
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [mapId, view, viewportPersistenceKey, x, y, zoom]);

  useEffect(() => {
    if (!selectedId) return;
    frameNode(selectedId, 0.9, reduceMotion ? 0 : 450);
  }, [frameNode, reduceMotion, selectedId]);

  useEffect(() => {
    let timeout = 0;
    let previousWidth = window.innerWidth;
    let previousHeight = window.innerHeight;
    let previousCompact = window.matchMedia("(max-width: 820px)").matches;
    const onResize = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        const compact = window.matchMedia("(max-width: 820px)").matches;
        const widthChange = Math.abs(window.innerWidth - previousWidth) / Math.max(previousWidth, 1);
        const heightChange = Math.abs(window.innerHeight - previousHeight) / Math.max(previousHeight, 1);
        if (compact !== previousCompact || widthChange > 0.22 || heightChange > 0.22) {
          frameReadableView(reduceMotion ? 0 : 280);
        }
        previousWidth = window.innerWidth;
        previousHeight = window.innerHeight;
        previousCompact = compact;
      }, 140);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, [frameReadableView, reduceMotion]);

  // The shell measures sidebar/panel width independently from React Flow.
  // Counter-shift the viewport by the same amount so opening, closing, or
  // resizing chrome does not make the graph jump beneath the learner.
  useEffect(() => {
    const onShellInsets = (event: Event) => {
      const deltaLeft = (event as CustomEvent<{ deltaLeft: number }>).detail.deltaLeft;
      if (!deltaLeft) return;
      const current = reactFlow.getViewport();
      const nextX = current.x - deltaLeft;
      void reactFlow.setViewport({ ...current, x: nextX }, { duration: 0 });

      if (!selectedId) return;
      const position = projection.activeLayout.positions.get(selectedId);
      if (!position) return;
      requestAnimationFrame(() => {
        const stage = document.querySelector<HTMLElement>(".shell-canvas-stage");
        if (!stage) return;
        const nodeCenterX = position.x + ATLAS_NODE_WIDTH / 2;
        const screenX = nodeCenterX * current.zoom + nextX;
        const safeMargin = Math.min(120, stage.clientWidth * 0.2);
        if (screenX >= safeMargin && screenX <= stage.clientWidth - safeMargin) return;
        reactFlow.setCenter(nodeCenterX, position.y + ATLAS_NODE_HEIGHT / 2, {
          zoom: current.zoom,
          duration: reduceMotion ? 0 : 200,
        });
      });
    };
    window.addEventListener("math-atlas:shell-insets", onShellInsets);
    return () => window.removeEventListener("math-atlas:shell-insets", onShellInsets);
  }, [projection.activeLayout.positions, reactFlow, reduceMotion, selectedId]);

  return (
    <>
      <ReactFlow
        nodes={projection.nodes}
        edges={projection.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={() => useStore.getState().select(null)}
        onMove={markPanning}
        proOptions={{ hideAttribution: true }}
        minZoom={0.08}
        maxZoom={2.4}
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        defaultEdgeOptions={{ type: "topo" }}
      />
      {showMinimap && (
        <MinimapCard
          nodes={projection.conceptNodes}
          regions={projection.activeLayout.domainBounds}
          selectedId={selectedId}
        />
      )}
    </>
  );
}

export function GraphCanvas() {
  return (
    <div className="shell-canvas-stage">
      <InnerGraph />
    </div>
  );
}
