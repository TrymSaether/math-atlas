import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { gaussian } from "../../lib/figures/fourierMath";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const XS = linspace(-6, 6, 400);

const CAPTION: Record<string, string> = {
  gaussian_transform:
    "The Gaussian is its own Fourier transform: narrowing one width (solid) widens the other (dashed).",
  uncertainty_principle:
    "Concentrating in space (solid) forces spreading in frequency (dashed): the product of widths is bounded below.",
};

/**
 * A Gaussian e^{−x²/2σ²} (solid) drawn with its Fourier transform, another
 * Gaussian of reciprocal width 1/σ (dashed). The σ slider makes the
 * space–frequency trade-off concrete. Serves both the self-dual-Gaussian node
 * and the uncertainty principle.
 */
export default function GaussianFigure({ nodeId }: FigureProps) {
  // slider 20..200 → σ in 0.2..2.0
  const [raw, setRaw] = useState(100);
  const sigma = raw / 100;
  const freqSigma = 1 / sigma; // width of the transform

  const space = useMemo(() => XS.map((x) => gaussian(x, sigma)), [sigma]);
  const freq = useMemo(() => XS.map((x) => gaussian(x, freqSigma)), [freqSigma]);

  const caption = CAPTION[nodeId] ?? CAPTION.gaussian_transform;

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-6, 6]} yDomain={[-0.08, 1.12]}>
        {({ path }) => (
          <>
            <path
              d={path(XS, freq)}
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <path d={path(XS, space)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
          </>
        )}
      </FigureFrame>
      <RangeControl
        min={20}
        max={200}
        value={raw}
        onChange={setRaw}
        label={`\\sigma = ${sigma.toFixed(2)}`}
        ariaLabel="Gaussian width sigma"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {caption}
      </figcaption>
    </figure>
  );
}
