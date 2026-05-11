import { useMemo, useState, type CSSProperties } from "react";
import { Focus, Minus, Plus } from "lucide-react";
import {
  atlasNodes,
  atlasRoutes,
  activePathIds,
  NODE_KIND_META,
  ROUTE_META,
  type AtlasNode,
  type AtlasRoute,
} from "../atlas";
import { MathText } from "../lib/katex";
import { useStore } from "../store";

const CANVAS_W = 1120;
const CANVAS_H = 835;
const DEFAULT_ZOOM = 0.72;

const clusters = [
  { label: "Basics of Topology", slug: "basics", x: 92, y: 30, w: 760, h: 292 },
  { label: "Connectedness & Continuity", slug: "continuity", x: 670, y: 48, w: 340, h: 214 },
  { label: "Compactness & Coverings", slug: "compactness", x: 90, y: 356, w: 508, h: 396 },
  { label: "Fixed Point Theory", slug: "fixed", x: 612, y: 390, w: 462, h: 334 },
  { label: "Homology & Higher Topology", slug: "homology", x: 500, y: 710, w: 390, h: 102 },
];

export function GraphCanvas() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const search = useStore((s) => s.search).trim().toLowerCase();

  const activeRouteIds = useMemo(() => new Set(atlasRoutes.filter((route) => route.active).map((route) => route.id)), []);

  const queryMatches = (node: AtlasNode) => {
    if (!search) return true;
    return `${node.id} ${node.title} ${node.kind} ${node.cluster}`.toLowerCase().includes(search);
  };

  return (
    <div className="graph-shell">
      <div className="graph-header">
        <div>
          <span>Dependency Atlas</span>
          <strong>D2 to P10</strong>
        </div>
        <p>Selected route: topology through continuity and compactness to fixed points.</p>
      </div>

      <div className="graph-scroll">
        <div
          className="graph-stage"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${zoom})`,
          }}
        >
          {clusters.map((cluster) => (
            <div
              key={cluster.label}
              className={`cluster-band cluster-${cluster.slug}`}
              style={{
                left: cluster.x,
                top: cluster.y,
                width: cluster.w,
                height: cluster.h,
              }}
            >
              <span>{cluster.label}</span>
            </div>
          ))}

          <svg className="route-layer" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} aria-hidden="true">
            <g className="routes-inactive">
              {atlasRoutes
                .filter((route) => !activeRouteIds.has(route.id))
                .map((route) => (
                  <RoutePath key={route.id} route={route} />
                ))}
            </g>
            <g className="routes-active">
              {atlasRoutes
                .filter((route) => activeRouteIds.has(route.id))
                .map((route) => (
                  <RoutePath key={route.id} route={route} active />
                ))}
            </g>
          </svg>

          {atlasNodes.map((node) => {
            const meta = NODE_KIND_META[node.kind];
            const selected = selectedId === node.id;
            const inActivePath = activePathIds.includes(node.id);
            const dim = !queryMatches(node);
            return (
              <button
                key={node.id}
                className={[
                  "atlas-node",
                  selected ? "selected" : "",
                  inActivePath ? "on-route" : "",
                  dim ? "search-dim" : "",
                ].join(" ")}
                style={{
                  left: node.x,
                  top: node.y,
                  borderColor: meta.color,
                  "--node-color": meta.color,
                } as CSSProperties}
                onClick={() => select(node.id)}
              >
                <span className="node-kicker">
                  <b>{idPrefix(node.id)}</b>
                  <em>{node.id}</em>
                </span>
                <span className="node-title">
                  <MathText text={node.title} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-tools">
        <MiniMap selectedId={selectedId ?? "P10"} />
        <div className="zoom-controls" aria-label="Zoom controls">
          <button onClick={() => setZoom((value) => Math.min(1.05, Number((value + 0.08).toFixed(2))))} aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((value) => Math.max(0.52, Number((value - 0.08).toFixed(2))))} aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(DEFAULT_ZOOM)} aria-label="Fit map">
            <Focus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RoutePath({ route, active = false }: { route: AtlasRoute; active?: boolean }) {
  const meta = ROUTE_META[route.kind];
  return (
    <path
      d={route.path}
      className={`metro-route route-${route.kind} ${active ? "active" : ""}`}
      style={{ stroke: meta.color }}
    />
  );
}

function MiniMap({ selectedId }: { selectedId: string }) {
  return (
    <div className="mini-map" aria-label="Minimap">
      <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
        {atlasRoutes.map((route) => (
          <path
            key={route.id}
            d={route.path}
            className={`mini-route route-${route.kind} ${route.active ? "active" : ""}`}
            style={{ stroke: ROUTE_META[route.kind].color }}
          />
        ))}
        {atlasNodes.map((node) => (
          <rect
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.id === selectedId ? 178 : 160}
            height={node.id === selectedId ? 74 : 58}
            rx="5"
            className={node.id === selectedId ? "selected" : ""}
            fill={NODE_KIND_META[node.kind].color}
          />
        ))}
      </svg>
    </div>
  );
}

function idPrefix(id: string) {
  return id.replace(/[0-9]/g, "");
}
