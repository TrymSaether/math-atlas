import { type ReactNode } from "react";
import {
  Circle,
  Coordinates,
  Ellipse,
  LaTeX,
  Mafs,
  Plot,
  Line,
  Point,
  Polygon,
  Polyline,
  Text,
  Theme,
  Transform,
  Vector,
  useMovablePoint,
  useStopwatch,
  vec,
} from "mafs";

import "mafs/core.css";

export type Domain = [number, number];
export type Vec2 = [number, number];

function finite(value: number): number {
  return Number.isFinite(value) ? value : Number.NaN;
}

/**
 * Shared Mafs shell for compact side-panel figures. It owns pan/zoom defaults,
 * theme wiring, grid density, and stable dimensions; individual figures only
 * describe mathematical objects in Mafs coordinates.
 */
export function FigureFrame({
  xDomain,
  yDomain,
  height = 180,
  axes = true,
  grid = false,
  children,
}: {
  xDomain: Domain;
  yDomain: Domain;
  height?: number;
  axes?: boolean;
  grid?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="atlas-mafs-frame" role="img">
      <Mafs
        height={height}
        pan={false}
        zoom={false}
        preserveAspectRatio={false}
        viewBox={{ x: xDomain, y: yDomain }}
      >
        {grid && (
          <Coordinates.Cartesian
            subdivisions={2}
            xAxis={{ labels: () => "" }}
            yAxis={{ labels: () => "" }}
          />
        )}
        {axes && <Axes xDomain={xDomain} yDomain={yDomain} />}
        {children}
      </Mafs>
    </div>
  );
}

export function Axes({
  xDomain,
  yDomain,
  color = "var(--fg-4)",
}: {
  xDomain: Domain;
  yDomain: Domain;
  color?: string;
}) {
  return (
    <>
      {yDomain[0] <= 0 && yDomain[1] >= 0 && (
        <Line.Segment point1={[xDomain[0], 0]} point2={[xDomain[1], 0]} color={color} weight={1} />
      )}
      {xDomain[0] <= 0 && xDomain[1] >= 0 && (
        <Line.Segment point1={[0, yDomain[0]]} point2={[0, yDomain[1]]} color={color} weight={1} />
      )}
    </>
  );
}

export function FunctionCurve({
  y,
  domain,
  color = "var(--accent)",
  weight = 2,
  opacity = 1,
  style = "solid",
}: {
  y: (x: number) => number;
  domain: Domain;
  color?: string;
  weight?: number;
  opacity?: number;
  style?: "solid" | "dashed";
}) {
  return (
    <Plot.OfX
      y={(x) => finite(y(x))}
      domain={domain}
      color={color}
      weight={weight}
      opacity={opacity}
      style={style}
      minSamplingDepth={9}
      maxSamplingDepth={14}
    />
  );
}

/**
 * A straight arrow between two points in figure coordinates, with a solid
 * triangular head. Shared by the set-mapping figures so every "x maps to y"
 * arrow looks identical. Use Mafs `Vector` instead for measurement annotations
 * (a width, a shift) — arrows are for maps between elements.
 */
export function Arrow({
  from,
  to,
  color = "var(--accent)",
  weight = 1.4,
  opacity = 1,
  style = "solid",
}: {
  from: Vec2;
  to: Vec2;
  color?: string;
  weight?: number;
  opacity?: number;
  style?: "solid" | "dashed";
}) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const tip: Vec2 = [to[0] - 0.12 * ux, to[1] - 0.12 * uy];
  const base: Vec2 = [to[0] - 0.34 * ux, to[1] - 0.34 * uy];
  const head: Vec2[] = [
    tip,
    [base[0] + 0.12 * px, base[1] + 0.12 * py],
    [base[0] - 0.12 * px, base[1] - 0.12 * py],
  ];

  return (
    <g opacity={opacity}>
      <Line.Segment point1={from} point2={tip} color={color} weight={weight} style={style} />
      <Polygon points={head} color={color} fillOpacity={1} strokeOpacity={1} weight={1} />
    </g>
  );
}

export function SamplePoints({
  points,
  color = "var(--accent)",
  radius = 3.5,
  opacity = 1,
}: {
  points: Vec2[];
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  return (
    <>
      {points.map(([x, y], i) => (
        <Point
          key={`${x.toFixed(4)}:${i}`}
          x={x}
          y={y}
          color={color}
          opacity={opacity}
          svgCircleProps={{ r: radius }}
        />
      ))}
    </>
  );
}

export { DIA, DOT, FONT, PANEL_BACKING, STROKE } from "./tokens";

export {
  Circle,
  Ellipse,
  LaTeX,
  Line,
  Plot,
  Point,
  Polygon,
  Polyline,
  Text,
  Theme,
  Transform,
  Vector,
  useMovablePoint,
  useStopwatch,
  vec,
};
