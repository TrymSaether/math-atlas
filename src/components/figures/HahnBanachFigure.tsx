import { useMemo, useState } from "react";

import {
  DIA,
  DOT,
  FONT,
  FigureFrame,
  Line,
  Point,
  Polygon,
  STROKE,
  Text,
  type Domain,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";

const UNIT_BALL: Vec2[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const VIEW_X: Domain = [-1.55, 1.55];
const VIEW_Y: Domain = [-1.28, 1.28];

function levelSet(alpha: number): [Vec2, Vec2] {
  const points: Vec2[] = [];
  for (const x of VIEW_X) {
    points.push([x, (1 - x) / alpha]);
  }
  for (const y of VIEW_Y) {
    points.push([1 - alpha * y, y]);
  }

  const inside = points.filter(
    ([x, y]) => x >= VIEW_X[0] && x <= VIEW_X[1] && y >= VIEW_Y[0] && y <= VIEW_Y[1],
  );

  if (inside.length < 2) {
    return [
      [1, VIEW_Y[0]],
      [1, VIEW_Y[1]],
    ];
  }

  return [inside[0], inside[1]];
}

/**
 * A 2D normed-space model of Hahn-Banach. The x-axis is the original subspace
 * V with f(t,0)=t. Each slider value gives an extension F(x,y)=x+alpha y whose
 * level line F=1 still supports the l1 unit ball, so the functional norm stays 1.
 */
export default function HahnBanachFigure() {
  const [alpha, setAlpha] = useState(0.45);
  const [a, b] = useMemo(() => levelSet(alpha), [alpha]);
  const absAlpha = Math.abs(alpha);
  const boundColor = absAlpha <= 1 ? DIA.ok : DIA.alert;

  return (
    <figure className="m-0">
      <FigureFrame xDomain={VIEW_X} yDomain={VIEW_Y} height={190} grid>
        <Polygon
          points={UNIT_BALL}
          color={DIA.codomain}
          fillOpacity={0.1}
          strokeOpacity={1}
          weight={STROKE.ref}
        />
        <Line.Segment
          point1={[-1.42, 0]}
          point2={[1.42, 0]}
          color={DIA.accent}
          weight={STROKE.curve}
        />
        <Line.Segment
          point1={[0, -1.16]}
          point2={[0, 1.16]}
          color={DIA.muted}
          weight={STROKE.guide}
        />
        <Line.Segment point1={a} point2={b} color={DIA.ok} weight={STROKE.curve} />
        <Line.Segment
          point1={[1, -0.18]}
          point2={[1, 0.18]}
          color={DIA.muted}
          weight={STROKE.hair}
        />
        <Point x={1} y={0} color={DIA.ok} svgCircleProps={{ r: DOT.hub }} />
        <Point x={0} y={0} color={DIA.text} svgCircleProps={{ r: DOT.small }} />

        <Text x={-1.18} y={0.13} color={DIA.accent} size={FONT.label}>
          V
        </Text>
        <Text x={0.17} y={1.02} color={DIA.muted} size={FONT.tick}>
          new direction
        </Text>
        <Text x={0.46} y={0.78} color={DIA.codomain} size={FONT.tick}>
          p≤1
        </Text>
        <Text x={1.1} y={0.14} color={DIA.ok} size={FONT.tick}>
          f=1
        </Text>
        <Text x={-1.3} y={-0.94} color={DIA.ok} size={FONT.tick}>
          F=1
        </Text>
        <Text x={0.45} y={-1.03} color={boundColor} size={FONT.tick}>
          ||F||=||f||
        </Text>
      </FigureFrame>
      <RangeControl
        min={-1}
        max={1}
        step={0.05}
        value={alpha}
        onChange={setAlpha}
        label={`$\\alpha = ${alpha.toFixed(2)}$`}
        ariaLabel="Extension coefficient alpha"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        On the subspace, f(t,0)=t. Hahn-Banach lets F(x,y)=x+αy extend it to the whole plane while
        preserving the same bound.
      </figcaption>
    </figure>
  );
}
