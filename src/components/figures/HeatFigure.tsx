import { useState } from "react";

import { heatProfile, squareWave } from "../../lib/figures/fourierMath";
import { DIA, FigureCaption, FigureFrame, FunctionCurve, STROKE } from "./FigureFrame";
import { RangeControl } from "./RangeControl";

const TERMS = 40;

/**
 * Heat flow on the circle from a square-wave initial profile. Each Fourier mode
 * decays like e^{−k²t}, so the sharp edges (high frequencies) melt first and the
 * profile relaxes toward its mean. The slider is (a log-spaced) time t.
 */
export default function HeatFigure() {
  // slider 0..100 → t from 0 up to ~0.5, spaced so early diffusion is visible
  const [raw, setRaw] = useState(0);
  const t = (raw / 100) ** 2 * 0.5;

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={[-1.35, 1.35]} grid>
        <FunctionCurve y={squareWave} domain={[-Math.PI, Math.PI]} color={DIA.ref} weight={STROKE.ref} style="dashed" />
        <FunctionCurve
          y={(x) => heatProfile(x, t, TERMS)}
          domain={[-Math.PI, Math.PI]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
      </FigureFrame>
      <RangeControl
        min={0}
        max={100}
        value={raw}
        onChange={setRaw}
        label={`t = ${t.toFixed(3)}`}
        ariaLabel="Diffusion time t"
      />
      <FigureCaption>
        Sharp edges carry the high frequencies, which decay fastest — heat flow is a low-pass filter.
      </FigureCaption>
    </figure>
  );
}
