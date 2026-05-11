import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import type { TopoEdge as TopoEdgeT } from "../types";
import { RELATION_COLOR } from "../types";

interface Data {
  edge: TopoEdgeT;
  dim?: boolean;
  highlight?: boolean;
}

export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const e = data?.edge;
  const color = e ? RELATION_COLOR[e.relation] : "#5ce1ff";
  const opacity = data?.dim ? 0.08 : data?.highlight ? 0.95 : 0.35;
  const width = data?.highlight ? 2.2 : 1.2;
  const dash = e?.relation === "proof" ? "5 4" : e?.relation === "illustration" ? "1 4" : undefined;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: width,
          strokeOpacity: opacity,
          strokeDasharray: dash,
          filter: data?.highlight ? `drop-shadow(0 0 6px ${color})` : undefined,
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
            className="rounded-full border border-white/15 bg-ink-900/80 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/80 backdrop-blur"
          >
            {e?.relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
