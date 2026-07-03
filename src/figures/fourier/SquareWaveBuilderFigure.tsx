import { useMemo, useState } from "react";

import { squareWavePartialSum } from "./fourierMath";
import { MathText } from "@/math/MathText";
import { DIA, FigureCaption, FigureFrame, FunctionCurve, LaTeX, Line, Polygon, STROKE } from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";

const X_DOMAIN: [number, number] = [-Math.PI, Math.PI];
const Y_DOMAIN: [number, number] = [-1.55, 1.55];

const BAR_X_DOMAIN: [number, number] = [0.4, 41.6];
const BAR_Y_DOMAIN: [number, number] = [-0.08, 1.08];

const MAX_TERMS = 40;
const BAR_INDICES = Array.from({ length: MAX_TERMS }, (_, i) => i + 1);

function oddHarmonic(term: number): number {
  return 2 * term - 1;
}

function coefficientMagnitude(term: number): number {
  return 1 / oddHarmonic(term);
}

function harmonicSummary(terms: number): string {
  const visible = Array.from({ length: Math.min(terms, 4) }, (_, i) => {
    const k = oddHarmonic(i + 1);
    return k === 1 ? String.raw`\sin x` : String.raw`\sin(${k}x)`;
  });

  if (terms > 4) {
    visible.push(String.raw`\cdots`, String.raw`\sin(${2 * terms - 1}x)`);
  }

  return visible.join(String.raw`+`);
}

/**
 * Square-wave Fourier builder.
 *
 * Shows
 *
 *   S_N(x) = (4/pi) sum_{j=0}^{N-1} sin((2j+1)x)/(2j+1)
 *
 * against the ideal ±1 square wave. The lower strip shows which odd harmonics
 * have been activated by the slider.
 */
export default function SquareWaveBuilderFigure() {
  const [terms, setTerms] = useState(1);

  const harmonics = useMemo(() => harmonicSummary(terms), [terms]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={X_DOMAIN} yDomain={Y_DOMAIN} height={230} grid>
        <Line.Segment point1={[-Math.PI, -1]} point2={[0, -1]} color={DIA.ref} weight={STROKE.ref} style="dashed" />
        <Line.Segment point1={[0, 1]} point2={[Math.PI, 1]} color={DIA.ref} weight={STROKE.ref} style="dashed" />
        <Line.Segment
          point1={[0, -1]}
          point2={[0, 1]}
          color={DIA.ref}
          weight={STROKE.guide}
          style="dashed"
          opacity={0.55}
        />

        <FunctionCurve
          y={(x) => squareWavePartialSum(x, terms)}
          domain={X_DOMAIN}
          color={DIA.accent}
          weight={STROKE.curve}
        />

        <LaTeX at={[-2.85, 1.25]} tex={String.raw`f(x)=\operatorname{sgn}(\sin x)`} />
        <LaTeX at={[-2.85, -1.35]} tex={String.raw`S_N(x)=\frac4\pi\sum_{j=0}^{N-1}\frac{\sin((2j+1)x)}{2j+1}`} />
        <LaTeX at={[Math.PI - 0.25, -0.22]} tex={String.raw`x`} />
      </FigureFrame>

      <div className="mt-4">
        <FigureFrame xDomain={BAR_X_DOMAIN} yDomain={BAR_Y_DOMAIN} height={86} axes={false}>
          {BAR_INDICES.map((term) => {
            const active = term <= terms;
            const height = coefficientMagnitude(term);

            return (
              <Polygon
                key={term}
                points={[
                  [term - 0.32, 0],
                  [term - 0.32, height],
                  [term + 0.32, height],
                  [term + 0.32, 0],
                ]}
                color={active ? DIA.accent : DIA.ref}
                fillOpacity={active ? 0.82 : 0.1}
                strokeOpacity={0}
              />
            );
          })}

          <Line.Segment
            point1={[BAR_X_DOMAIN[0], 0]}
            point2={[BAR_X_DOMAIN[1], 0]}
            color={DIA.ink}
            weight={STROKE.guide}
          />

          <LaTeX at={[2.0, 0.9]} tex={String.raw`\frac{1}{2j+1}`} />
          <LaTeX at={[38.7, 0.16]} tex={String.raw`j`} />
        </FigureFrame>
      </div>

      <RangeControl
        min={1}
        max={MAX_TERMS}
        value={terms}
        onChange={setTerms}
        label={`N = ${terms}`}
        ariaLabel="Number of odd Fourier harmonics"
      />

      <FigureCaption>
        <MathText
          text={`Uses only odd sine frequencies: $${harmonics}$. More terms sharpen the jump, but the overshoot near the discontinuity persists: this is the Gibbs phenomenon.`}
        />
      </FigureCaption>
    </figure>
  );
}
