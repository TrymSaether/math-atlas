import { useState } from "react";

import { MathText } from "@/math/MathText";
import {
  Circle,
  DIA,
  DOT,
  FigureCaption,
  FigureFrame,
  LaTeX,
  Line,
  Plot,
  SamplePoints,
  STROKE,
} from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";

const DOMAIN: [number, number] = [-1.38, 1.38];

function polarPoint(theta: number, radius: number): [number, number] {
  return [radius * Math.cos(theta), radius * Math.sin(theta)];
}

function closureRadius(theta: number, frequency: number): number {
  return 1 + 0.14 * Math.cos(frequency * theta) + 0.06 * Math.sin(frequency * theta);
}

export default function IntegerFrequencyFigure() {
  const [n, setN] = useState(3);
  const lambda = n + 0.5;
  const startRadius = closureRadius(0, n);
  const halfStepEndRadius = closureRadius(2 * Math.PI, lambda);
  const endpoints: [number, number][] = [polarPoint(0, startRadius), polarPoint(2 * Math.PI, startRadius)];

  return (
    <figure className="m-0">
      <FigureFrame xDomain={DOMAIN} yDomain={DOMAIN} height={220} axes={false} grid="polar">
        <Circle center={[0, 0]} radius={1} color={DIA.ref} fillOpacity={0} weight={STROKE.ref} />
        <Plot.Parametric
          xy={(theta) => polarPoint(theta, closureRadius(theta, n))}
          domain={[0, 2 * Math.PI]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
        <Plot.Parametric
          xy={(theta) => polarPoint(theta, closureRadius(theta, lambda))}
          domain={[0, 2 * Math.PI]}
          color={DIA.alert}
          weight={STROKE.ref}
          opacity={0.72}
          style="dashed"
        />
        <SamplePoints points={endpoints} color={DIA.ok} radius={DOT.hub} />
        <SamplePoints points={[polarPoint(2 * Math.PI, halfStepEndRadius)]} color={DIA.alert} radius={DOT.hub} />
        <Line.Segment
          point1={polarPoint(0, halfStepEndRadius)}
          point2={polarPoint(0, startRadius)}
          color={DIA.alert}
          weight={STROKE.mark}
          style="dashed"
        />
        <Line.Segment point1={[0, 0]} point2={polarPoint(0, startRadius)} color={DIA.ok} />
        <LaTeX at={[0.8, -1.06]} tex={String.raw`n+\frac12`} />
        <LaTeX at={[1.18, 0.1]} tex={String.raw`n`} />
      </FigureFrame>
      <RangeControl min={-5} max={5} value={n} onChange={setN} label={`n = ${n}`} ariaLabel="Integer frequency" />
      <FigureCaption>
        <MathText
          text={`Polar closure test: the integer-frequency curve closes after one $2\\pi$ turn, while the dashed $n+\\tfrac12$ curve lands at a different endpoint on $\\mathbb T$.`}
        />
      </FigureCaption>
    </figure>
  );
}
