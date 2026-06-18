import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { DIA, FigureFrame, FunctionCurve, Line, Polygon, STROKE, type Vec2 } from "./FigureFrame";
import { MathText } from "../../lib/katex";

function testFn(x: number): number {
  const tent = Math.max(0, 1 - Math.abs(x + 1.25) / 1.05);
  const step = x > 0.35 && x < 2.35 ? 0.42 : 0;
  const shoulder = 0.18 * Math.exp(-1.6 * (x - 2.15) ** 2) * Math.cos(4.5 * x);
  return tent + step + shoulder - 0.18;
}

const XS = linspace(-Math.PI, Math.PI, 420);
const FS = XS.map(testFn);
const F_PEAK = Math.max(...FS.map(Math.abs));
const Y_DOMAIN: [number, number] = [-F_PEAK * 1.3, F_PEAK * 1.3];
const DX = (2 * Math.PI) / XS.length;

const COEFFS: number[] = [0];
for (let n = 1; n <= 20; n++) {
  const re = (XS.reduce((sum, x) => sum + testFn(x) * Math.cos(n * x), 0) * DX) / Math.PI;
  const im = (XS.reduce((sum, x) => sum - testFn(x) * Math.sin(n * x), 0) * DX) / Math.PI;
  COEFFS.push(Math.hypot(re, im));
}
const COEFF_MAX = Math.max(...COEFFS.slice(1), 1e-9);

function lobePolygons(values: number[], sign: "positive" | "negative"): Vec2[][] {
  const polys: Vec2[][] = [];
  let current: Vec2[] = [];

  XS.forEach((x, i) => {
    const y = values[i];
    const keep = sign === "positive" ? y >= 0 : y <= 0;
    if (keep) {
      if (current.length === 0) current.push([x, 0]);
      current.push([x, y]);
      return;
    }
    if (current.length > 1) {
      current.push([XS[i - 1], 0]);
      polys.push(current);
    }
    current = [];
  });

  if (current.length > 1) {
    current.push([XS[XS.length - 1], 0]);
    polys.push(current);
  }

  return polys;
}

const BAR_HEIGHT = 76;
const BAR_Y_DOMAIN: [number, number] = [-0.04, 1.1];

export default function RiemannLebesgueFigure() {
  const [n, setN] = useState(2);

  const integrandValues = useMemo(() => XS.map((x) => testFn(x) * Math.cos(n * x)), [n]);
  const positiveLobes = useMemo(() => lobePolygons(integrandValues, "positive"), [integrandValues]);
  const negativeLobes = useMemo(() => lobePolygons(integrandValues, "negative"), [integrandValues]);
  const cn = COEFFS[Math.min(n, 20)];
  const normalizedCoeffs = COEFFS.map((c) => c / COEFF_MAX);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN} grid={true}>
        {positiveLobes.map((points, i) => (
          <Polygon key={`pos-${i}`} points={points} color={DIA.accent} fillOpacity={0.18} strokeOpacity={0} />
        ))}
        {negativeLobes.map((points, i) => (
          <Polygon key={`neg-${i}`} points={points} color={DIA.alert} fillOpacity={0.18} strokeOpacity={0} />
        ))}
        <FunctionCurve
          y={testFn}
          domain={[-Math.PI, Math.PI]}
          color={DIA.codomain}
          weight={STROKE.ref}
          style="dashed"
        />
        <FunctionCurve
          y={(x) => testFn(x) * Math.cos(n * x)}
          domain={[-Math.PI, Math.PI]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
      </FigureFrame>

      <div className="mt-2">
        <div className="mb-1.5 flex items-baseline justify-between text-ui-sm" style={{ color: "var(--fg-1)" }}>
          <MathText text={`$c_{${n}} = \\frac{1}{\\pi} \\int_{-\\pi}^{\\pi} f(x) \\cdot \\cos(${n}x) \\, dx$`} />
          <MathText text={`$\\lvert \\hat{c}_{${n}} \\rvert = ${cn.toFixed(3)}$`} />
        </div>

        {/* bar chart aligned with slider: both are flex-1 inside the same gap-3 column */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FigureFrame xDomain={[0.7, 20.6]} yDomain={BAR_Y_DOMAIN} axes={false} height={BAR_HEIGHT}>
              {normalizedCoeffs.slice(1).map((height, i) => {
                const k = i + 1;
                const active = k === n;
                return (
                  <Polygon
                    key={k}
                    points={[
                      [k - 0.28, 0],
                      [k - 0.28, height],
                      [k + 0.28, height],
                      [k + 0.28, 0],
                    ]}
                    color={active ? DIA.accent : DIA.ink}
                    fillOpacity={active ? 0.95 : 0.3}
                    strokeOpacity={0}
                  />
                );
              })}
              <Line.Segment point1={[n, 0]} point2={[n, 1]} color={DIA.muted} weight={STROKE.guide} style="dashed" />
            </FigureFrame>
          </div>
          <span className="min-w-14 shrink-0 text-right font-math text-ui-meta" style={{ color: "var(--fg-2)" }}>
            <MathText text={`$n = ${n}$`} />
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={n}
            aria-label="Frequency n"
            onChange={(e) => setN(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full"
            style={{ accentColor: "var(--accent)", background: "var(--surface-3)" }}
          />
          <span className="min-w-14 shrink-0" />
        </div>
      </div>

      <figcaption className="mt-2 text-ui-sm" style={{ color: "var(--fg-1)" }}>
        <MathText
          text={`As $n$ grows $f \\cdot \\cos(nx)$ oscillates faster, positive and negative lobes multiply and increasingly cancel, driving the coefficient to zero.`}
        />
      </figcaption>
    </figure>
  );
}
