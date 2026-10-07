import { useMemo } from "react";

import { boxConvolution } from "../../lib/figures/fourierMath";
import { MathText } from "../../lib/katex";
import {
  DIA,
  FONT,
  FigureFrame,
  FunctionCurve,
  Line,
  PANEL_BACKING,
  Point,
  Polygon,
  STROKE,
  Text,
  Transform,
  Vector,
  useMovablePoint,
} from "./FigureFrame";
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
  const shift = useMovablePoint([-1.2, 1.2], {
    color: "var(--accent)",
    constrain: ([x]) => [Math.min(3, Math.max(-3, x)), 1.2],
  });
  const s = shift.x;

  const overlap = useMemo(() => overlapPoints(s), [s]);
  const value = boxConvolution(s);

  return (
    <figure className="m-0">
      <div className="space-y-2">
        <section
          className="relative overflow-hidden rounded-[var(--radius-lg)] border"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div
            className="absolute left-3 top-2 z-10 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-ui-meta backdrop-blur-sm"
            style={{ color: "var(--fg-2)", background: PANEL_BACKING }}
          >
            <MathText text={`$f(t)$ fixed, $g(s-t)$ sliding`} />
          </div>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.25, 1.45]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color={DIA.muted} />

            <Polygon points={boxPoints(0)} color={DIA.faint} />
            <Transform translate={[s, 0]}>
              <Polygon points={boxPoints(0)} color={DIA.accent} />
              <Line.Segment point1={[-1, 0]} point2={[-1, 1]} color={DIA.accent} />
              <Line.Segment point1={[1, 0]} point2={[1, 1]} color={DIA.accent} />
            </Transform>
            {overlap && (
              <Polygon points={overlap} color={DIA.alert} fillOpacity={0.38} strokeOpacity={0.95} weight={STROKE.mark} />
            )}

            <Line.Segment point1={[-1, 0]} point2={[-1, 1]} color={DIA.faint} />
            <Line.Segment point1={[1, 0]} point2={[1, 1]} color={DIA.faint} />

            <Line.Segment point1={[-3, 1.2]} point2={[3, 1.2]} color={DIA.muted} weight={STROKE.guide} style="dashed" />
            <Vector tail={[0, 1.2]} tip={[s, 1.2]} color={DIA.accent} weight={STROKE.mark} />
            <Text x={s} y={1.35} color={DIA.accent} size={FONT.tick}>
              s
            </Text>
            {shift.element}
          </FigureFrame>

          <div
            className="absolute bottom-2 left-3 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-ui-meta backdrop-blur-sm"
            style={{ background: PANEL_BACKING }}
          >
            <MathText text={`$s=${s.toFixed(1)},\\quad \\operatorname{overlap}=${value.toFixed(2)}$`} />
          </div>
        </section>

        <section
          className="relative overflow-hidden rounded-[var(--radius-lg)] border"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div
            className="absolute left-3 top-2 z-10 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-ui-meta backdrop-blur-sm"
            style={{ color: "var(--fg-2)", background: PANEL_BACKING }}
          >
            <MathText text={`$(f*g)(s)=\\int_{-\\infty}^{\\infty} f(t)g(s-t)\\,dt$`} />
          </div>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.35, 2.35]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color={DIA.muted} />
            <Line.Segment point1={[s, 0]} point2={[s, value]} color={DIA.muted} />

            <FunctionCurve y={boxConvolution} domain={[-2, 2]} color={DIA.accent} weight={STROKE.curve} />

            <Point x={s} y={value} color={DIA.alert} />
            <Vector tail={[s, 0]} tip={[s, value]} color={DIA.alert} weight={STROKE.mark} />
          </FigureFrame>

          <div
            className="absolute bottom-2 left-3 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-ui-meta backdrop-blur-sm"
            style={{ background: PANEL_BACKING }}
          >
            <MathText text={`$s=${s.toFixed(1)},\\quad (f*g)(s)=${value.toFixed(2)}$`} />
          </div>
        </section>
      </div>

      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Drag the shift handle. The overlap area in the top panel is the value marked on the
        convolution curve below.
      </figcaption>
    </figure>
  );
}
