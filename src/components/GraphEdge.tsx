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

const DETAIL_OPACITY: Record<SemanticDetail, number> = {
  dot: 0.18,
  title: 0.4,
  card: 0.78,
};

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
  const edge = data?.edge;
  const isRoute = Boolean(data?.route);
  const detail = data?.detail ?? "card";
  const style = getRelationStyle(edge?.relation ?? "relation", Boolean(data?.highlight) || isRoute, Boolean(data?.dim));
  const strokeWidth = isRoute ? 3 : style.width;
  const dim = Boolean(data?.dim) && !isRoute;
  const opacity = isRoute || data?.highlight ? 0.95 : Math.min(style.opacity, DETAIL_OPACITY[detail]);
  const showMarker = isRoute || data?.highlight || detail !== "dot";

  return (
    <>
      {!dim && detail !== "dot" && (
        <path
          d={path}
          fill="none"
          stroke="var(--bg)"
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={showMarker ? props.markerEnd : undefined}
        style={{
          stroke: isRoute ? "var(--accent)" : style.color,
          strokeWidth,
          strokeOpacity: isRoute ? 0.3 : opacity,
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
          stroke="var(--accent)"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
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
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-1)",
            }}
            className="rounded-pill border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest"
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const GraphEdgeView = memo(GraphEdgeViewComponent);
