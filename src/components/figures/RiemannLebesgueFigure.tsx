import { useMemo, useState } from "react";

import { linspace, linearScale, buildPath } from "../../lib/figures/plot";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

// A smooth, integrable function with no special Fourier structure
function testFn(x: number): number {
  return 0.65 * Math.sin(x) + 0.35 * Math.cos(2 * x) + 0.28 * Math.sin(3 * x - 0.5);
}

const W = 320;
const H_TOP = 108;
const H_BOT = 44;
const H = H_TOP + 14 + H_BOT;
const PAD = 14;

const XS = linspace(-Math.PI, Math.PI, 400);
const FS = XS.map(testFn);
const F_PEAK = Math.max(...FS.map(Math.abs));

const SX = linearScale([-Math.PI, Math.PI], [PAD, W - PAD]);
const SY = linearScale([-F_PEAK * 2.2, F_PEAK * 2.2], [H_TOP - PAD, PAD]);
const BASELINE = SY(0);

// Pre-compute |ĉₙ| for n = 1..20 via the trapezoidal rule: (1/π) ∫ f·cos(nx) dx
const DX = (2 * Math.PI) / XS.length;
const COEFFS: number[] = [0]; // index 0 unused
for (let n = 1; n <= 20; n++) {
  const c = XS.reduce((sum, x) => sum + testFn(x) * Math.cos(n * x), 0) * DX / Math.PI;
  COEFFS.push(Math.abs(c));
}
const C1 = COEFFS[1];

export default function RiemannLebesgueFigure(_: FigureProps) {
  const [n, setN] = useState(2);

  const integrand = useMemo(() => XS.map((x) => testFn(x) * Math.cos(n * x)), [n]);
  const cn = COEFFS[Math.min(n, 20)];
  const barW = (W - 2 * PAD) * Math.min(cn / C1, 1);

  const fPath = buildPath(XS, FS, SX, SY);
  const gPath = buildPath(XS, integrand, SX, SY);

  // Closed fill path for the integrand (closes to baseline)
  const fillD = `M${SX(-Math.PI).toFixed(1)},${BASELINE.toFixed(1)} ` +
    XS.map((x, i) => `L${SX(x).toFixed(1)},${SY(integrand[i]).toFixed(1)}`).join(" ") +
    ` L${SX(Math.PI).toFixed(1)},${BASELINE.toFixed(1)} Z`;

  const BOT_Y = H_TOP + 14;
  const BAR_H = 18;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          {/* positive (above baseline) */}
          <clipPath id="rl-clip-pos">
            <rect x={PAD} y={PAD} width={W - 2 * PAD} height={BASELINE - PAD} />
          </clipPath>
          {/* negative (below baseline) */}
          <clipPath id="rl-clip-neg">
            <rect x={PAD} y={BASELINE} width={W - 2 * PAD} height={H_TOP - PAD - BASELINE} />
          </clipPath>
        </defs>

        {/* Shaded positive lobes */}
        <path d={fillD} fill="var(--accent)" opacity={0.18} clipPath="url(#rl-clip-pos)" />
        {/* Shaded negative lobes */}
        <path d={fillD} fill="var(--red)" opacity={0.18} clipPath="url(#rl-clip-neg)" />

        {/* Baseline */}
        <line x1={PAD} y1={BASELINE} x2={W - PAD} y2={BASELINE} stroke="var(--fg-4)" strokeWidth={1} />

        {/* f(x) reference */}
        <path d={fPath} fill="none" stroke="var(--fg-3)" strokeWidth={1.4} strokeDasharray="4 3" />

        {/* integrand f(x)·cos(nx) */}
        <path d={gPath} fill="none" stroke="var(--accent)" strokeWidth={1.8} />

        {/* Legend */}
        <text x={PAD + 2} y={PAD} fontSize={8} fill="var(--fg-3)" dominantBaseline="hanging">f</text>
        <text x={PAD + 2} y={PAD + 11} fontSize={8} fill="var(--accent)" dominantBaseline="hanging">f · cos(nx)</text>

        {/* Coefficient bar */}
        <text x={PAD} y={BOT_Y - 2} fontSize={7.5} fill="var(--fg-3)">|ĉₙ|</text>
        <rect x={PAD} y={BOT_Y} width={W - 2 * PAD} height={BAR_H} rx={3} fill="var(--surface-3)" />
        <rect x={PAD} y={BOT_Y} width={Math.max(barW, 0)} height={BAR_H} rx={3} fill="var(--accent)" />
        <text
          x={PAD + Math.max(barW, 0) + 5}
          y={BOT_Y + BAR_H / 2}
          fontSize={8}
          fill="var(--fg-2)"
          dominantBaseline="middle"
        >
          {cn.toFixed(4)}
        </text>
      </svg>

      <RangeControl min={1} max={20} value={n} onChange={setN} label={`n = ${n}`} ariaLabel="Frequency n" />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        As n grows, f·cos(nx) oscillates faster — blue and red lobes cancel, driving the coefficient to zero. That's the Riemann–Lebesgue lemma.
      </figcaption>
    </figure>
  );
}
