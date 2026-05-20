import { BaseEdge, getBezierPath, type EdgeProps } from "reactflow";
import { memo } from "react";
import type { ClusterEdgeData } from "../lib/layout";

function ClusterEdgeComponent(props: EdgeProps<ClusterEdgeData>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  // High curvature pushes inter-cluster edges outward so they arc around
  // bubble interiors instead of cutting through them.
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.75,
  });

  const weight = data?.weight ?? 1;
  // Tighter log scale — the eye reads thickness ratios, not absolute counts.
  const strokeWidth = Math.min(5, 1 + Math.log2(weight + 1) * 0.7);
  const opacity = Math.min(0.32, 0.1 + Math.log2(weight + 1) * 0.04);

  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: data?.sourceColor ?? "var(--primary)",
        strokeWidth,
        strokeOpacity: opacity,
        strokeLinecap: "round",
        fill: "none",
      }}
    />
  );
}

export const ClusterEdge = memo(ClusterEdgeComponent);
