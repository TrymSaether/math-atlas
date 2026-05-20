import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "reactflow";
import { memo } from "react";
import type { GraphEdge as GraphEdgeT } from "../types";
import { getRelationStyle } from "../lib/relationStyle";
import type { SemanticDetail } from "../hooks/useSemanticZoom";

interface Data {
  edge: GraphEdgeT;
  detail?: SemanticDetail;
  dim?: boolean;
  highlight?: boolean;
  route?: boolean;
  routeNonce?: number;
}

// Opacity falls off when zoomed out so the graph reads as shape, not noise.
const DETAIL_OPACITY: Record<SemanticDetail, number> = {
  dot: 0.18,
  title: 0.4,
  card: 0.78,
};

/** Metro-map style edge: rounded orthogonal path with a white halo at crossings. */
function GraphEdgeViewComponent(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 14,
  });
  const e = data?.edge;
  const isRoute = Boolean(data?.route);
  const detail = data?.detail ?? "card";
  const style = getRelationStyle(e?.relation ?? "relation", Boolean(data?.highlight) || isRoute, Boolean(data?.dim));
  const strokeWidth = isRoute ? 3 : style.width;
  const dim = Boolean(data?.dim) && !isRoute;

  // Highlight / route edges stay loud; everything else dims with zoom.
  const baseOpacity =
    isRoute || data?.highlight ? 0.95 : Math.min(style.opacity, DETAIL_OPACITY[detail]);

  // Arrowheads hide when the canvas is zoomed out so they don't blob into the
  // surrounding edges.
  const showMarker = isRoute || data?.highlight || detail !== "dot";

  return (
    <>
      {/* White halo so crossings read cleanly, metro-map convention. */}
      {!dim && detail !== "dot" && (
        <path
          d={path}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={strokeWidth + 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={showMarker ? props.markerEnd : undefined}
        style={{
          stroke: isRoute ? "var(--primary)" : style.color,
          strokeWidth,
          strokeOpacity: isRoute ? 0.28 : baseOpacity,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: isRoute ? undefined : style.dash,
        }}
      />
      {isRoute && (
        <path
          key={`route-${props.id}-${data?.routeNonce ?? 0}`}
          className="ma-route-edge"
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{ ["--route-len" as string]: 1 }}
        />
      )}
      {data?.highlight && !isRoute && detail === "card" && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              color: style.color,
            }}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest shadow-[var(--shadow-soft)]"
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const GraphEdgeView = memo(GraphEdgeViewComponent);
