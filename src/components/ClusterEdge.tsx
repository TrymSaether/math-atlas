import { BaseEdge, getBezierPath, type EdgeProps } from "reactflow";
import type { ClusterEdgeData } from "../lib/layout";

export function ClusterEdge(props: EdgeProps<ClusterEdgeData>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const weight = data?.weight ?? 1;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: data?.sourceColor ?? "var(--fg-4)",
        strokeWidth: Math.min(1.2 + Math.sqrt(weight), 5),
        strokeOpacity: 0.28,
        fill: "none",
      }}
    />
  );
}
