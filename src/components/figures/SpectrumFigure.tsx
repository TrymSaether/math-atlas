import { useMemo, useState } from "react";

import { VIEW } from "../../lib/figures/plot";
import { type WaveKind, waveCoeff } from "../../lib/figures/fourierMath";
import { WaveSelect } from "./WaveSelect";
import { type FigureProps } from "./types";

const CAPTION: Record<WaveKind, string> = {
  square: "Only odd harmonics; magnitudes fall like 1/k.",
  sawtooth: "All harmonics present, each with magnitude 2/k.",
  triangle: "Odd harmonics decaying like 1/k² — far faster than the square wave.",
};

/**
 * Bar chart of Fourier-coefficient magnitudes |c_k| for a chosen waveform.
 * Makes the decay rate (and which harmonics vanish) visible at a glance.
 */
export default function SpectrumFigure(_: FigureProps) {
  const [kind, setKind] = useState<WaveKind>("square");
  const N = 14;

  const bars = useMemo(() => {
    const vals = Array.from({ length: N }, (_, i) => waveCoeff(kind, i + 1));
    const max = Math.max(...vals, 1e-9);
    return vals.map((v) => v / max);
  }, [kind]);

  const { w, h, padX, padY } = VIEW;
  const innerW = w - 2 * padX;
  const innerH = h - 2 * padY;
  const slot = innerW / N;
  const barW = slot * 0.6;
  const baseline = h - padY;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line
          x1={padX}
          y1={baseline}
          x2={w - padX}
          y2={baseline}
          stroke="var(--fg-4)"
          strokeWidth={1}
        />
        {bars.map((v, i) => {
          const cx = padX + slot * (i + 0.5);
          const bh = v * innerH;
          const zero = v < 1e-6;
          return (
            <g key={i}>
              {!zero && (
                <rect
                  x={cx - barW / 2}
                  y={baseline - bh}
                  width={barW}
                  height={bh}
                  rx={1.5}
                  fill="var(--accent)"
                />
              )}
              {/* faint tick + harmonic index */}
              {(i + 1) % 2 === 1 && (
                <text
                  x={cx}
                  y={baseline + 9}
                  textAnchor="middle"
                  fontSize={7}
                  fill="var(--fg-3)"
                >
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <WaveSelect value={kind} onChange={setKind} />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {CAPTION[kind]}
      </figcaption>
    </figure>
  );
}
