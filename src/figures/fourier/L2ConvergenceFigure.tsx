import { useState } from "react";

import { type WaveKind, waveCoeff, wavePartialSum, waveTarget } from "./fourierMath";
import { DIA, FigureCaption, FigureFrame, FunctionCurve, Line, Plot, Polygon, STROKE, UI } from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";
import { WaveSelect } from "./WaveSelect";

const N_MAX = 50;
const TAIL = 2000; // harmonics to approximate total energy

// Total energy via Parseval: Σ_{n=1}^{TAIL} coeff(n)²
function totalEnergy(kind: WaveKind): number {
  let e = 0;
  for (let n = 1; n <= TAIL; n++) e += waveCoeff(kind, n) ** 2;
  return e;
}

// L² error for N terms via Parseval tail: Σ_{n=N+1}^{TAIL} coeff(n)²
function l2Error(kind: WaveKind, N: number): number {
  let e = 0;
  for (let n = N + 1; n <= TAIL; n++) e += waveCoeff(kind, n) ** 2;
  return e;
}

// Pre-compute error curve for each wave kind
const TOTAL: Record<WaveKind, number> = {
  square: totalEnergy("square"),
  sawtooth: totalEnergy("sawtooth"),
  triangle: totalEnergy("triangle"),
};

const ERROR_CURVES: Record<WaveKind, number[]> = {
  square: Array.from({ length: N_MAX + 1 }, (_, N) => l2Error("square", N)),
  sawtooth: Array.from({ length: N_MAX + 1 }, (_, N) => l2Error("sawtooth", N)),
  triangle: Array.from({ length: N_MAX + 1 }, (_, N) => l2Error("triangle", N)),
};

const Y_DOMAIN: Record<WaveKind, [number, number]> = {
  square: [-1.4, 1.4],
  sawtooth: [-Math.PI - 0.4, Math.PI + 0.4],
  triangle: [-0.3, Math.PI + 0.3],
};

const CAPTIONS: Record<WaveKind, string> = {
  square: "Square wave has a jump — coefficients decay like 1/n, so the L² error shrinks slowly.",
  sawtooth: "Sawtooth also jumps — same 1/n decay, same slow convergence as square.",
  triangle: "Triangle is continuous — coefficients decay like 1/n², so the error collapses much faster.",
};

const NS_BAR = Array.from({ length: N_MAX + 1 }, (_, i) => i);

export default function L2ConvergenceFigure() {
  const [kind, setKind] = useState<WaveKind>("square");
  const [N, setN] = useState(5);

  const errors = ERROR_CURVES[kind];
  const total = TOTAL[kind];
  const currentErr = errors[N];
  const maxErr = errors[0];

  // Normalize for the error bar display
  const errPct = total > 0 ? ((currentErr / total) * 100).toFixed(1) : "0";

  const top = (x: number) => Math.max(waveTarget(kind, x), wavePartialSum(kind, x, N));
  const bottom = (x: number) => Math.min(waveTarget(kind, x), wavePartialSum(kind, x, N));

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN[kind]} grid>
        <Plot.Inequality y={{ "<=": top, ">=": bottom }} fillColor={DIA.alert} fillOpacity={0.12} strokeOpacity={0} />
        <FunctionCurve
          y={(x) => waveTarget(kind, x)}
          domain={[-Math.PI, Math.PI]}
          color={DIA.ref}
          weight={STROKE.ref}
          style="dashed"
        />
        <FunctionCurve
          y={(x) => wavePartialSum(kind, x, N)}
          domain={[-Math.PI, Math.PI]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
      </FigureFrame>

      <div className="mt-2 px-1">
        <div className="mb-1 flex items-baseline justify-between text-caption-2" style={{ color: UI.muted }}>
          <span>
            L² error ‖S<sub>N</sub>f − f‖²
          </span>
          <span className="font-mono" style={{ color: UI.text }}>
            {errPct}% of ‖f‖²
          </span>
        </div>
        <FigureFrame xDomain={[0, N_MAX + 1]} yDomain={[0, maxErr * 1.08]} height={56} axes={false}>
          {NS_BAR.map((n) => {
            if (n === 0) return null;
            const active = n === N;
            const x0 = n - 0.42;
            const x1 = n + 0.42;
            return (
              <Polygon
                key={n}
                points={[
                  [x0, 0],
                  [x0, errors[n]],
                  [x1, errors[n]],
                  [x1, 0],
                ]}
                color={active ? DIA.accent : DIA.muted}
                fillOpacity={active ? 0.95 : 0.45}
                strokeOpacity={0}
              />
            );
          })}
          <Line.Segment point1={[0, 0]} point2={[N_MAX + 1, 0]} color={DIA.muted} weight={STROKE.guide} />
        </FigureFrame>
      </div>

      <WaveSelect
        value={kind}
        onChange={(k) => {
          setKind(k);
          setN(5);
        }}
      />
      <RangeControl
        min={1}
        max={N_MAX}
        value={N}
        onChange={setN}
        label={`N = ${N}`}
        ariaLabel="Number of harmonics N"
      />
      <FigureCaption>{CAPTIONS[kind]}</FigureCaption>
    </figure>
  );
}
