import { useState } from "react";

import { MathText } from "../../lib/katex";
import {
  DIA,
  DOT,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polyline,
  STROKE,
  Vector,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const U: Vec2 = [1.5, 0];
const VLEN = 1.25;

function arc(radius: number, a0: number, a1: number): Vec2[] {
  const N = 24;
  return Array.from({ length: N + 1 }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / N;
    return [radius * Math.cos(t), radius * Math.sin(t)] as Vec2;
  });
}

export default function InnerProductFigure({ nodeId }: FigureProps) {
  const [degrees, setDegrees] = useState(55);
  const theta = (degrees * Math.PI) / 180;
  const v: Vec2 = [VLEN * Math.cos(theta), VLEN * Math.sin(theta)];

  const uLen = Math.hypot(U[0], U[1]);
  const dotUV = U[0] * v[0] + U[1] * v[1];
  const projLen = dotUV / uLen; // signed length of v along u
  const proj: Vec2 = [(projLen / uLen) * U[0], (projLen / uLen) * U[1]];
  const orthogonal = Math.abs(degrees - 90) < 3;

  return (
    <figure className="m-0">
      <FigureFrame
        xDomain={[-0.6, 2.0]}
        yDomain={[-0.5, 1.5]}
        height={190}
        grid
      >
        {/* angle arc between u and v */}
        <Polyline
          points={arc(0.42, 0, theta)}
          color={DIA.alert}
          weight={STROKE.mark}
        />
        {/* projection of v onto u */}
        <Line.Segment
          point1={v}
          point2={proj}
          color={DIA.ok}
          weight={STROKE.mark}
          style="dashed"
        />
        <Vector tail={[0, 0]} tip={proj} color={DIA.ok} weight={STROKE.ref} />
        {/* the two vectors */}
        <Vector
          tail={[0, 0]}
          tip={U}
          color={DIA.accent}
          weight={STROKE.curve}
        />
        <Vector
          tail={[0, 0]}
          tip={v}
          color={DIA.codomain}
          weight={STROKE.curve}
        />
        <Point
          x={proj[0]}
          y={proj[1]}
          color={DIA.ok}
          svgCircleProps={{ r: DOT.base }}
        />
        {orthogonal && (
          <Polyline
            points={[
              [0.16, 0],
              [0.16, 0.16],
              [0, 0.16],
            ]}
            color={DIA.alert}
            weight={STROKE.hair}
          />
        )}
        <LaTeX
          at={[U[0] + 0.05, -0.12]}
          tex={String.raw`u`}
          color={DIA.accent}
        />
        <LaTeX
          at={[v[0] - 0.05, v[1] + 0.12]}
          tex={String.raw`v`}
          color={DIA.codomain}
        />
        <LaTeX at={[0.5, 0.18]} tex={String.raw`\theta`} color={DIA.alert} />
      </FigureFrame>
      <RangeControl
        min={0}
        max={150}
        value={degrees}
        onChange={setDegrees}
        label={`\\theta = ${degrees}^\\circ`}
        ariaLabel="Angle between vectors"
      />
      <figcaption
        className="mt-1.5 space-y-1 text-ui-meta"
        style={{ color: "var(--fg-3)" }}
      >
        <div className="font-math" style={{ color: "var(--fg-2)" }}>
          <MathText
            text={`$\\langle u,v\\rangle=\\|u\\|\\,\\|v\\|\\cos\\theta=${dotUV.toFixed(2)}$`}
          />
        </div>
        <MathText
          text={
            nodeId === "hilbert_space"
              ? "An inner product makes angle, length, and orthogonal projection meaningful; a Hilbert space adds completeness, so every Cauchy sequence has a limit."
              : orthogonal
                ? "At $\\theta=90^\\circ$ the inner product vanishes: $u\\perp v$ and the projection of $v$ onto $u$ collapses to $0$."
                : "The inner product reads off the projection of one vector onto another; it is positive, negative, or zero as $\\theta$ is acute, obtuse, or right."
          }
        />
      </figcaption>
    </figure>
  );
}
