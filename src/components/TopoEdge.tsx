import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "reactflow";
import { getRelationStyle } from "../lib/relationStyle";
import type { SemanticDetail } from "../hooks/useSemanticZoom";
import type { GraphEdge } from "../types";

interface Data {
  edge?: GraphEdge;
  detail?: SemanticDetail;
  dim?: boolean;
  highlight?: boolean;
}

export function TopoEdgeView(props: EdgeProps<Data>) {
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

  const isHi = !!data?.highlight;
  const detail = data?.detail ?? "card";
  const style = getRelationStyle(data?.edge?.relation ?? "relation", isHi, !!data?.dim);
  const opacity = detail === "dot" && !isHi ? Math.min(style.opacity, 0.2) : style.opacity;
  const showLabel = isHi && detail === "card";

  return (
    <>
      {detail !== "dot" && (
        <BaseEdge
          id={`${props.id}-halo`}
          path={path}
          style={{
            stroke: "var(--bg)",
            strokeWidth: style.width + 3.6,
            strokeOpacity: opacity * 0.75,
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: style.color,
          strokeWidth: style.width,
          strokeOpacity: opacity,
          fill: "none",
          strokeDasharray: style.dash,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      {detail !== "dot" && (
        <circle cx={targetX} cy={targetY} r={isHi ? 2.8 : 1.8} fill={style.color} opacity={opacity} />
      )}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: style.color,
              boxShadow: "var(--shadow-1)",
            }}
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
