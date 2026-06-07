import { useState } from "react";

import { type WaveKind, wavePartialSum, waveTarget } from "../../lib/figures/fourierMath";
import { FigureFrame, FunctionCurve } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { WaveSelect } from "./WaveSelect";
import { type FigureProps } from "./types";

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

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y[kind]} grid>
        <FunctionCurve
          y={(x) => waveTarget(kind, x)}
          domain={[-Math.PI, Math.PI]}
          color="var(--fg-3)"
          weight={1.5}
          style="dashed"
        />
        <FunctionCurve
          y={(x) => wavePartialSum(kind, x, terms)}
          domain={[-Math.PI, Math.PI]}
          color="var(--accent)"
          weight={2.1}
        />
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
