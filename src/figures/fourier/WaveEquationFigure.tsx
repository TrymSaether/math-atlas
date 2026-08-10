import { useState } from "react";

import { DIA, FigureCaption, FigureFrame, FunctionCurve, LaTeX, STROKE } from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";

function initialProfile(x: number): number {
  if (Math.abs(x) < 1e-9) return 2;
  return Math.sin(2 * Math.PI * x) / (Math.PI * x);
}

/** The d'Alembert split of the band-limited sinc profile in Exam 2026 Problem 4. */
export default function WaveEquationFigure() {
  const [time, setTime] = useState(2);
  const left = (x: number) => 0.5 * initialProfile(x + time / 2);
  const right = (x: number) => 0.5 * initialProfile(x - time / 2);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-5, 5]} yDomain={[-0.62, 2.2]} grid>
        <FunctionCurve
          y={initialProfile}
          domain={[-5, 5]}
          color={DIA.ref}
          weight={STROKE.ref}
          opacity={0.7}
          style="dashed"
        />
        <FunctionCurve y={left} domain={[-5, 5]} color={DIA.codomain} weight={STROKE.ref} opacity={0.72} />
        <FunctionCurve y={right} domain={[-5, 5]} color={DIA.warning} weight={STROKE.ref} opacity={0.72} />
        <FunctionCurve y={(x) => left(x) + right(x)} domain={[-5, 5]} color={DIA.accent} weight={STROKE.curve} />
        <LaTeX at={[-2.8, 1.92]} tex={String.raw`f(x)`} color={DIA.ref} />
        <LaTeX at={[-2.8, 1.55]} tex={String.raw`\frac12 f(x+t/2)`} color={DIA.codomain} />
        <LaTeX at={[-2.8, 1.18]} tex={String.raw`\frac12 f(x-t/2)`} color={DIA.warning} />
        <LaTeX at={[-2.8, 0.81]} tex={String.raw`u(x,t)`} color={DIA.accent} />
      </FigureFrame>
      <RangeControl
        min={0}
        max={8}
        step={0.1}
        value={time}
        onChange={setTime}
        label={`t = ${time.toFixed(1)}`}
        ariaLabel="Wave time"
      />
      <FigureCaption>
        The dashed sinc profile splits into two half-height copies moving left and right at speed 1/2; their sum is
        u(x,t).
      </FigureCaption>
    </figure>
  );
}
