import { type ReactNode } from "react";
import { Coordinates, Mafs, Plot, Line, Point, Polygon, Polyline, Text } from "mafs";

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

export { Line, Plot, Point, Polygon, Polyline, Text };
