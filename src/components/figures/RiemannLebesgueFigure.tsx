import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { DIA, FigureFrame, FunctionCurve, Line, Polygon, STROKE, type Vec2 } from "./FigureFrame";
import { RangeControl } from "./RangeControl";

function testFn(x: number): number {
  const tent = Math.max(0, 1 - Math.abs(x + 1.25) / 1.05);
  const step = x > 0.35 && x < 2.35 ? 0.42 : 0;
  const shoulder = 0.18 * Math.exp(-1.6 * (x - 2.15) ** 2) * Math.cos(4.5 * x);
  return tent + step + shoulder - 0.18;
}

const XS = linspace(-Math.PI, Math.PI, 420);
const FS = XS.map(testFn);
const F_PEAK = Math.max(...FS.map(Math.abs));
const Y_DOMAIN: [number, number] = [-F_PEAK * 2.2, F_PEAK * 2.2];
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

export default function RiemannLebesgueFigure() {
  const [n, setN] = useState(2);

  const integrandValues = useMemo(() => XS.map((x) => testFn(x) * Math.cos(n * x)), [n]);
  const positiveLobes = useMemo(() => lobePolygons(integrandValues, "positive"), [integrandValues]);
  const negativeLobes = useMemo(() => lobePolygons(integrandValues, "negative"), [integrandValues]);
  const cn = COEFFS[Math.min(n, 20)];
  const normalizedCoeffs = COEFFS.map((c) => c / COEFF_MAX);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN} grid>
        {positiveLobes.map((points, i) => (
          <Polygon
            key={`pos-${i}`}
            points={points}
            color={DIA.accent}
            fillOpacity={0.16}
            strokeOpacity={0}
          />
        ))}
        {negativeLobes.map((points, i) => (
          <Polygon
            key={`neg-${i}`}
            points={points}
            color={DIA.alert}
            fillOpacity={0.16}
            strokeOpacity={0}
          />
        ))}
        <FunctionCurve
          y={testFn}
          domain={[-Math.PI, Math.PI]}
          color={DIA.ref}
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

      <div className="mt-2 px-1">
        <div
          className="mb-1 flex items-baseline justify-between text-ui-hint"
          style={{ color: "var(--fg-3)" }}
        >
          <span>Coefficient spectrum |ĉₖ|</span>
          <span className="font-mono" style={{ color: "var(--fg-2)" }}>
            n = {n}, |ĉₙ| = {cn.toFixed(4)}
          </span>
        </div>
        <FigureFrame xDomain={[0.4, 20.6]} yDomain={[-0.18, 1.12]} height={62} axes={false}>
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
                color={active ? DIA.accent : DIA.muted}
                fillOpacity={active ? 0.95 : 0.42}
                strokeOpacity={0}
              />
            );
          })}
          <Line.Segment
            point1={[0.5, 0]}
            point2={[20.5, 0]}
            color={DIA.muted}
            weight={STROKE.guide}
          />
          <Line.Segment
            point1={[n, 0]}
            point2={[n, 1.05]}
            color={DIA.accent}
            weight={STROKE.mark}
            style="dashed"
          />
        </FigureFrame>
      </div>

      <RangeControl
        min={1}
        max={20}
        value={n}
        onChange={setN}
        label={`n = ${n}`}
        ariaLabel="Frequency n"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        As n grows, f·cos(nx) oscillates faster; positive and negative lobes cancel, driving the
        coefficient to zero.
      </figcaption>
    </figure>
  );
}
