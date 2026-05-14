import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import { memo } from "react";
import type { GraphEdge as GraphEdgeT } from "../types";
import { getRelationStyle } from "../lib/relationStyle";

interface Data {
  edge: GraphEdgeT;
  dim?: boolean;
  highlight?: boolean;
}

function GraphEdgeViewComponent(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const e = data?.edge;
  const style = getRelationStyle(e?.relation ?? "relation", Boolean(data?.highlight), Boolean(data?.dim));

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: style.color,
          strokeWidth: style.width,
          strokeOpacity: style.opacity,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: style.dash,
          filter: data?.highlight ? "var(--edge-highlight-shadow)" : undefined,
        }}
      />
      {data?.highlight && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
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

// Memoize to prevent unnecessary re-renders
export const GraphEdgeView = memo(GraphEdgeViewComponent);
