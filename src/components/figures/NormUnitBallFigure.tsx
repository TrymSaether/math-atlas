import { useMemo, useState } from "react";

import { MathText } from "../../lib/katex";
import {
  Circle,
  DIA,
  DOT,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  STROKE,
  Vector,
  type Vec2,
  useMovablePoint,
} from "./FigureFrame";
import { type FigureProps } from "./types";

type NormKind = "l2" | "l1" | "linf" | "lp";

const MODES: { kind: NormKind; label: string; short: string }[] = [
  { kind: "l2", label: "Euclidean $\\ell^2$", short: "$\\ell^2$" },
  { kind: "l1", label: "Taxicab $\\ell^1$", short: "$\\ell^1$" },
  { kind: "linf", label: "Chessboard $\\ell^\\infty$", short: "$\\ell^\\infty$" },
  { kind: "lp", label: "Smooth $\\ell^p$", short: "$\\ell^p$" },
];

const VIEW_MIN = -2.35;
const VIEW_MAX = 2.35;

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
  if (kind === "l1") return [[1, 0], [0, 1], [-1, 0], [0, -1]];
  if (kind === "linf") return [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  return lpBoundary(kind === "lp" ? p : 2);
}

function exponentFromInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return clamp(parsed, 1, 12);
}

function NormModeSelect({
  value,
  onChange,
  pInput,
  onPInput,
}: {
  value: NormKind;
  onChange: (kind: NormKind) => void;
  pInput: string;
  onPInput: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Norm type"
        className="inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border p-1"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        {MODES.map((mode) => {
          const active = mode.kind === value;
          return (
            <button
              key={mode.kind}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(mode.kind)}
              className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-ui-meta transition-colors"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--accent-fg, #fff)" : "var(--fg-2)",
                fontWeight: active ? 650 : 450,
              }}
            >
              <MathText text={mode.label} />
            </button>
          );
        })}
      </div>
      {value === "lp" && (
        <label
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-1.5 text-ui-meta"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--fg-2)" }}
        >
          <MathText text="$p=$" />
          <input
            type="number"
            min={1}
            max={12}
            step={0.1}
            value={pInput}
            onChange={(event) => onPInput(event.target.value)}
            className="w-14 rounded-[var(--radius-sm)] border bg-transparent px-1.5 py-0.5 text-right font-math"
            style={{ borderColor: "var(--border)", color: "var(--fg-1)" }}
            aria-label="Smooth lp exponent"
          />
        </label>
      )}
    </div>
  );
}

function ReadoutPanel({
  point,
  value,
  mode,
  p,
}: {
  point: Vec2;
  value: number;
  mode: NormKind;
  p: number;
}) {
  const inside = value <= 1 + 1e-6;
  const normSubscript =
    mode === "lp" ? p.toFixed(p % 1 === 0 ? 0 : 1) : mode === "linf" ? "\\infty" : mode === "l1" ? "1" : "2";

  return (
    <aside
      className="flex min-w-[13rem] flex-1 flex-col rounded-[var(--radius-md)] border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="text-center text-ui-body font-semibold" style={{ color: "var(--fg-1)" }}>
        <MathText text="Rubber band tension" />
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-ui-meta" style={{ color: "var(--fg-2)" }}>
        <span>
          <MathText text="$x=$" />
        </span>
        <strong className="font-math" style={{ color: "var(--fg-1)" }}>
          ({point[0].toFixed(2)}, {point[1].toFixed(2)})
        </strong>
        <span>
          <MathText text={`$\\|x\\|_{${normSubscript}}=$`} />
        </span>
        <strong className="font-math" style={{ color: DIA.alert }}>
          {value.toFixed(3)}
        </strong>
      </div>
      <div className="mt-3 h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (value / 2.5) * 100)}%`,
            background: inside ? DIA.ok : DIA.alert,
          }}
        />
      </div>
      <div className="mt-3 text-ui-meta" style={{ color: "var(--fg-2)" }}>
        <MathText text="$\\|x\\|$" />{" <= 1? "}
        <strong style={{ color: inside ? DIA.ok : DIA.alert }}>
          <MathText text={inside ? "Yes, inside the unit ball" : "No, outside the unit ball"} />
        </strong>
      </div>
      <div className="mt-3 border-t pt-2 text-ui-meta" style={{ borderColor: "var(--border)", color: "var(--fg-2)" }}>
        {[
          "$\\|x\\|\\ge 0$, and $\\|x\\|=0\\iff x=0$",
          "$\\|\\lambda x\\|=|\\lambda|\\,\\|x\\|$",
          "$\\|x+y\\|\\le \\|x\\|+\\|y\\|$",
        ].map((axiom) => (
          <div key={axiom} className="flex items-center justify-between gap-2">
            <MathText text={axiom} />
            <span className="font-math" style={{ color: DIA.ok }}>
              ✓
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function NormUnitBallFigure(_: FigureProps) {
  const [mode, setMode] = useState<NormKind>("linf");
  const [pInput, setPInput] = useState("3");
  const p = exponentFromInput(pInput);
  const point = useMovablePoint([1.4, -0.7], {
    color: "var(--accent)",
    constrain: ([x, y]) => [clamp(x), clamp(y)],
  });
  const x: Vec2 = [point.x, point.y];
  const value = normValue(x, mode, p);
  const ball = useMemo(() => unitBallPoints(mode, p), [mode, p]);
  const label = mode === "lp" ? String.raw`\|x\|_{p}=1` : String.raw`\|x\|=1`;

  return (
    <figure className="m-0">
      <NormModeSelect value={mode} onChange={setMode} pInput={pInput} onPInput={setPInput} />
      <div className="mt-3 flex flex-col gap-3 2xl:flex-row">
        <div className="min-w-0 flex-[1.35]">
          <FigureFrame xDomain={[-2.4, 2.4]} yDomain={[-2.1, 2.1]} height={255} axes={false} grid>
            {mode === "l2" ? (
              <Circle center={[0, 0]} radius={1} color={DIA.codomain} fillOpacity={0.11} strokeOpacity={1} weight={STROKE.ref} />
            ) : (
              <Polygon points={ball} color={DIA.codomain} fillOpacity={0.11} strokeOpacity={1} weight={STROKE.ref} />
            )}
            <Line.Segment point1={[-2.25, 0]} point2={[2.25, 0]} color={DIA.muted} weight={STROKE.guide} />
            <Line.Segment point1={[0, -1.95]} point2={[0, 1.95]} color={DIA.muted} weight={STROKE.guide} />
            <Vector tail={[0, 0]} tip={x} color={value <= 1 ? DIA.ok : DIA.alert} weight={Math.min(3.2, 1.4 + value * 0.45)} />
            <Point x={0} y={0} color={DIA.faint} svgCircleProps={{ r: DOT.small }} />
            <LaTeX at={[2.22, -0.24]} tex="x_1" color={DIA.text} />
            <LaTeX at={[0.18, 1.82]} tex="x_2" color={DIA.text} />
            <LaTeX at={[1.1, 1.08]} tex={label} color={DIA.codomain} />
            <LaTeX at={[x[0] + 0.17, x[1] + 0.17]} tex="x" color={DIA.accent} />
            {point.element}
          </FigureFrame>
        </div>
        <ReadoutPanel point={x} value={value} mode={mode} p={p} />
      </div>
      <figcaption className="mt-2 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        <MathText text="Drag $x$ and switch norms. The same vector has different size because each unit ball encodes a different geometry." />
      </figcaption>
    </figure>
  );
}
