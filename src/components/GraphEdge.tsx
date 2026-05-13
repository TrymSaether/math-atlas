import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import type { GraphEdge as GraphEdgeT } from "../types";
import { getRelationStyle } from "../lib/relationStyle";

interface Data {
  edge: GraphEdgeT;
  dim?: boolean;
  highlight?: boolean;
}

export function GraphEdgeView(props: EdgeProps<Data>) {
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
          strokeDasharray: style.dash,
          filter: data?.highlight ? `drop-shadow(0 0 6px ${style.color})` : undefined,
        }}
      />
      {data?.highlight && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              pointerEvents: "none",
            }}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-[var(--text-soft)] backdrop-blur"
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
