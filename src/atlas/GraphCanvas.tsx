import { useCallback, useEffect, useMemo, useRef } from "react";
import { ReactFlow, useReactFlow, useViewport } from "@xyflow/react";
import type { LoadedMap, MapId } from "@/maps";
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

function LoadedGraph({ map, mapId }: { map: LoadedMap; mapId: MapId }) {
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

  // Default view shows the entire map. Restore a saved map/view viewport when
  // one exists; otherwise fit the active layout once React Flow has mounted it.
  const viewportPersistenceKey = `${mapId}:${view}`;
  const restoredViewportKeyRef = useRef<string | null>(null);

  useEffect(() => {
    restoredViewportKeyRef.current = null;
    const savedViewport = savedViewportFor(mapId, view);
    const timeout = window.setTimeout(() => {
      if (savedViewport) {
        reactFlow.setViewport(savedViewport, { duration: 0 });
      } else {
        reactFlow.fitView({ padding: 0.12, duration: view === "cluster" ? 520 : 0 });
      }
      restoredViewportKeyRef.current = viewportPersistenceKey;
    }, 40);
    return () => window.clearTimeout(timeout);
  }, [reactFlow, mapId, view, viewportPersistenceKey]);

  useEffect(() => {
    if (restoredViewportKeyRef.current !== viewportPersistenceKey) return;
    const timeout = window.setTimeout(() => {
      saveViewport(mapId, view, { x, y, zoom });
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [mapId, view, viewportPersistenceKey, x, y, zoom]);

  useEffect(() => {
    if (!selectedId) return;
    const position = projection.activeLayout.positions.get(selectedId);
    if (!position) return;
    reactFlow.setCenter(position.x + ATLAS_NODE_WIDTH / 2, position.y + ATLAS_NODE_HEIGHT / 2, {
      zoom: Math.max(0.9, reactFlow.getZoom()),
      duration: 450,
    });
  }, [selectedId, projection.activeLayout.positions, reactFlow]);

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
        fitView
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
  return <InnerGraph />;
}
