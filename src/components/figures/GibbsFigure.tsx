import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { squareWave, squareWavePartialSum } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const XS = linspace(-Math.PI, Math.PI, 600);
const TARGET = XS.map(squareWave);

/** Square wave + its Fourier partial sum S_N, with a slider on the number of harmonics. */
export default function GibbsFigure(_: FigureProps) {
  const [terms, setTerms] = useState(8);
  const approx = useMemo(() => XS.map((x) => squareWavePartialSum(x, terms)), [terms]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={[-1.35, 1.35]}>
        {({ path }) => (
          <>
            {/* the ideal square wave (target) */}
            <path
              d={path(XS, TARGET)}
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth={1.4}
              strokeDasharray="4 3"
            />
            {/* the partial-sum approximation (the accent curve) */}
            <path d={path(XS, approx)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
          </>
        )}
      </FigureFrame>
      <RangeControl
        min={1}
        max={60}
        value={terms}
        onChange={setTerms}
        label={`N = ${terms}`}
        ariaLabel="Number of harmonics in the partial sum"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        The ~9% overshoot at the jump narrows but never shrinks as N grows.
      </figcaption>
    </figure>
  );
}
