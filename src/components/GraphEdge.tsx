import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "reactflow";
import type { GraphEdge as GraphEdgeT } from "../types";
import { getRelationStyle } from "../lib/relationStyle";

interface Data {
  edge: GraphEdgeT;
  dim?: boolean;
  highlight?: boolean;
  route?: boolean;
}

export function GraphEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: data?.route || data?.highlight ? 18 : 12,
    offset: data?.route ? 34 : 26,
  });
  const e = data?.edge;
  const style = getRelationStyle(e?.relation ?? "relation", Boolean(data?.highlight), Boolean(data?.dim), Boolean(data?.route));

  return (
    <>
      {(data?.highlight || data?.route) && (
        <BaseEdge
          id={`${props.id}-underlay`}
          path={path}
          style={{
            stroke: style.underlayColor,
            strokeWidth: style.width + 7,
            strokeOpacity: style.underlayOpacity,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "none",
          }}
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        style={{
          stroke: style.color,
          strokeWidth: style.width,
          strokeOpacity: style.opacity,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: style.dash,
          filter: data?.highlight || data?.route ? "var(--edge-highlight-shadow)" : undefined,
        }}
      />
      {(data?.highlight || data?.route) && (
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
            {data?.route ? "route" : style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
