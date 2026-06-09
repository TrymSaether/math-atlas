import { useEffect, useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "reactflow";
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
    const anim = el.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 300, delay: route.delay, easing: "cubic-bezier(0.22,0.61,0.36,1)", fill: "both" },
    );
    return () => anim.cancel();
  }, [route?.runKey, route?.delay]);

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
            className="rounded-[var(--radius-xs)] border px-2 py-0.5 text-edge-label font-bold uppercase tracking-label-tight shadow-[var(--shadow-1)]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "var(--surface)",
              borderColor: "color-mix(in srgb, var(--edge-highlight) 35%, var(--border))",
              color: "var(--edge-highlight)",
            }}
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
