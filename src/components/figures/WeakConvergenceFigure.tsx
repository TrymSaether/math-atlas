import { useMemo, useState } from "react";

import { MathText } from "../../lib/katex";
import {
  DIA,
  DOT,
  FONT,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  STROKE,
  Text,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const PROBE_VALUES = [1, 0.72, 0.52, 0.38, 0.28, 0.2, 0.15, 0.11, 0.08, 0.06, 0.045, 0.034];

function probeValue(n: number): number {
  return PROBE_VALUES[n - 1] ?? 1 / (n + 1);
}

function isWeakStarNode(nodeId: string): boolean {
  return (
    nodeId.includes("weak_star") ||
    nodeId === "banach_alaoglu_theorem" ||
    nodeId === "unit_ball_weak_star_assumption"
  );
}

export default function WeakConvergenceFigure({ nodeId }: FigureProps) {
  const [n, setN] = useState(5);
  const value = probeValue(n);
  const weakStar = isWeakStarNode(nodeId);
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => probeValue(i + 1)), []);
  const selectedLabel = weakStar ? "$x_n^*(x)$" : "$x^*(e_n)$";

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.2, 12.8]} yDomain={[-0.2, 1.2]} height={190} grid={false}>
        <Line.Segment point1={[0.5, 0]} point2={[12.5, 0]} color={DIA.ink} weight={STROKE.guide} />
        <Line.Segment
          point1={[0.5, 1]}
          point2={[12.5, 1]}
          color={DIA.ink}
          weight={STROKE.hair}
          style="dashed"
        />
        {bars.map((bar, i) => {
          const k = i + 1;
          const selected = k === n;
          return (
            <g key={k}>
              <Polygon
                points={[
                  [k - 0.24, 0],
                  [k - 0.24, bar],
                  [k + 0.24, bar],
                  [k + 0.24, 0],
                ]}
                color={selected ? DIA.alert : DIA.accent}
                fillOpacity={selected ? 0.95 : 0.62}
                strokeOpacity={0}
              />
              <Point
                x={k}
                y={1}
                color={selected ? DIA.alert : DIA.ink}
                svgCircleProps={{ r: selected ? DOT.hub : DOT.small }}
              />
              {(k % 2 === 0 || selected) && (
                <Text x={k} y={-0.11} color={DIA.ink} size={FONT.tick}>
                  {k}
                </Text>
              )}
            </g>
          );
        })}
        <LaTeX
          at={[1.5, 1.2]}
          tex={weakStar ? String.raw`\|x_n^*\|\le 1` : String.raw`\|e_n\|=1`}
        />
        <LaTeX
          at={[8.85, 0.24]}
          tex={weakStar ? String.raw`x_n^*(x)\to x^*(x)` : String.raw`x^*(e_n)\to 0`}
        />
      </FigureFrame>
      <RangeControl
        min={1}
        max={12}
        value={n}
        onChange={setN}
        label={`n = ${n}`}
        ariaLabel="Sequence index n"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        <MathText
          text={
            weakStar
              ? `Weak-star convergence tests functionals pointwise: ${selectedLabel}=${value.toFixed(3)} while the functionals remain in a bounded dual ball.`
              : `Weak convergence can miss norm size: ${selectedLabel}=${value.toFixed(3)} tends to 0 even though $\\|e_n\\|=1$.`
          }
        />
      </figcaption>
    </figure>
  );
}
