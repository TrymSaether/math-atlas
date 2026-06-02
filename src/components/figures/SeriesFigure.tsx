import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { type WaveKind, wavePartialSum, waveTarget } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { WaveSelect } from "./WaveSelect";
import { type FigureProps } from "./types";

const XS = linspace(-Math.PI, Math.PI, 600);

const Y: Record<WaveKind, [number, number]> = {
  square: [-1.35, 1.35],
  sawtooth: [-Math.PI - 0.4, Math.PI + 0.4],
  triangle: [-0.3, Math.PI + 0.3],
};

const CAPTION: Record<WaveKind, string> = {
  square: "Odd harmonics only; the jump discontinuity drives the Gibbs overshoot.",
  sawtooth: "Every harmonic appears, with amplitude falling like 1/k.",
  triangle: "Continuous, so the cosine coefficients decay fast (1/k²) — convergence is quick.",
};

/**
 * A periodic waveform and its truncated Fourier series, with a slider on the
 * number of harmonics and a selector for the target shape. Serves the
 * Fourier-series family of nodes.
 */
export default function SeriesFigure(_: FigureProps) {
  const [kind, setKind] = useState<WaveKind>("square");
  const [terms, setTerms] = useState(6);

  const target = useMemo(() => XS.map((x) => waveTarget(kind, x)), [kind]);
  const approx = useMemo(() => XS.map((x) => wavePartialSum(kind, x, terms)), [kind, terms]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y[kind]}>
        {({ path }) => (
          <>
            <path
              d={path(XS, target)}
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth={1.4}
              strokeDasharray="4 3"
            />
            <path d={path(XS, approx)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
          </>
        )}
      </FigureFrame>
      <WaveSelect value={kind} onChange={setKind} />
      <RangeControl
        min={1}
        max={kind === "sawtooth" ? 40 : 30}
        value={terms}
        onChange={setTerms}
        label={`N = ${terms}`}
        ariaLabel="Number of harmonics"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {CAPTION[kind]}
      </figcaption>
    </figure>
  );
}
