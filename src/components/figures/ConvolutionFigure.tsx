import { useMemo, useState } from "react";

import { boxConvolution } from "../../lib/figures/fourierMath";
import { linearScale, linspace } from "../../lib/figures/plot";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const W = 320;
const H = 210;
const PAD = 14;
const X_DOMAIN: [number, number] = [-4, 4];
const sx = linearScale(X_DOMAIN, [PAD, W - PAD]);

// Top panel: the two pulses sliding past each other.
const TOP_BASE = 96; // baseline (value 0)
const TOP_TOP = 24; // value 1
// Bottom panel: the convolution curve f*g.
const BOT_BASE = 196;
const BOT_TOP = 124; // value 2 (peak of the triangle)

const SCONV = linspace(X_DOMAIN[0], X_DOMAIN[1], 240);
const CONV_PATH = (() => {
  let d = "";
  for (let i = 0; i < SCONV.length; i++) {
    const s = SCONV[i];
    const y = BOT_BASE - (boxConvolution(s) / 2) * (BOT_BASE - BOT_TOP);
    d += `${i === 0 ? "M" : "L"}${sx(s).toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
})();

/** A filled rectangle pulse on the top panel, half-width 1, centered at `c`. */
function pulseRect(c: number, fill: string, opacity: number) {
  const x0 = sx(c - 1);
  const x1 = sx(c + 1);
  return (
    <rect x={x0} y={TOP_TOP} width={x1 - x0} height={TOP_BASE - TOP_TOP} fill={fill} opacity={opacity} />
  );
}

/**
 * Convolution as a sliding overlap. Top: a fixed pulse f and a moving (flipped)
 * pulse g centered at the shift s, with their overlap shaded. Bottom: the
 * convolution (f∗g)(s) — a triangle — traced with a marker at the current s.
 * The shaded overlap area equals the marker's height.
 */
export default function ConvolutionFigure(_: FigureProps) {
  // slider -40..40 → s in [-4, 4]
  const [raw, setRaw] = useState(-12);
  const s = raw / 10;

  const overlap = useMemo(() => {
    const lo = Math.max(-1, s - 1);
    const hi = Math.min(1, s + 1);
    return hi > lo ? [lo, hi] : null;
  }, [s]);

  const markerY = BOT_BASE - (boxConvolution(s) / 2) * (BOT_BASE - BOT_TOP);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* top baseline */}
        <line x1={PAD} y1={TOP_BASE} x2={W - PAD} y2={TOP_BASE} stroke="var(--fg-4)" strokeWidth={1} />
        {/* fixed pulse f and sliding pulse g */}
        {pulseRect(0, "var(--fg-3)", 0.28)}
        {pulseRect(s, "var(--accent)", 0.22)}
        {/* shaded overlap = the integrand's support */}
        {overlap && (
          <rect
            x={sx(overlap[0])}
            y={TOP_TOP}
            width={sx(overlap[1]) - sx(overlap[0])}
            height={TOP_BASE - TOP_TOP}
            fill="var(--accent)"
            opacity={0.55}
          />
        )}
        <text x={sx(0)} y={TOP_TOP - 6} textAnchor="middle" fontSize={8} fill="var(--fg-3)">
          f
        </text>
        <text x={sx(s)} y={TOP_TOP - 6} textAnchor="middle" fontSize={8} fill="var(--accent)">
          g(s − ·)
        </text>

        {/* bottom: the convolution curve */}
        <line x1={PAD} y1={BOT_BASE} x2={W - PAD} y2={BOT_BASE} stroke="var(--fg-4)" strokeWidth={1} />
        <path d={CONV_PATH} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {/* drop line + marker at current s */}
        <line
          x1={sx(s)}
          y1={markerY}
          x2={sx(s)}
          y2={BOT_BASE}
          stroke="var(--fg-4)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <circle cx={sx(s)} cy={markerY} r={3.2} fill="var(--accent)" />
        <text x={sx(s)} y={BOT_BASE + 9} textAnchor="middle" fontSize={8} fill="var(--fg-3)">
          (f∗g)(s)
        </text>
      </svg>
      <RangeControl
        min={-40}
        max={40}
        value={raw}
        onChange={setRaw}
        label={`s = ${s.toFixed(1)}`}
        ariaLabel="Convolution shift s"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Slide one pulse across the other; the shaded overlap area is the convolution at that shift —
        here two boxes give a triangle.
      </figcaption>
    </figure>
  );
}
