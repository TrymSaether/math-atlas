import { type ReactNode } from "react";

import { buildPath, linearScale, VIEW, type Scale } from "../../lib/figures/plot";

/** Scales + helpers handed to a figure's render function. */
export interface PlotApi {
  /** Data-x → pixel-x. */
  sx: Scale;
  /** Data-y → pixel-y (already flipped: larger y is higher on screen). */
  sy: Scale;
  /** SVG path string from sampled data, breaking on non-finite y. */
  path: (xs: number[], ys: number[]) => string;
  w: number;
  h: number;
}

/**
 * Shared themed SVG shell for every interactive figure. Owns the viewBox,
 * axes, and — crucially — the theme tokens, so each figure is just
 * "compute samples → draw a path".
 *
 * Colors use the live theme tokens (`--fg-*`, `--accent`), so figures recolor
 * correctly across all 12 themes — unlike the static SVGs, whose `--dia-*`
 * fallbacks are fixed hex.
 */
export function FigureFrame({
  xDomain,
  yDomain,
  axes = true,
  children,
}: {
  xDomain: [number, number];
  yDomain: [number, number];
  axes?: boolean;
  children: (api: PlotApi) => ReactNode;
}) {
  const { w, h, padX, padY } = VIEW;
  const sx = linearScale(xDomain, [padX, w - padX]);
  // Flip y so that larger data-y sits higher on screen.
  const sy = linearScale(yDomain, [h - padY, padY]);
  const path = (xs: number[], ys: number[]) => buildPath(xs, ys, sx, sy);

  const baselineY = yDomain[0] <= 0 && yDomain[1] >= 0 ? sy(0) : null;
  const axisX = xDomain[0] <= 0 && xDomain[1] >= 0 ? sx(0) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {axes && (
        <g stroke="var(--fg-4)" strokeWidth={1} fill="none">
          {baselineY !== null && <line x1={padX} y1={baselineY} x2={w - padX} y2={baselineY} />}
          {axisX !== null && <line x1={axisX} y1={padY} x2={axisX} y2={h - padY} />}
        </g>
      )}
      {children({ sx, sy, path, w, h })}
    </svg>
  );
}
