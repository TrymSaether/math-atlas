import { useMemo } from "react";

import { boxConvolution } from "./fourierMath";
import { MathText } from "@/shared/math";
import {
  DIA,
  FigureCaption,
  FONT,
  FigureFrame,
  FigureOverlayLabel,
  FunctionCurve,
  Line,
  Point,
  Polygon,
  STROKE,
  Text,
  Transform,
  Vector,
} from "./FigureFrame";
import { useMovablePoint } from "./mafs";

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

export default function ConvolutionFigure() {
  const shift = useMovablePoint([-1.2, 1.2], {
    color: DIA.accent,
    constrain: ([x]) => [Math.min(3, Math.max(-3, x)), 1.2],
  });
  const s = shift.x;

  const overlap = useMemo(() => overlapPoints(s), [s]);
  const value = boxConvolution(s);

  return (
    <figure className="m-0">
      <div className="space-y-2">
        <section
          className="relative overflow-hidden rounded-lg border"
          style={{ borderColor: DIA.border, background: DIA.frame }}
        >
          <FigureOverlayLabel>
            <MathText text={`$f(t)$ fixed, $g(s-t)$ sliding`} />
          </FigureOverlayLabel>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.25, 1.45]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color={DIA.muted} />

            <Polygon points={boxPoints(0)} color={DIA.faint} />
            <Transform translate={[s, 0]}>
              <Polygon points={boxPoints(0)} color={DIA.accent} />
              <Line.Segment point1={[-1, 0]} point2={[-1, 1]} color={DIA.accent} />
              <Line.Segment point1={[1, 0]} point2={[1, 1]} color={DIA.accent} />
            </Transform>
            {overlap && (
              <Polygon
                points={overlap}
                color={DIA.alert}
                fillOpacity={0.38}
                strokeOpacity={0.95}
                weight={STROKE.mark}
              />
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

          <FigureOverlayLabel position="bottom-left">
            <MathText text={`$s=${s.toFixed(1)},\\quad \\operatorname{overlap}=${value.toFixed(2)}$`} />
          </FigureOverlayLabel>
        </section>

        <section
          className="relative overflow-hidden rounded-lg border"
          style={{ borderColor: DIA.border, background: DIA.frame }}
        >
          <FigureOverlayLabel>
            <MathText text={`$(f*g)(s)=\\int_{-\\infty}^{\\infty} f(t)g(s-t)\\,dt$`} />
          </FigureOverlayLabel>

          <FigureFrame xDomain={X_DOMAIN} yDomain={[-0.35, 2.35]} height={150} axes={false} grid>
            <Line.Segment point1={[-4, 0]} point2={[4, 0]} color={DIA.muted} />
            <Line.Segment point1={[s, 0]} point2={[s, value]} color={DIA.muted} />

            <FunctionCurve y={boxConvolution} domain={[-2, 2]} color={DIA.accent} weight={STROKE.curve} />

            <Point x={s} y={value} color={DIA.alert} />
            <Vector tail={[s, 0]} tip={[s, value]} color={DIA.alert} weight={STROKE.mark} />
          </FigureFrame>

          <FigureOverlayLabel position="bottom-left">
            <MathText text={`$s=${s.toFixed(1)},\\quad (f*g)(s)=${value.toFixed(2)}$`} />
          </FigureOverlayLabel>
        </section>
      </div>

      <FigureCaption>
        Drag the shift handle. The overlap area in the top panel is the value marked on the convolution curve below.
      </FigureCaption>
    </figure>
  );
}
