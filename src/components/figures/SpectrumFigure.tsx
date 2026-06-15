import { useMemo, useState } from "react";

import { type WaveKind, waveCoeff } from "../../lib/figures/fourierMath";
import { DIA, FONT, FigureFrame, Line, Polygon, STROKE, Text } from "./FigureFrame";
import { WaveSelect } from "./WaveSelect";

const CAPTION: Record<WaveKind, string> = {
  square: "Only odd harmonics; magnitudes fall like 1/k.",
  sawtooth: "All harmonics present, each with magnitude 2/k.",
  triangle: "Odd harmonics decaying like 1/k² — far faster than the square wave.",
};

/**
 * Bar chart of Fourier-coefficient magnitudes |c_k| for a chosen waveform.
 * Makes the decay rate (and which harmonics vanish) visible at a glance.
 */
export default function SpectrumFigure() {
  const [kind, setKind] = useState<WaveKind>("square");
  const N = 14;

  const bars = useMemo(() => {
    const vals = Array.from({ length: N }, (_, i) => waveCoeff(kind, i + 1));
    const max = Math.max(...vals, 1e-9);
    return vals.map((v) => v / max);
  }, [kind]);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.25, N + 0.75]} yDomain={[-0.14, 1.08]} grid={false}>
        <Line.Segment
          point1={[0.5, 0]}
          point2={[N + 0.5, 0]}
          color={DIA.muted}
          weight={STROKE.guide}
        />
        {bars.map((v, i) => {
          const k = i + 1;
          const x0 = k - 0.28;
          const x1 = k + 0.28;
          const zero = v < 1e-6;
          return (
            <g key={i}>
              {!zero && (
                <Polygon
                  points={[
                    [x0, 0],
                    [x0, v],
                    [x1, v],
                    [x1, 0],
                  ]}
                  color={DIA.accent}
                  fillOpacity={0.92}
                  strokeOpacity={0}
                />
              )}
              {k % 2 === 1 && (
                <Text x={k} y={-0.08} color={DIA.ref} size={FONT.tick}>
                  {k}
                </Text>
              )}
            </g>
          );
        })}
      </FigureFrame>
      <WaveSelect value={kind} onChange={setKind} />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {CAPTION[kind]}
      </figcaption>
    </figure>
  );
}
