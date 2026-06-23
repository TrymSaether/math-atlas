import { useState } from "react";

import { squareWave, squareWavePartialSum } from "../../lib/figures/fourierMath";
import { DIA, FigureCaption, FigureFrame, FunctionCurve, STROKE } from "./FigureFrame";
import { RangeControl } from "./RangeControl";

/** Square wave + its Fourier partial sum S_N, with a slider on the number of harmonics. */
export default function GibbsFigure() {
  const [terms, setTerms] = useState(8);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={[-1.35, 1.35]} grid>
        <FunctionCurve y={squareWave} domain={[-Math.PI, Math.PI]} color={DIA.ref} weight={STROKE.ref} style="dashed" />
        <FunctionCurve
          y={(x) => squareWavePartialSum(x, terms)}
          domain={[-Math.PI, Math.PI]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
      </FigureFrame>
      <RangeControl
        min={1}
        max={60}
        value={terms}
        onChange={setTerms}
        label={`N = ${terms}`}
        ariaLabel="Number of harmonics in the partial sum"
      />
      <FigureCaption>The ~9% overshoot at the jump narrows but never shrinks as N grows.</FigureCaption>
    </figure>
  );
}
