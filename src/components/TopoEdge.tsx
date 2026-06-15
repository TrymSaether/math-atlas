import { useEffect, useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "reactflow";
import { edgeLabel } from "../data/relations";
import { getEdgeStyle } from "../lib/relationStyle";
import { prefersReducedMotion } from "../lib/utils";
import { useStore } from "../store";
import type { GraphEdge } from "../types";

const FALLBACK_EDGE = { relation: "relation", isDependency: false };

interface RouteReveal {
  delay: number;
  runKey: number;
  color: string;
}

interface Data {
  edge?: GraphEdge;
  dim?: boolean;
  highlight?: boolean;
  routeReveal?: RouteReveal;
}

/**
 * Each edge declares its own <marker> so the arrowhead inherits the edge color.
 * Marker ids are namespaced by edge id to avoid SVG id collisions.
 */
export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const edgeStyle = useStore((s) => s.edgeStyle);
  const edgeLabelStyle = useStore((s) => s.edgeLabelStyle);
  const geom = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [path, labelX, labelY] =
    edgeStyle === "straight"
      ? getStraightPath(geom)
      : edgeStyle === "bezier"
        ? getBezierPath(geom)
        : getSmoothStepPath({ ...geom, borderRadius: 14 });

  const style = getEdgeStyle(
    data?.edge ?? FALLBACK_EDGE,
    Boolean(data?.highlight),
    Boolean(data?.dim),
  );
  const highlight = Boolean(data?.highlight);
  const dim = Boolean(data?.dim);
  const markerId = `arrow-${props.id}`;
  // Blueprint head grammar: the marker SHAPE encodes the relation family. Sized in
  // user space so heads keep a constant footprint regardless of stroke weight.
  const markerSize = highlight ? 13 : 11;

  // Route traversal: reveal this segment with a staggered dash-draw. pathLength=1
  // normalizes the path so a single dashoffset 1→0 reveals it regardless of length.
  const route = data?.routeReveal;
  const revealRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const el = revealRef.current;
    if (!el || !route) return;
    if (prefersReducedMotion()) {
      el.style.strokeDashoffset = "0";
      return;
    }
    const anim = el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 300,
      delay: route.delay,
      easing: "cubic-bezier(0.22,0.61,0.36,1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [route?.runKey, route?.delay]);

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 12 12"
          refX={style.marker === "circle" ? 6 : 9}
          refY="6"
          markerWidth={markerSize}
          markerHeight={markerSize}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          {style.marker === "triangle" ? (
            <path d="M2,2 L10,6 L2,10 z" fill={style.color} opacity={style.opacity} />
          ) : style.marker === "open-triangle" ? (
            <path
              d="M2.4,2.4 L10.4,6 L2.4,9.6 z"
              fill="var(--surface)"
              stroke={style.color}
              strokeWidth={1.4}
              strokeLinejoin="round"
              opacity={style.opacity}
            />
          ) : (
            <circle
              cx="6"
              cy="6"
              r="3.2"
              fill="var(--surface)"
              stroke={style.color}
              strokeWidth={1.4}
              opacity={style.opacity}
            />
          )}
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
        // Symmetric relations (related_to) carry no direction — mirror the open
        // circle onto the start so the edge reads as a mutual association.
        markerStart={style.symmetric ? `url(#${markerId})` : undefined}
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
      {/* Junction tick — where backbone edges leave their prerequisite. Soft edges
          stay tick-less so the overlay reads as lighter than the structure. */}
      {style.family !== "soft" && !dim && (
        <circle
          cx={sourceX}
          cy={sourceY}
          r={highlight ? 2.6 : 1.8}
          fill={style.color}
          fillOpacity={highlight ? 0.95 : Math.min(1, style.opacity + 0.18)}
        />
      )}
      {route && (
        <path
          key={route.runKey}
          ref={revealRef}
          d={path}
          fill="none"
          stroke={route.color}
          strokeWidth={Math.max(style.width + 1.6, 2.6)}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: "1 1",
            strokeDashoffset: 1,
            filter: "drop-shadow(0 0 3px var(--accent))",
          }}
        />
      )}
      {!dim && highlight && (
        <EdgeLabelRenderer>
          <div
            className="rounded-[var(--radius-xs)] border px-2 py-0.5 text-edge-label font-medium lowercase tracking-label-tight shadow-[var(--shadow-1)]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "var(--surface)",
              borderColor: "color-mix(in srgb, var(--edge-highlight) 35%, var(--border))",
              color: "var(--edge-highlight)",
            }}
          >
            {edgeLabel(
              data?.edge?.relation ?? FALLBACK_EDGE.relation,
              data?.edge?.isDependency ?? FALLBACK_EDGE.isDependency,
              edgeLabelStyle,
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
