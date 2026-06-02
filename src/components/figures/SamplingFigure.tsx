import { useMemo, useState } from "react";

import { aliasFrequency } from "../../lib/figures/fourierMath";
import { linspace } from "../../lib/figures/plot";
import { FigureFrame } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const T_MAX = 4; // seconds shown
const XS = linspace(0, T_MAX, 600);
const SIGNAL_HZ = 3; // the true tone frequency

/**
 * A pure tone (solid faint) sampled at rate fs (dots), with the lowest-frequency
 * sine the samples are consistent with drawn on top (accent). Below the Nyquist
 * rate 2·f the reconstruction collapses to a slower alias — the same dots, a
 * different tune. Serves the sampling theorem and aliasing nodes.
 */
export default function SamplingFigure({ nodeId }: FigureProps) {
  // slider 20..160 → fs in 2.0..16.0 Hz
  const [raw, setRaw] = useState(40);
  const fs = raw / 10;
  const nyquistOk = fs >= 2 * SIGNAL_HZ;
  const aliasHz = aliasFrequency(SIGNAL_HZ, fs);

  const original = useMemo(() => XS.map((t) => Math.sin(2 * Math.PI * SIGNAL_HZ * t)), []);
  const alias = useMemo(() => XS.map((t) => Math.sin(2 * Math.PI * aliasHz * t)), [aliasHz]);

  const samples = useMemo(() => {
    const dt = 1 / fs;
    const pts: { t: number; y: number }[] = [];
    for (let t = 0; t <= T_MAX + 1e-9; t += dt) {
      pts.push({ t, y: Math.sin(2 * Math.PI * SIGNAL_HZ * t) });
    }
    return pts;
  }, [fs]);

  const focusAlias = nodeId === "aliasing";

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0, T_MAX]} yDomain={[-1.25, 1.25]} axes={false}>
        {({ path, sx, sy }) => (
          <>
            <line x1={0} y1={sy(0)} x2={320} y2={sy(0)} stroke="var(--fg-4)" strokeWidth={1} />
            {/* true signal, faint */}
            <path
              d={path(XS, original)}
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth={1.3}
              opacity={nyquistOk ? 0.45 : 0.7}
            />
            {/* alias only matters when undersampled */}
            {!nyquistOk && (
              <path
                d={path(XS, alias)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.8}
                strokeDasharray="5 3"
              />
            )}
            {/* sample points */}
            {samples.map((p, i) => (
              <circle key={i} cx={sx(p.t)} cy={sy(p.y)} r={2.4} fill="var(--accent)" />
            ))}
          </>
        )}
      </FigureFrame>
      <RangeControl
        min={20}
        max={160}
        value={raw}
        onChange={setRaw}
        label={`f_s = ${fs.toFixed(1)}`}
        ariaLabel="Sampling rate fs"
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {nyquistOk
          ? `f_s ≥ 2·${SIGNAL_HZ} Hz: the ${SIGNAL_HZ} Hz tone is captured faithfully.`
          : `Undersampled — the dots also fit a phantom ${aliasHz.toFixed(1)} Hz sine (dashed).` +
            (focusAlias ? " That impostor is the alias." : "")}
      </figcaption>
    </figure>
  );
}
