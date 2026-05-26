import { BaseEdge, getSmoothStepPath, type EdgeProps } from "reactflow";

interface Data {
  weight: number;
  sourceColor: string;
  targetColor: string;
}

export function ClusterEdge(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
  });
  const weight = Math.max(1, data?.weight ?? 1);
  const width = Math.min(5.5, 1.2 + Math.log2(weight + 1));
  const source = data?.sourceColor ?? "var(--accent)";
  const target = data?.targetColor ?? "var(--fg-3)";

  return (
    <>
      <BaseEdge
        id={`${props.id}-halo`}
        path={path}
        style={{
          stroke: "var(--bg)",
          strokeWidth: width + 4,
          strokeOpacity: 0.72,
          fill: "none",
        }}
      />
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: `color-mix(in srgb, ${source} 58%, ${target})`,
          strokeWidth: width,
          strokeOpacity: 0.55,
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
    </>
  );
}
