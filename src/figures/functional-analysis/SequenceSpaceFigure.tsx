import { useMemo, useState } from "react";

import { MathText } from "@/math/MathText";
import {
  DIA,
  DOT,
  FONT,
  FigureCaption,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  STROKE,
  Text,
  UI,
} from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";
import type { FigureProps } from "../core/types";

const TERMS = 16;

/** The model sequence x_k = 1/k: it tends to 0 (so lies in c₀) but its
 *  p-summability flips exactly at p = 1. */
function term(k: number): number {
  return 1 / k;
}

/** Σ_{k≥1} k^{-p}; effectively ζ(p) for p>1, divergent (∞) for p≤1. */
function pSum(p: number): number {
  if (p <= 1.001) return Infinity;
  let s = 0;
  for (let k = 1; k <= 20000; k++) s += k ** -p;
  return s;
}

export default function SequenceSpaceFigure({ nodeId }: FigureProps) {
  const isC0 = nodeId === "c_0" || nodeId === "c_k";
  const fixedP = nodeId === "ell_2_as_hilbert_space" ? 2 : null;
  const [p, setP] = useState(fixedP ?? 2);

  const bars = useMemo(() => Array.from({ length: TERMS }, (_, i) => term(i + 1)), []);
  const sum = useMemo(() => pSum(p), [p]);
  const converges = Number.isFinite(sum);
  const norm = converges ? sum ** (1 / p) : Infinity;
  const barColor = converges ? DIA.accent : DIA.alert;

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.2, TERMS + 0.8]} yDomain={[-0.18, 1.18]} height={190} grid={false}>
        <Line.Segment point1={[0.5, 0]} point2={[TERMS + 0.5, 0]} color={DIA.ink} weight={STROKE.guide} />
        {bars.map((v, i) => {
          const k = i + 1;
          return (
            <g key={k}>
              <Polygon
                points={[
                  [k - 0.26, 0],
                  [k - 0.26, v],
                  [k + 0.26, v],
                  [k + 0.26, 0],
                ]}
                color={barColor}
                fillOpacity={0.85}
                strokeOpacity={0}
              />
              <Point x={k} y={v} color={barColor} svgCircleProps={{ r: DOT.sample }} />
              {(k === 1 || k % 4 === 0) && (
                <Text x={k} y={-0.1} color={DIA.ref} size={FONT.tick}>
                  {k}
                </Text>
              )}
            </g>
          );
        })}
        <LaTeX at={[2.4, 1.04]} tex={String.raw`x_k=\tfrac1k\to 0`} color={DIA.text} />
        <LaTeX
          at={[8.5, 0.62]}
          tex={converges ? String.raw`\in\ell^p` : String.raw`\notin\ell^p`}
          color={converges ? DIA.ok : DIA.alert}
        />
      </FigureFrame>
      {fixedP === null && (
        <RangeControl
          min={0.5}
          max={4}
          step={0.05}
          value={p}
          onChange={setP}
          label={`p = ${p.toFixed(2)}`}
          ariaLabel="Summability exponent p"
        />
      )}
      <FigureCaption className="space-y-1">
        <div className="font-math" style={{ color: UI.text }}>
          <MathText
            text={
              converges
                ? `$\\|x\\|_p=\\Big(\\sum_k k^{-p}\\Big)^{1/p}=${norm.toFixed(2)}$`
                : `$\\|x\\|_p=\\Big(\\sum_k k^{-p}\\Big)^{1/p}=\\infty$`
            }
          />
        </div>
        <MathText
          text={
            isC0
              ? "Every coordinate decays to $0$, so $x\\in c_0$ regardless of $p$ — but $p$-summability is a strictly stronger demand."
              : "The harmonic sequence sits in $\\ell^p$ exactly when $p>1$: the spaces nest $\\ell^1\\subset\\ell^2\\subset\\cdots\\subset c_0$."
          }
        />
      </FigureCaption>
    </figure>
  );
}
