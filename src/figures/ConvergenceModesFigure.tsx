import { useMemo, useState } from "react";

import { MathText } from "@/shared/math";
import {
  DIA,
  FigureCaption,
  FigureFrame,
  FunctionBand,
  FunctionCurve,
  LaTeX,
  Line,
  Point,
  STROKE,
  UI,
  type Domain,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { SegmentedControl } from "./SegmentedControl";

type Mode = "uniform" | "pointwise" | "l2";

interface ModeSpec {
  xDomain: Domain;
  yDomain: Domain;
  /** The n-th function in the sequence. */
  fn: (x: number, n: number) => number;
  /** The limit function the sequence approaches. */
  limit: (x: number) => number;
  /** True when the sequence converges uniformly (sup distance → 0). */
  uniform: boolean;
  note: string;
}

const SPECS: Record<Mode, ModeSpec> = {
  uniform: {
    xDomain: [0, 2 * Math.PI],
    yDomain: [-1.25, 1.25],
    fn: (x, n) => 0.45 * Math.sin(x) + Math.cos(3 * x) / n,
    limit: (x) => 0.45 * Math.sin(x),
    uniform: true,
    note: "Uniform: the whole graph is trapped in a $\\pm 1/n$ band, so $\\|f_n-f\\|_\\infty\\to 0$.",
  },
  pointwise: {
    xDomain: [0, 1],
    yDomain: [-0.1, 1.15],
    fn: (x, n) => x ** n,
    limit: () => 0,
    uniform: false,
    note: "Pointwise only: $x^n\\to 0$ at every $x<1$, but a corner of height $1$ survives, so $\\|f_n-f\\|_\\infty=1$.",
  },
  l2: {
    xDomain: [0, 1.04],
    yDomain: [-0.1, 1.15],
    fn: (x, n) => Math.exp(-(((x - 0.5) * 3.2 * n) ** 2)),
    limit: () => 0,
    uniform: false,
    note: "Mean-square: a spike of fixed height but shrinking width has $\\|f_n\\|_2\\to 0$ while $\\|f_n\\|_\\infty=1$ never moves.",
  },
};

const MODE_OPTIONS = [
  { value: "uniform" as const, label: "Uniform" },
  { value: "pointwise" as const, label: "Pointwise" },
  { value: "l2" as const, label: "$L^2$" },
];

/** Numerically estimate sup- and L²-distance of f_n from the limit. */
function distances(spec: ModeSpec, n: number): { sup: number; l2: number } {
  const [a, b] = spec.xDomain;
  const N = 400;
  let sup = 0;
  let sq = 0;
  for (let i = 0; i <= N; i++) {
    const x = a + ((b - a) * i) / N;
    const d = Math.abs(spec.fn(x, n) - spec.limit(x));
    sup = Math.max(sup, d);
    sq += d * d;
  }
  return { sup, l2: Math.sqrt((sq / N) * (b - a)) };
}

export default function ConvergenceModesFigure() {
  const [mode, setMode] = useState<Mode>("uniform");
  const [n, setN] = useState(3);
  const spec = SPECS[mode];
  const { sup, l2 } = useMemo(() => distances(spec, n), [spec, n]);

  const epsilonLabels = useMemo(() => {
    if (!spec.uniform) return null;

    const [a, b] = spec.xDomain;
    const x = a + 0.78 * (b - a);
    const eps = 1 / n;

    return {
      upper: [x, spec.limit(x) + eps] as Vec2,
      lower: [x, spec.limit(x) - eps] as Vec2,
      value: eps,
    };
  }, [spec, n]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={spec.xDomain} yDomain={spec.yDomain} height={190} grid>
        {epsilonLabels && (
          <>
            <FunctionBand upper={(x) => spec.limit(x) + 1 / n} lower={(x) => spec.limit(x) - 1 / n} color={DIA.ok} />

            <LaTeX
              at={[epsilonLabels.upper[0], epsilonLabels.upper[1] + 0.15]}
              tex={`\\varepsilon=${epsilonLabels.value.toFixed(2)}`}
              color={DIA.ink}
            />

            <LaTeX
              at={[epsilonLabels.lower[0], epsilonLabels.lower[1] - 0.15]}
              tex={`-\\varepsilon=-${epsilonLabels.value.toFixed(2)}`}
              color={DIA.ink}
            />
          </>
        )}
        <FunctionCurve y={spec.limit} domain={spec.xDomain} color={DIA.ok} weight={STROKE.ref} style="dashed" />
        <FunctionCurve y={(x) => spec.fn(x, n)} domain={spec.xDomain} color={DIA.accent} weight={STROKE.curve} />
        {mode === "pointwise" && (
          <>
            <Line.Segment point1={[1, 0]} point2={[1, 1]} color={DIA.alert} weight={STROKE.mark} style="dashed" />
            <Point x={1} y={1} color={DIA.alert} svgCircleProps={{ r: 3.6 }} />
          </>
        )}
        <LaTeX at={[spec.xDomain[0] + 0.25, spec.yDomain[1] - 0.12]} tex={`f_{${n}}`} color={DIA.accent} />
      </FigureFrame>
      <SegmentedControl value={mode} options={MODE_OPTIONS} onChange={(m) => setMode(m)} ariaLabel="Convergence mode" />
      <RangeControl min={1} max={20} value={n} onChange={setN} label={`$n = ${n}$`} ariaLabel="Sequence index n" />
      <FigureCaption className="space-y-1">
        <div className="font-math" style={{ color: UI.text }}>
          <MathText text={`$\\|f_n-f\\|_\\infty=${sup.toFixed(2)}\\quad\\|f_n-f\\|_2=${l2.toFixed(2)}$`} />
        </div>
        <MathText text={spec.note} />
      </FigureCaption>
    </figure>
  );
}
