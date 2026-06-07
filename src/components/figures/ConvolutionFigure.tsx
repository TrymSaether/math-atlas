import { useMemo, useState } from "react";

import { boxConvolution } from "../../lib/figures/fourierMath";
import { MathText } from "../../lib/katex";
import { FigureFrame, FunctionCurve, Line, Point, Polygon } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const X_DOMAIN: [number, number] = [-4, 4];

function boxPoints(center: number, height = 1): [number, number][] {
  return [
    [center - 1, 0],
    [center - 1, height],
    [center + 1, height],
    [center + 1, 0],
  ];
}

function overlapPoints(s: number): [number, number][] | null {
  const lo = Math.max(-1, s - 1);
  const hi = Math.min(1, s + 1);

  if (hi <= lo) return null;

  return [
    [lo, 0],
    [lo, 1],
    [hi, 1],
    [hi, 0],
  ];
}

export default function ConvolutionFigure(_: FigureProps) {
  const [raw, setRaw] = useState(-12);
  const s = raw / 10;

  const overlap = useMemo(() => overlapPoints(s), [s]);
  const value = boxConvolution(s);

  return (
    <figure className="m-0">
      <div className="space-y-2">
        <section
          className="relative overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div className="absolute left-3 top-2 z-10 text-ui-meta" style={{ color: "var(--fg-2)" }}>
            <MathText text={`$f(t)$ fixed, $g(s-t)$ sliding`} />
          </div>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.25, 1.45]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color="var(--fg-4)" />

            <Polygon points={boxPoints(0)} color="var(--fg-3)" />
            <Polygon points={boxPoints(s)} color="var(--accent)" />
            {overlap && <Polygon points={overlap} color="var(--accent)" />}

            <Line.Segment point1={[-1, 0]} point2={[-1, 1]} color="var(--fg-3)" />
            <Line.Segment point1={[1, 0]} point2={[1, 1]} color="var(--fg-3)" />

            <Line.Segment point1={[s - 1, 0]} point2={[s - 1, 1]} color="var(--accent)" />
            <Line.Segment point1={[s + 1, 0]} point2={[s + 1, 1]} color="var(--accent)" />
          </FigureFrame>

          <div className="absolute bottom-2 left-3 rounded-md px-2 py-1 text-ui-meta">
            <MathText text={`$s=${s.toFixed(1)},\\quad \\operatorname{overlap}=${value.toFixed(2)}$`} />
          </div>
        </section>

        <section
          className="relative overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div className="absolute left-3 top-2 z-10 text-ui-meta" style={{ color: "var(--fg-2)" }}>
            <MathText text={`$(f*g)(s)=\\int_{-\\infty}^{\\infty} f(t)g(s-t)\\,dt$`} />
          </div>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.35, 2.35]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color="var(--fg-4)" />
            <Line.Segment point1={[s, 0]} point2={[s, value]} color="var(--fg-4)" />

            <FunctionCurve y={boxConvolution} domain={[-2, 2]} color="var(--accent)" weight={2.1} />

            <Point x={s} y={value} color="var(--accent)" />
          </FigureFrame>

          <div className="absolute bottom-2 left-3 rounded-md px-2 py-1 text-ui-meta">
            <MathText text={`$s=${s.toFixed(1)},\\quad (f*g)(s)=${value.toFixed(2)}$`} />
          </div>
        </section>
      </div>

      <RangeControl
        min={-40}
        max={40}
        value={raw}
        onChange={setRaw}
        label={`s = ${s.toFixed(1)}`}
        ariaLabel="Convolution shift s"
      />

      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Slide one box across the other. The overlap area in the top panel is the value marked on the
        convolution curve below.
      </figcaption>
    </figure>
  );
}
