import { type ReactNode } from "react";
import {
  Circle,
  Coordinates,
  Ellipse,
  LaTeX,
  Mafs,
  Plot,
  Line,
  MovablePoint,
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
import { DIA, DOT, FIGURE, PANEL_BACKING, STROKE, UI } from "./tokens";

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
  height = FIGURE.height,
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
        viewBox={{ x: xDomain, y: yDomain, padding: 0 }}
      >
        {grid && (
          // axis:false suppresses the Mafs origin lines; grid lines are kept
          <Coordinates.Cartesian
            subdivisions={2}
            xAxis={{ axis: false, labels: () => "" }}
            yAxis={{ axis: false, labels: () => "" }}
          />
        )}
        {axes && <Axes xDomain={xDomain} yDomain={yDomain} />}
        {children}
      </Mafs>
    </div>
  );
}

export function Axes({ xDomain, yDomain, color = DIA.ink }: { xDomain: Domain; yDomain: Domain; color?: string }) {
  return (
    <>
      {yDomain[0] <= 0 && yDomain[1] >= 0 && (
        <Line.Segment point1={[xDomain[0], 0]} point2={[xDomain[1], 0]} color={color} weight={STROKE.guide} />
      )}
      {xDomain[0] <= 0 && xDomain[1] >= 0 && (
        <Line.Segment point1={[0, yDomain[0]]} point2={[0, yDomain[1]]} color={color} weight={STROKE.guide} />
      )}
    </>
  );
}

export function FunctionCurve({
  y,
  domain,
  color = DIA.accent,
  weight = STROKE.curve,
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

export function FunctionBand({
  upper,
  lower,
  color = DIA.ok,
  opacity = 0.12,
}: {
  upper: (x: number) => number;
  lower: (x: number) => number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Plot.Inequality
      y={{ "<=": (x) => finite(upper(x)), ">=": (x) => finite(lower(x)) }}
      fillColor={color}
      fillOpacity={opacity}
      strokeOpacity={0}
    />
  );
}

export function FigureCaption({
  children,
  className = "",
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  const spacing = className ? ` ${className}` : "";
  return (
    <figcaption className={`mt-1.5 text-ui-meta${spacing}`} style={{ color: strong ? UI.text : UI.muted }}>
      {children}
    </figcaption>
  );
}

export function FigureOverlayLabel({
  children,
  position = "top-left",
}: {
  children: ReactNode;
  position?: "top-left" | "bottom-left";
}) {
  const positionClass = position === "bottom-left" ? "bottom-2 left-3" : "left-3 top-2 z-10";
  return (
    <div
      className={`absolute ${positionClass} rounded-xs px-1.5 py-0.5 text-ui-meta backdrop-blur-sm`}
      style={{ color: UI.text, background: PANEL_BACKING }}
    >
      {children}
    </div>
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
  color = DIA.accent,
  weight = STROKE.mark,
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
  const head: Vec2[] = [tip, [base[0] + 0.12 * px, base[1] + 0.12 * py], [base[0] - 0.12 * px, base[1] - 0.12 * py]];

  return (
    <g opacity={opacity}>
      <Line.Segment point1={from} point2={tip} color={color} weight={weight} style={style} />
      <Polygon points={head} color={color} fillOpacity={1} strokeOpacity={1} weight={STROKE.guide} />
    </g>
  );
}

export function SamplePoints({
  points,
  color = DIA.accent,
  radius = DOT.base,
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

export { DIA, DOT, FIGURE, FONT, HEAT, PANEL_BACKING, SERIES, STROKE, UI } from "./tokens";

export {
  Circle,
  Ellipse,
  LaTeX,
  Line,
  MovablePoint,
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
