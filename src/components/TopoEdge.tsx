import { BaseEdge, getBezierPath, type EdgeProps } from "reactflow";
import { EDGE_COLOR, EDGE_COLOR_HIGHLIGHT } from "../types";

interface Data {
  dim?: boolean;
  highlight?: boolean;
}

export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  const isHi = !!data?.highlight;
  const stroke = isHi ? EDGE_COLOR_HIGHLIGHT : EDGE_COLOR;
  const width = isHi ? 1.6 : 1;
  const opacity = data?.dim ? 0.4 : 1;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke,
          strokeWidth: width,
          strokeOpacity: opacity,
          fill: "none",
        }}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={isHi ? 2.4 : 1.6}
        fill={stroke}
        opacity={opacity}
      />
    </>
  );
}
