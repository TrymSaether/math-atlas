import { useMemo, useState } from "react";

import { MathText } from "@/math/MathText";
import {
  DIA,
  DOT,
  FONT,
  FigureCaption,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  Polyline,
  STROKE,
  Text,
  Vector,
  type Vec2,
} from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";
import { type FigureProps } from "../core/types";

const ELLIPSE_STEPS = 160;

function ellipsePoints(a: number, b: number): Vec2[] {
  return Array.from({ length: ELLIPSE_STEPS + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / ELLIPSE_STEPS;
    return [a * Math.cos(t), b * Math.sin(t)];
  });
}

function unitCirclePoints(): Vec2[] {
  return Array.from({ length: ELLIPSE_STEPS + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / ELLIPSE_STEPS;
    return [Math.cos(t), Math.sin(t)];
  });
}

function singularValues(decay: number): number[] {
  return Array.from({ length: 12 }, (_, i) => decay ** i);
}

function CompactOperatorModel() {
  const [decay, setDecay] = useState(0.62);
  const values = useMemo(() => singularValues(decay), [decay]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.25, 12.75]} yDomain={[-0.16, 1.12]} height={190} grid={false}>
        <Line.Segment point1={[0.5, 0]} point2={[12.5, 0]} color={DIA.muted} weight={STROKE.guide} />
        {values.map((value, i) => {
          const n = i + 1;
          const x0 = n - 0.28;
          const x1 = n + 0.28;
          const isTail = n >= 8;
          return (
            <g key={n}>
              <Polygon
                points={[
                  [x0, 0],
                  [x0, value],
                  [x1, value],
                  [x1, 0],
                ]}
                color={isTail ? DIA.codomain : DIA.accent}
                fillOpacity={isTail ? 0.65 : 0.9}
                strokeOpacity={0}
              />
              {(n === 1 || n === 6 || n === 12) && (
                <Text x={n} y={-0.1} color={DIA.ref} size={FONT.tick}>
                  {n}
                </Text>
              )}
            </g>
          );
        })}
        <Line.Segment point1={[0.5, 0.08]} point2={[12.5, 0.08]} color={DIA.ref} weight={STROKE.hair} style="dashed" />
        <LaTeX at={[2.25, 1.01]} tex={String.raw`\|Te_n\|`} color={DIA.text} />
        <LaTeX at={[10.25, 0.19]} tex={String.raw`\|Te_n\|\to 0`} color={DIA.codomain} />
      </FigureFrame>
      <RangeControl
        min={0.35}
        max={0.9}
        step={0.01}
        value={decay}
        onChange={setDecay}
        label={`q = ${decay.toFixed(2)}`}
        ariaLabel="Singular value decay ratio"
      />
      <FigureCaption>
        <MathText text="A compact diagonal model sends $e_n$ to $q^{n-1}e_n$; the image of the unit ball has tails that shrink toward zero." />
      </FigureCaption>
    </figure>
  );
}

function OperatorNormModel({ nodeId }: FigureProps) {
  const [stretch, setStretch] = useState(1.65);
  const minor = 0.58;
  const ellipse = useMemo(() => ellipsePoints(stretch, minor), [stretch]);
  const circle = useMemo(() => unitCirclePoints(), []);
  const label = nodeId === "operator_norm" ? "$\\|T\\|$" : "$\\|Tx\\|\\le C\\|x\\|$";

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-2.15, 2.15]} yDomain={[-1.35, 1.35]} height={190} grid>
        <Polyline points={circle} color={DIA.ref} weight={STROKE.hair} />
        <Polyline points={ellipse} color={DIA.accent} weight={STROKE.curve} />
        <Line.Segment point1={[-stretch, 0]} point2={[stretch, 0]} color={DIA.accent} weight={STROKE.mark} />
        <Line.Segment point1={[0, -minor]} point2={[0, minor]} color={DIA.codomain} weight={STROKE.mark} />
        <Vector tail={[0, 0]} tip={[1, 0]} color={DIA.ref} weight={STROKE.guide} />
        <Vector tail={[0, 0]} tip={[stretch, 0]} color={DIA.alert} weight={STROKE.curve} />
        <Point x={1} y={0} color={DIA.ref} svgCircleProps={{ r: DOT.small }} />
        <Point x={stretch} y={0} color={DIA.alert} svgCircleProps={{ r: DOT.hub }} />
        <LaTeX at={[-1.68, 1.03]} tex={String.raw`B_X`} color={DIA.ref} />
        <LaTeX at={[0.88, 0.78]} tex={String.raw`T(B_X)`} color={DIA.accent} />
        <LaTeX at={[stretch - 0.28, -0.22]} tex={String.raw`\sup`} color={DIA.alert} />
      </FigureFrame>
      <RangeControl
        min={0.75}
        max={2}
        step={0.05}
        value={stretch}
        onChange={setStretch}
        label={`C = ${stretch.toFixed(2)}`}
        ariaLabel="Operator stretch bound"
      />
      <FigureCaption>
        <MathText text={`${label} is read from the largest radius of the image of the domain unit ball.`} />
      </FigureCaption>
    </figure>
  );
}

export default function FunctionalOperatorFigure(props: FigureProps) {
  if (props.nodeId === "compact_operator") return <CompactOperatorModel />;
  return <OperatorNormModel {...props} />;
}
