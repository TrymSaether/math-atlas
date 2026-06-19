import { useMemo, useState } from "react";

import { MathText } from "../../lib/katex";
import {
  DIA,
  DOT,
  FONT,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  Polygon,
  STROKE,
  Text,
  Vector,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

function scale([x, y]: Vec2, t: number): Vec2 {
  return [t * x, t * y];
}

function projection(point: Vec2, angle: number): Vec2 {
  const u: Vec2 = [Math.cos(angle), Math.sin(angle)];
  return scale(u, dot(point, u));
}

function SpectralBars() {
  const [decay, setDecay] = useState(0.68);
  const values = useMemo(() => Array.from({ length: 9 }, (_, i) => (i === 0 ? 1 : decay ** i)), [decay]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.25, 9.75]} yDomain={[-0.2, 1.15]} height={190} grid={false}>
        <Line.Segment point1={[0.5, 0]} point2={[9.5, 0]} color={DIA.muted} weight={STROKE.guide} />
        {values.map((lambda, i) => {
          const k = i + 1;
          return (
            <g key={k}>
              <Polygon
                points={[
                  [k - 0.25, 0],
                  [k - 0.25, lambda],
                  [k + 0.25, lambda],
                  [k + 0.25, 0],
                ]}
                color={k === 1 ? DIA.alert : DIA.accent}
                fillOpacity={0.85}
                strokeOpacity={0}
              />
              <Text x={k} y={-0.11} color={DIA.ref} size={FONT.tick}>
                {k}
              </Text>
            </g>
          );
        })}
        <LaTeX at={[1.7, 1.03]} tex={String.raw`r(T)`} color={DIA.alert} />
        <LaTeX at={[5, 1.03]} tex={String.raw`\lambda_k=r^{k-1}`} color={DIA.accent} />
      </FigureFrame>
      <RangeControl
        min={0.35}
        max={0.9}
        step={0.01}
        value={decay}
        onChange={setDecay}
        label={`r = ${decay.toFixed(2)}`}
        ariaLabel="Eigenvalue decay ratio"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        <MathText text="A compact self-adjoint model diagonalizes into orthonormal eigenvectors; nonzero eigenvalues can only accumulate at 0." />
      </figcaption>
    </figure>
  );
}

function ProjectionModel() {
  const [degrees, setDegrees] = useState(24);
  const angle = (degrees * Math.PI) / 180;
  const x: Vec2 = [1.25, 0.78];
  const p = projection(x, angle);
  const lineEnd: Vec2 = [1.65 * Math.cos(angle), 1.65 * Math.sin(angle)];
  const lineStart: Vec2 = [-lineEnd[0], -lineEnd[1]];

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-1.75, 1.75]} yDomain={[-1.25, 1.45]} height={190} grid>
        <Line.Segment point1={lineStart} point2={lineEnd} color={DIA.codomain} weight={STROKE.curve} />
        <Line.Segment point1={p} point2={x} color={DIA.alert} weight={STROKE.mark} style="dashed" />
        <Vector tail={[0, 0]} tip={x} color={DIA.accent} weight={STROKE.curve} />
        <Vector tail={[0, 0]} tip={p} color={DIA.ok} weight={STROKE.curve} />
        <Point x={x[0]} y={x[1]} color={DIA.accent} svgCircleProps={{ r: DOT.hub }} />
        <Point x={p[0]} y={p[1]} color={DIA.ok} svgCircleProps={{ r: DOT.hub }} />
        <LaTeX at={[x[0] + 0.08, x[1] + 0.09]} tex={String.raw`x`} color={DIA.accent} />
        <LaTeX at={[p[0] + 0.08, p[1] - 0.13]} tex={String.raw`Px`} color={DIA.ok} />
        <LaTeX at={[-1.43, lineStart[1] + 0.16]} tex={String.raw`C`} color={DIA.codomain} />
        <LaTeX at={[0.83, 0.22]} tex={String.raw`x-Px`} color={DIA.alert} />
      </FigureFrame>
      <RangeControl
        min={-35}
        max={45}
        value={degrees}
        onChange={setDegrees}
        label={`theta = ${degrees}^\\circ`}
        ariaLabel="Projection subspace angle"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        <MathText text="The nearest point $Px$ is characterized by an error vector orthogonal to the closed convex set or subspace." />
      </figcaption>
    </figure>
  );
}

export default function HilbertSpectralFigure({ nodeId }: FigureProps) {
  if (nodeId === "projection_operator" || nodeId === "projection_theorem") return <ProjectionModel />;
  return <SpectralBars />;
}
