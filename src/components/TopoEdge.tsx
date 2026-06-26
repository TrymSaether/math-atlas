import { useEffect, useRef, type ReactNode, type Ref } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "reactflow";
import { edgeLabel, edgeOperator } from "../data/relations";
import { getEdgeVisual, type EdgeVisual } from "../lib/relationStyle";
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
  /** True once the canvas is zoomed in enough to show mid-edge annotations. */
  labelZoomOk?: boolean;
}

interface Geom {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  /** Unit direction source→target and its perpendicular, for skin geometry. */
  ux: number;
  uy: number;
  px: number;
  py: number;
}

/**
 * One edge, drawn in the active "skin". The relation type is encoded by the
 * stroke morphology (and, optionally, a math-operator chip) rather than hue —
 * color stays reserved for domains. The five skins:
 *
 *  • flow      — cartographic streamlines; a fade gradient gives direction.
 *  • ink       — calligraphic nib strokes; direction reads from the taper.
 *  • notation  — quiet hairline; the operator chip carries the relation.
 *  • glass     — engraved grooves / floating threads (the Liquid-Glass language).
 *  • typed     — the imported design's typed connections, recolored to the
 *                math-atlas palette (the one skin that uses hue).
 *
 * Selected edges share one accent highlight render, and dimmed edges collapse to
 * a faint hairline, so per-skin geometry only runs in the common resting state.
 */
export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const edgeStyle = useStore((s) => s.edgeStyle);
  const edgeSkin = useStore((s) => s.edgeSkin);
  const edgeAnnotation = useStore((s) => s.edgeAnnotation);
  const edgeLabelStyle = useStore((s) => s.edgeLabelStyle);

  const geom = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [path, labelX, labelY] =
    edgeStyle === "straight"
      ? getStraightPath(geom)
      : edgeStyle === "bezier"
        ? getBezierPath(geom)
        : getSmoothStepPath({ ...geom, borderRadius: 14 });

  const edge = data?.edge ?? FALLBACK_EDGE;
  const highlight = Boolean(data?.highlight);
  const dim = Boolean(data?.dim);
  const vis = getEdgeVisual(edgeSkin, edge, highlight, dim);

  // SVG ids must survive in url(#…); edge ids can carry "::"/"->".
  const uid = props.id.replace(/[^a-zA-Z0-9_-]/g, "_");

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.hypot(dx, dy) || 1;
  const g: Geom = {
    sourceX,
    sourceY,
    targetX,
    targetY,
    ux: dx / len,
    uy: dy / len,
    px: -dy / len,
    py: dx / len,
  };

  // Route traversal reveal (staggered dash-draw). pathLength=1 normalizes the
  // path so a single dashoffset 1→0 reveals it regardless of length.
  const route = data?.routeReveal;
  const revealRef = useRef<SVGPathElement>(null);
  const routeRunKey = route?.runKey;
  const routeDelay = route?.delay;
  useEffect(() => {
    const el = revealRef.current;
    if (!el || routeRunKey === undefined || routeDelay === undefined) return;
    if (prefersReducedMotion()) {
      el.style.strokeDashoffset = "0";
      return;
    }
    const anim = el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 300,
      delay: routeDelay,
      easing: "cubic-bezier(0.22,0.61,0.36,1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [routeRunKey, routeDelay]);

  const showAnnotation =
    edgeAnnotation !== "off" && !dim && (highlight || Boolean(data?.labelZoomOk));

  return (
    <>
      {/* Active edges keep their skin morphology (the skin renderers read the
          highlighted `vis`, so they redraw in the accent at heavier weight); a bg
          casing underneath lifts them off neighbours. Dimmed edges collapse to a
          quiet hairline. */}
      {highlight && (
        <path
          d={path}
          fill="none"
          stroke="var(--bg)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={vis.width + 3.2}
          strokeOpacity={0.92}
        />
      )}
      {dim ? (
        <path d={path} fill="none" stroke={vis.color} strokeWidth={vis.width} strokeOpacity={vis.opacity} />
      ) : (
        <SkinEdge skin={edgeSkin} path={path} vis={vis} g={g} uid={uid} highlight={highlight} />
      )}

      {route && (
        <RouteTrail revealRef={revealRef} runKey={route.runKey} path={path} color={route.color} width={vis.width} />
      )}

      {showAnnotation && (
        <EdgeLabelRenderer>
          <div
            className={
              edgeAnnotation === "operators"
                ? "atlas-edge-op"
                : "rounded-xs border px-2 py-0.5 text-caption-2 font-medium lowercase tracking-label-tight shadow-[var(--shadow-1)]"
            }
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "var(--surface)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: highlight
                ? "color-mix(in srgb, var(--edge-highlight) 35%, var(--border))"
                : "var(--border)",
              color: highlight ? "var(--edge-highlight)" : "var(--fg-2)",
            }}
          >
            {edgeAnnotation === "operators"
              ? edgeOperator(edge.relation, edge.isDependency)
              : edgeLabel(edge.relation, edge.isDependency, edgeLabelStyle)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/**
 * The learning route, redrawn over an edge. A soft "highlighter" casing shows
 * the whole path at rest; a crisp core draws on in study order (the staggered
 * dash-reveal). Deliberately flat — no blur/glow — and a distinct hue from the
 * active-edge accent so "the path you walk" never reads as just another
 * selection. The casing is theme-flat so it works on paper and chalkboard.
 */
function RouteTrail({
  revealRef,
  runKey,
  path,
  color,
  width,
}: {
  revealRef: Ref<SVGPathElement>;
  runKey: number;
  path: string;
  color: string;
  width: number;
}) {
  const core = Math.max(width + 2, 3);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} stroke={color} strokeOpacity={0.16} strokeWidth={core + 3} />
      <path
        key={runKey}
        ref={revealRef}
        d={path}
        stroke={color}
        strokeWidth={core}
        pathLength={1}
        style={{ strokeDasharray: "1 1", strokeDashoffset: 1 }}
      />
    </g>
  );
}

function SkinEdge({
  skin,
  path,
  vis,
  g,
  uid,
  highlight,
}: {
  skin: string;
  path: string;
  vis: EdgeVisual;
  g: Geom;
  uid: string;
  highlight: boolean;
}) {
  switch (skin) {
    case "ink":
      return <InkEdge path={path} vis={vis} g={g} />;
    case "notation":
      return <NotationEdge path={path} vis={vis} g={g} />;
    case "glass":
      return <GlassEdge path={path} vis={vis} g={g} uid={uid} />;
    case "typed":
      return <TypedEdge path={path} vis={vis} uid={uid} />;
    case "flow":
    default:
      return <FlowEdge path={path} vis={vis} g={g} uid={uid} highlight={highlight} />;
  }
}

/** A second stroke translated along the perpendicular — the "double rule". */
function parallel(path: string, g: Geom, offset: number): ReactNode {
  return <path d={path} transform={`translate(${g.px * offset} ${g.py * offset})`} />;
}

/* ---- Flow: cartographic streamlines, direction by fade gradient ---------- */
function FlowEdge({
  path,
  vis,
  g,
  uid,
  highlight,
}: {
  path: string;
  vis: EdgeVisual;
  g: Geom;
  uid: string;
  highlight: boolean;
}) {
  const gradId = `flow-${uid}`;
  // Keep direction legible even when active by lifting the faded (source) end.
  const faint = vis.opacity * (highlight ? 0.5 : 0.12);
  if (vis.kind === "equivalence") {
    return (
      <g fill="none" stroke={vis.color} strokeOpacity={vis.opacity} strokeWidth={1} strokeLinecap="round">
        {parallel(path, g, 1.6)}
        {parallel(path, g, -1.6)}
      </g>
    );
  }
  if (vis.kind === "association") {
    return (
      <path
        d={path}
        fill="none"
        stroke={vis.color}
        strokeWidth={vis.width}
        strokeOpacity={vis.opacity}
        strokeDasharray={vis.dash}
        strokeLinecap="round"
      />
    );
  }
  return (
    <>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={g.sourceX}
          y1={g.sourceY}
          x2={g.targetX}
          y2={g.targetY}
        >
          <stop offset="0" stopColor={vis.color} stopOpacity={faint} />
          <stop offset="1" stopColor={vis.color} stopOpacity={vis.opacity} />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={vis.width}
        strokeDasharray={vis.dash}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {vis.kind === "generalization" && <Estuary g={g} color={vis.color} opacity={vis.opacity} />}
    </>
  );
}

/** Two short diverging strokes near the target — the "widening estuary". */
function Estuary({ g, color, opacity }: { g: Geom; color: string; opacity: number }) {
  const baseX = g.targetX - g.ux * 13;
  const baseY = g.targetY - g.uy * 13;
  const spread = 5;
  return (
    <g stroke={color} strokeOpacity={opacity} strokeWidth={1.3} strokeLinecap="round">
      <line x1={baseX} y1={baseY} x2={g.targetX + g.px * spread} y2={g.targetY + g.py * spread} />
      <line x1={baseX} y1={baseY} x2={g.targetX - g.px * spread} y2={g.targetY - g.py * spread} />
    </g>
  );
}

/* ---- Ink: calligraphic nib; direction reads from the taper ---------------- */
function InkEdge({ path, vis, g }: { path: string; vis: EdgeVisual; g: Geom }) {
  if (vis.kind === "equivalence") {
    return (
      <g fill="none" stroke={vis.color} strokeOpacity={vis.opacity} strokeWidth={1} strokeLinecap="round">
        {parallel(path, g, 1.5)}
        {parallel(path, g, -1.5)}
      </g>
    );
  }
  if (vis.kind === "association") {
    return <path d={path} fill="none" stroke={vis.color} strokeWidth={vis.width} strokeOpacity={vis.opacity} />;
  }
  if (vis.kind === "soft") {
    return (
      <path
        d={path}
        fill="none"
        stroke={vis.color}
        strokeWidth={vis.width}
        strokeOpacity={vis.opacity}
        strokeDasharray="0.5 5"
        strokeLinecap="round"
      />
    );
  }
  // Backbone / generalization: a pronounced nib taper, faked with stacked
  // dash-clipped strokes (thick at the source/prerequisite, thinning toward the
  // dependent) plus a round nib at the origin — calligraphic, direction-by-taper.
  const w = vis.width;
  return (
    <g fill="none" stroke={vis.color} strokeOpacity={vis.opacity} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} strokeWidth={w * 2.6} pathLength={100} strokeDasharray="20 100" />
      <path d={path} strokeWidth={w * 1.7} pathLength={100} strokeDasharray="48 100" />
      <path d={path} strokeWidth={w * 0.85} />
      <circle
        cx={g.sourceX}
        cy={g.sourceY}
        r={w * 1.45}
        stroke="none"
        fill={vis.color}
        fillOpacity={Math.min(1, vis.opacity + 0.22)}
      />
      {vis.kind === "generalization" && <Estuary g={g} color={vis.color} opacity={vis.opacity} />}
    </g>
  );
}

/* ---- Notation: quiet hairline; the operator chip is the star ------------- */
function NotationEdge({ path, vis, g }: { path: string; vis: EdgeVisual; g: Geom }) {
  if (vis.kind === "equivalence") {
    return (
      <g fill="none" stroke={vis.color} strokeOpacity={vis.opacity} strokeWidth={1} strokeLinecap="round">
        {parallel(path, g, 1.4)}
        {parallel(path, g, -1.4)}
      </g>
    );
  }
  return (
    <path
      d={path}
      fill="none"
      stroke={vis.color}
      strokeWidth={vis.width}
      strokeOpacity={vis.opacity}
      strokeDasharray={vis.kind === "association" ? "5 5" : vis.dash}
      strokeLinecap="round"
    />
  );
}

/* ---- Glass: engraved grooves / floating threads -------------------------- */
function GlassEdge({ path, vis, g, uid }: { path: string; vis: EdgeVisual; g: Geom; uid: string }) {
  const gradId = `glass-${uid}`;
  // vis.color is the neutral ink at rest and the accent when active, so the
  // engraving simply re-tints when an edge becomes active.
  const shadow = vis.color;
  const light = "var(--edge-glass-light)";

  if (vis.kind === "equivalence") {
    // Raised glass conduit: a translucent body with a bright top lip.
    return (
      <g fill="none" strokeLinecap="round">
        <path d={path} stroke={shadow} strokeOpacity={0.22} strokeWidth={5} />
        <path d={path} stroke={light} strokeOpacity={0.6} strokeWidth={1.4} transform={`translate(${g.px * -1} ${g.py * -1})`} />
      </g>
    );
  }
  if (vis.kind === "soft") {
    // Floating luminous thread: a soft wide underglow + a crisp filament.
    return (
      <g fill="none" strokeLinecap="round">
        <path d={path} stroke={shadow} strokeOpacity={0.1} strokeWidth={4} />
        <path d={path} stroke={shadow} strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray={vis.dash} />
      </g>
    );
  }
  // Backbone / generalization / association: engrave a groove (a shadow line
  // with a light bevel just beneath). Direction fades in along the groove.
  const groove = (offset: number) => (
    <g key={offset} fill="none" strokeLinecap="round">
      <path
        d={path}
        stroke={`url(#${gradId})`}
        strokeWidth={1.9}
        transform={`translate(${g.px * offset} ${g.py * offset})`}
      />
      <path
        d={path}
        stroke={light}
        strokeOpacity={0.85}
        strokeWidth={1.1}
        transform={`translate(${g.px * offset} ${g.py * offset + 1.4})`}
      />
    </g>
  );
  return (
    <>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={g.sourceX}
          y1={g.sourceY}
          x2={g.targetX}
          y2={g.targetY}
        >
          <stop offset="0" stopColor={shadow} stopOpacity={0.32} />
          <stop offset="1" stopColor={shadow} stopOpacity={0.66} />
        </linearGradient>
      </defs>
      {vis.kind === "generalization" ? [groove(1.6), groove(-1.6)] : groove(0)}
    </>
  );
}

/* ---- Typed: the imported system, recolored to math-atlas hues ------------ */
function TypedEdge({ path, vis, uid }: { path: string; vis: EdgeVisual; uid: string }) {
  const directional = vis.kind === "backbone" || vis.kind === "generalization" || vis.kind === "soft";
  const markerId = `typed-${uid}`;
  const headWide = vis.kind === "generalization";
  return (
    <>
      {directional && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 12 12"
            refX={9}
            refY="6"
            markerWidth={headWide ? 11 : 9}
            markerHeight={headWide ? 11 : 9}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M2,2 L10,6 L2,10 z" fill={vis.color} opacity={vis.opacity} />
          </marker>
        </defs>
      )}
      {/* White halo so crossings read cleanly (per the imported spec). */}
      <path d={path} fill="none" stroke="var(--bg)" strokeWidth={vis.width + 2} strokeOpacity={0.85} />
      <path
        d={path}
        fill="none"
        stroke={vis.color}
        strokeWidth={vis.width}
        strokeOpacity={vis.opacity}
        strokeDasharray={vis.dash}
        strokeLinecap={vis.dash ? "round" : "butt"}
        markerEnd={directional ? `url(#${markerId})` : undefined}
      />
    </>
  );
}
