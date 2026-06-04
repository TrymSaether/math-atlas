import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { type WaveKind, wavePartialSum, waveTarget } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { WaveSelect } from "./WaveSelect";
import { type FigureProps } from "./types";

const XS = linspace(-Math.PI, Math.PI, 600);
const DX = (2 * Math.PI) / XS.length;

function numericalEnergy(ys: number[]): number {
  return ys.reduce((s, y) => s + y * y, 0) * DX / Math.PI;
}

const Y_DOMAIN: Record<WaveKind, [number, number]> = {
  square: [-1.4, 1.4],
  sawtooth: [-Math.PI - 0.4, Math.PI + 0.4],
  triangle: [-0.3, Math.PI + 0.3],
};

export default function ParsevalFigure(_: FigureProps) {
  const [kind, setKind] = useState<WaveKind>("square");
  const [N, setN] = useState(5);

  const target = useMemo(() => XS.map((x) => waveTarget(kind, x)), [kind]);
  const approx = useMemo(() => XS.map((x) => wavePartialSum(kind, x, N)), [kind, N]);
  const totalE = useMemo(() => numericalEnergy(target), [target]);
  const partialE = useMemo(() => numericalEnergy(approx), [approx]);

  const fraction = totalE > 0 ? Math.min(partialE / totalE, 1) : 0;
  const pct = (fraction * 100).toFixed(1);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN[kind]}>
        {({ path }) => (
          <>
            <path d={path(XS, target)} fill="none" stroke="var(--fg-3)" strokeWidth={1.4} strokeDasharray="4 3" />
            <path d={path(XS, approx)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
          </>
        )}
      </FigureFrame>

      {/* Parseval energy balance */}
      <div className="mt-2.5 px-1">
        <div className="mb-1.5 flex items-baseline justify-between text-ui-hint" style={{ color: "var(--fg-3)" }}>
          <span>Energy captured by {N} harmonic{N !== 1 ? "s" : ""}</span>
          <span className="font-mono" style={{ color: fraction > 0.95 ? "var(--green)" : "var(--fg-2)" }}>
            {pct}%
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${fraction * 100}%`,
              background: "var(--accent)",
              transition: "width 0.15s ease",
            }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-ui-hint" style={{ color: "var(--fg-4)" }}>
          <span>Σ|ĉₙ|² ≈ {partialE.toFixed(3)}</span>
          <span>‖f‖² = {totalE.toFixed(3)}</span>
        </div>
      </div>

      <WaveSelect value={kind} onChange={(k) => { setKind(k); setN(5); }} />
      <RangeControl min={1} max={40} value={N} onChange={setN} label={`N = ${N}`} ariaLabel="Number of harmonics N" />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Both sides of Parseval's identity update live — adding harmonics fills the bar until the partial sum captures all the energy.
      </figcaption>
    </figure>
  );
}
