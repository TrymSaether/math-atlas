import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import { memo } from "react";
import type { ClusterEdgeData } from "../lib/layout";

function ClusterEdgeComponent(props: EdgeProps<ClusterEdgeData>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  const weight = data?.weight ?? 1;
  // Log scale keeps a giant 80-edge link from drowning out the rest.
  const strokeWidth = Math.min(8, 1.5 + Math.log2(weight + 1) * 1.2);
  const opacity = Math.min(0.55, 0.18 + Math.log2(weight + 1) * 0.06);

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: data?.sourceColor ?? "var(--primary)",
          strokeWidth,
          strokeOpacity: opacity,
          strokeLinecap: "round",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
          className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-[var(--muted)] shadow-[var(--shadow-1)]"
        >
          {weight}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const ClusterEdge = memo(ClusterEdgeComponent);
