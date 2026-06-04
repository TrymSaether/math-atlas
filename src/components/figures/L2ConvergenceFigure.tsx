import { useMemo, useState } from "react";

import { linspace, linearScale } from "../../lib/figures/plot";
import { type WaveKind, waveCoeff, wavePartialSum, waveTarget } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { WaveSelect } from "./WaveSelect";
import { type FigureProps } from "./types";

const XS = linspace(-Math.PI, Math.PI, 600);
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

// Error bar panel dimensions
const W = 320;
const BAR_PAD = 14;
const BAR_H = 14;
const NS_BAR = Array.from({ length: N_MAX + 1 }, (_, i) => i);
const SX_BAR = linearScale([0, N_MAX], [BAR_PAD, W - BAR_PAD]);

export default function L2ConvergenceFigure(_: FigureProps) {
  const [kind, setKind] = useState<WaveKind>("square");
  const [N, setN] = useState(5);

  const target = useMemo(() => XS.map((x) => waveTarget(kind, x)), [kind]);
  const approx = useMemo(() => XS.map((x) => wavePartialSum(kind, x, N)), [kind, N]);

  const errors = ERROR_CURVES[kind];
  const total = TOTAL[kind];
  const currentErr = errors[N];
  const maxErr = errors[0];

  // Normalize for the error bar display
  const errFraction = maxErr > 0 ? currentErr / maxErr : 0;
  const errPct = total > 0 ? ((currentErr / total) * 100).toFixed(1) : "0";

  // Error decay curve — log scale, rendered as a small SVG bar chart
  const BAR_SVG_H = 48;
  const SY_ERR = linearScale([0, maxErr], [BAR_SVG_H - 4, 4]);

  return (
    <figure className="m-0">
      {/* Waveform: target vs partial sum */}
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN[kind]}>
        {({ path, sx, sy }) => {
          // Shade the error region between f and S_N f
          const errorFill = XS.map((x, i) => {
            const diff = Math.abs(approx[i] - target[i]);
            return diff;
          });
          const topYs = XS.map((_, i) => Math.max(target[i], approx[i]));
          const botYs = XS.map((_, i) => Math.min(target[i], approx[i]));

          // Build a filled band between the two curves
          const topPath = XS.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(topYs[i]).toFixed(1)}`).join(" ");
          const botPathRev = [...XS].reverse().map((x, ri) => {
            const i = XS.length - 1 - ri;
            return `L${sx(x).toFixed(1)},${sy(botYs[i]).toFixed(1)}`;
          }).join(" ");

          return (
            <>
              {/* Error band */}
              <path
                d={`${topPath} ${botPathRev} Z`}
                fill="var(--red)"
                opacity={0.12}
              />
              {/* f(x) dashed */}
              <path d={path(XS, target)} fill="none" stroke="var(--fg-3)" strokeWidth={1.4} strokeDasharray="4 3" />
              {/* S_N f */}
              <path d={path(XS, approx)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
            </>
          );
        }}
      </FigureFrame>

      {/* Error decay bar chart (simple horizontal bars per N) */}
      <div className="mt-2 px-1">
        <div className="mb-1 flex items-baseline justify-between text-ui-hint" style={{ color: "var(--fg-3)" }}>
          <span>L² error ‖S<sub>N</sub>f − f‖²</span>
          <span className="font-mono" style={{ color: "var(--fg-2)" }}>
            {errPct}% of ‖f‖²
          </span>
        </div>
        {/* Mini bar chart: one bar per N */}
        <svg viewBox={`0 0 ${W} ${BAR_SVG_H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {NS_BAR.map((n) => {
            if (n === 0) return null;
            const bx = SX_BAR(n - 1);
            const bw = Math.max((W - 2 * BAR_PAD) / N_MAX - 0.5, 1);
            const bh = BAR_SVG_H - 4 - SY_ERR(errors[n]);
            const active = n === N;
            return (
              <rect
                key={n}
                x={bx}
                y={SY_ERR(errors[n])}
                width={bw}
                height={Math.max(bh, 0)}
                fill={active ? "var(--accent)" : "var(--fg-4)"}
                opacity={active ? 1 : 0.5}
              />
            );
          })}
          {/* baseline */}
          <line x1={BAR_PAD} y1={BAR_SVG_H - 4} x2={W - BAR_PAD} y2={BAR_SVG_H - 4} stroke="var(--fg-4)" strokeWidth={1} />
        </svg>
      </div>

      <WaveSelect value={kind} onChange={(k) => { setKind(k); setN(5); }} />
      <RangeControl min={1} max={N_MAX} value={N} onChange={setN} label={`N = ${N}`} ariaLabel="Number of harmonics N" />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {CAPTIONS[kind]}
      </figcaption>
    </figure>
  );
}
