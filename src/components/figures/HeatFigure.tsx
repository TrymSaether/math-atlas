import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { heatProfile, squareWave } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const XS = linspace(-Math.PI, Math.PI, 600);
const INITIAL = XS.map(squareWave);
const TERMS = 40;

/**
 * Heat flow on the circle from a square-wave initial profile. Each Fourier mode
 * decays like e^{−k²t}, so the sharp edges (high frequencies) melt first and the
 * profile relaxes toward its mean. The slider is (a log-spaced) time t.
 */
export default function HeatFigure(_: FigureProps) {
  // slider 0..100 → t from 0 up to ~0.5, spaced so early diffusion is visible
  const [raw, setRaw] = useState(0);
  const t = (raw / 100) ** 2 * 0.5;

  const profile = useMemo(() => XS.map((x) => heatProfile(x, t, TERMS)), [t]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={[-1.35, 1.35]}>
        {({ path }) => (
          <>
            <path
              d={path(XS, INITIAL)}
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth={1.4}
              strokeDasharray="4 3"
            />
            <path d={path(XS, profile)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
          </>
        )}
      </FigureFrame>
      <RangeControl
        min={0}
        max={100}
        value={raw}
        onChange={setRaw}
        label={`t = ${t.toFixed(3)}`}
        ariaLabel="Diffusion time t"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Sharp edges carry the high frequencies, which decay fastest — heat flow is a low-pass filter.
      </figcaption>
    </figure>
  );
}
