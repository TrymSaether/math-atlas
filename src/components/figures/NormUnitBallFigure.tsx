import { useMemo, useState } from "react";

import { MathText } from "../../lib/katex";
import {
  Circle,
  DIA,
  DOT,
  FigureCaption,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  Polyline,
  STROKE,
  UI,
  Vector,
  type Vec2,
} from "./FigureFrame";
import { useMovablePoint } from "./mafs";

type NormKind = "l2" | "l1" | "linf" | "lp";

const MODES: { kind: NormKind; label: string; aria: string }[] = [
  { kind: "l2", label: "$\\ell^2$", aria: "Euclidean l two norm" },
  { kind: "l1", label: "$\\ell^1$", aria: "Taxicab l one norm" },
  { kind: "linf", label: "$\\ell^\\infty$", aria: "Maximum l infinity norm" },
  { kind: "lp", label: "$\\ell^p$", aria: "Tunable l p norm" },
];

const MODE_NAMES: Record<NormKind, string> = {
  l2: "Euclidean",
  l1: "Taxicab",
  linf: "Maximum",
  lp: "Tunable",
};

const VIEW_MIN = -2.35;
const VIEW_MAX = 2.35;
const UNIT_RADIUS = 1;
const FIGURE_HEIGHT = 255;
const REGION_FILL_OPACITY = 0.1;
const SCALED_REGION_OPACITY = 0.035;
const SCALED_OUTLINE_OPACITY = 0.72;
const MEASURED_STROKE = STROKE.curve;
const P_MIN = 1;
const P_MAX = 12;
const P_STEP = 0.1;
const AXIS_X: [Vec2, Vec2] = [
  [-2.25, 0],
  [2.25, 0],
];
const AXIS_Y: [Vec2, Vec2] = [
  [0, -1.95],
  [0, 1.95],
];

function clamp(value: number, min = VIEW_MIN, max = VIEW_MAX): number {
  return Math.min(max, Math.max(min, value));
}

function normValue([x, y]: Vec2, kind: NormKind, p: number): number {
  if (kind === "l1") return Math.abs(x) + Math.abs(y);
  if (kind === "linf") return Math.max(Math.abs(x), Math.abs(y));
  if (kind === "lp") return (Math.abs(x) ** p + Math.abs(y) ** p) ** (1 / p);
  return Math.hypot(x, y);
}

function lpBoundary(p: number, steps = 160): Vec2[] {
  return Array.from({ length: steps }, (_, i) => {
    const theta = (i / steps) * 2 * Math.PI;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const radius = (Math.abs(c) ** p + Math.abs(s) ** p) ** (-1 / p);
    return [radius * c, radius * s];
  });
}

function unitBallPoints(kind: NormKind, p: number): Vec2[] {
  if (kind === "l1")
    return [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
  if (kind === "linf")
    return [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
  return lpBoundary(kind === "lp" ? p : 2);
}

function scalePoints(points: Vec2[], scale: number): Vec2[] {
  return points.map(([x, y]) => [x * scale, y * scale]);
}

function closedPolyline(points: Vec2[]): Vec2[] {
  return points.length > 0 ? [...points, points[0]] : points;
}

function normSubscript(mode: NormKind, p: number): string {
  if (mode === "lp") return p.toFixed(p % 1 === 0 ? 0 : 1);
  if (mode === "linf") return "\\infty";
  if (mode === "l1") return "1";
  return "2";
}

function formatCoord(value: number): string {
  return value.toFixed(1);
}

function NormModeSelect({
  value,
  onChange,
  p,
  onPChange,
}: {
  value: NormKind;
  onChange: (kind: NormKind) => void;
  p: number;
  onPChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="Norm type"
        className="inline-flex w-fit flex-wrap gap-1 rounded-md border p-1"
        style={{ borderColor: UI.border, background: UI.panel }}
      >
        {MODES.map((mode) => {
          const active = mode.kind === value;
          return (
            <div
              key={mode.kind}
              role="radio"
              aria-checked={active}
              aria-label={mode.aria}
              tabIndex={0}
              onClick={() => onChange(mode.kind)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(mode.kind);
                }
              }}
              className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-caption-1 transition-colors focus:outline-none focus:ring-2 focus:ring-(--accent-border)"
              style={{
                background: active ? DIA.accent : "transparent",
                color: active ? UI.onColor : UI.text,
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="shrink-0">
                <MathText text={mode.label} />
              </span>
              {mode.kind === "lp" && active && (
                <>
                  <input
                    type="range"
                    min={P_MIN}
                    max={P_MAX}
                    step={P_STEP}
                    value={p}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onPChange(Number(event.target.value))}
                    className="h-1 w-20 cursor-pointer appearance-none rounded-full"
                    style={{
                      accentColor: UI.onColor,
                      background: UI.onColorSoft,
                    }}
                    aria-label="Tunable lp exponent"
                  />
                  <span className="min-w-7 text-right tabular-nums">{formatCoord(p)}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadoutPanel({ point, value, mode, p }: { point: Vec2; value: number; mode: NormKind; p: number }) {
  const inside = value <= 1 + 1e-6;
  const subscript = normSubscript(mode, p);
  const statusColor = inside ? DIA.ok : DIA.alert;
  const comparator = inside ? "\\le" : ">";
  const ball = `B_{${subscript}}`;

  return (
    <aside
      className="flex min-w-52 flex-1 flex-col rounded-md border p-3"
      style={{ borderColor: UI.border, background: UI.panel }}
      aria-live="polite"
    >
      <div className="mt-2 text-caption-1" style={{ color: UI.text }}>
        <MathText text={`${MODE_NAMES[mode]} $\\ell^{${subscript}}$`} />
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-caption-1" style={{ color: UI.text }}>
        <span>
          <MathText text="$x=$" />
        </span>
        <span className="tabular-nums" style={{ color: DIA.ink }}>
          ({point[0].toFixed(2)}, {point[1].toFixed(2)})
        </span>
        <span>
          <MathText text={`$\\|x\\|_{${subscript}}=$`} />
        </span>
        <span className="tabular-nums" style={{ color: statusColor }}>
          {value.toFixed(3)}
        </span>
        <span>
          <MathText text={`$${ball}=$`} />
        </span>
        <span style={{ color: DIA.ink }}>
          <MathText text={`$\\{z:\\|z\\|_{${subscript}}\\le 1\\}$`} />
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full" style={{ background: UI.sunken }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (value / 2.5) * 100)}%`,
            background: statusColor,
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-caption-1" style={{ color: UI.text }}>
        <span style={{ color: statusColor }}>
          <MathText text={inside ? `$x\\in ${ball}$` : `$x\\notin ${ball}$`} />
        </span>
        <span>
          <MathText text={`$${value.toFixed(3)} ${comparator} 1$`} />
        </span>
      </div>
      <div className="mt-3 border-t pt-2 text-caption-1" style={{ borderColor: UI.border, color: UI.text }}>
        <MathText
          text={`The solid outline is $\\|x\\|_{${subscript}}B_{${subscript}}$: the unit ball scaled until it reaches $x$.`}
        />
      </div>
    </aside>
  );
}

export default function NormUnitBallFigure() {
  const [mode, setMode] = useState<NormKind>("linf");
  const [p, setP] = useState(3);
  const point = useMovablePoint([1.4, -0.7], {
    color: DIA.accent,
    constrain: ([x, y]) => [clamp(x), clamp(y)],
  });
  const x: Vec2 = [point.x, point.y];
  const value = normValue(x, mode, p);
  const inside = value <= 1 + 1e-6;
  const ball = useMemo(() => unitBallPoints(mode, p), [mode, p]);
  const scaledBall = useMemo(() => scalePoints(ball, Math.max(value, UNIT_RADIUS)), [ball, value]);
  const scaledOutline = useMemo(() => closedPolyline(scaledBall), [scaledBall]);
  const statusColor = inside ? DIA.ok : DIA.alert;
  const scaledOutlineColor = DIA.alert;

  return (
    <figure className="m-0">
      <NormModeSelect value={mode} onChange={setMode} p={p} onPChange={setP} />
      <div className="mt-3 flex flex-col gap-3 2xl:flex-row">
        <div className="min-w-0 flex-[1.35]">
          <FigureFrame xDomain={[-2.4, 2.4]} yDomain={[-2.1, 2.1]} height={FIGURE_HEIGHT} axes={false} grid>
            {mode === "l2" ? (
              <Circle
                center={[0, 0]}
                radius={Math.max(value, UNIT_RADIUS)}
                color={scaledOutlineColor}
                fillOpacity={SCALED_REGION_OPACITY}
                strokeOpacity={SCALED_OUTLINE_OPACITY}
                weight={STROKE.mark}
              />
            ) : (
              <Polyline
                points={scaledOutline}
                color={scaledOutlineColor}
                fillOpacity={SCALED_REGION_OPACITY}
                strokeOpacity={SCALED_OUTLINE_OPACITY}
                weight={STROKE.mark}
              />
            )}
            {mode === "l2" ? (
              <Circle
                center={[0, 0]}
                radius={UNIT_RADIUS}
                color={DIA.codomain}
                fillOpacity={REGION_FILL_OPACITY}
                strokeOpacity={1}
                weight={STROKE.ref}
              />
            ) : (
              <Polygon
                points={ball}
                color={DIA.codomain}
                fillOpacity={REGION_FILL_OPACITY}
                strokeOpacity={1}
                weight={STROKE.ref}
              />
            )}
            <Line.Segment point1={AXIS_X[0]} point2={AXIS_X[1]} color={DIA.muted} weight={STROKE.guide} />
            <Line.Segment point1={AXIS_Y[0]} point2={AXIS_Y[1]} color={DIA.muted} weight={STROKE.guide} />
            <Vector tail={[0, 0]} tip={x} color={statusColor} weight={MEASURED_STROKE} />
            <Point x={0} y={0} color={DIA.faint} svgCircleProps={{ r: DOT.small }} />
            <LaTeX at={[x[0] + 0.17, x[1] + 0.17]} tex="x" color={DIA.accent} />
            {point.element}
          </FigureFrame>
        </div>
        <ReadoutPanel point={x} value={value} mode={mode} p={p} />
      </div>
      <FigureCaption className="mt-2">
        <MathText text="Drag $x$ or switch norms. The norm is the scale factor that expands the unit ball until it reaches the vector." />
      </FigureCaption>
    </figure>
  );
}
