import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "reactflow";
import { getEdgeStyle } from "../lib/relationStyle";
import { useStore } from "../store";
import type { GraphEdge } from "../types";

const FALLBACK_EDGE = { relation: "relation", dependencyClass: "" };

interface Data {
  edge?: GraphEdge;
  dim?: boolean;
  highlight?: boolean;
}

/**
 * Each edge declares its own <marker> so the arrowhead inherits the edge color.
 * Marker ids are namespaced by edge id to avoid SVG id collisions.
 */
export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const edgeStyle = useStore((s) => s.edgeStyle);
  const geom = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [path, labelX, labelY] =
    edgeStyle === "straight"
      ? getStraightPath(geom)
      : edgeStyle === "bezier"
        ? getBezierPath(geom)
        : getSmoothStepPath({ ...geom, borderRadius: 14 });

  const style = getEdgeStyle(data?.edge ?? FALLBACK_EDGE, Boolean(data?.highlight), Boolean(data?.dim));
  const highlight = Boolean(data?.highlight);
  const dim = Boolean(data?.dim);
  const markerId = `arrow-${props.id}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth={highlight ? 6 : 5}
          markerHeight={highlight ? 6 : 5}
          orient="auto-start-reverse"
        >
          <path
            d="M0,0 L10,5 L0,10 z"
            fill={style.color}
            opacity={style.opacity}
          />
        </marker>
      </defs>
      {highlight && (
        <path
          d={path}
          fill="none"
          stroke="var(--bg)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={style.width + 3.2}
          strokeOpacity={0.92}
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: style.color,
          strokeWidth: style.width,
          strokeOpacity: style.opacity,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: style.dash,
          fill: "none",
        }}
      />
      {!dim && highlight && (
        <EdgeLabelRenderer>
          <div
            className="rounded-pill border px-2 py-0.5 text-[9px] font-bold uppercase shadow-[var(--shadow-1)]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: style.color,
            }}
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
