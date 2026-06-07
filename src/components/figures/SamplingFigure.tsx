import { useMemo, useState } from "react";

import { aliasFrequency } from "../../lib/figures/fourierMath";
import { FigureFrame, FunctionCurve, Line, SamplePoints } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

const T_MAX = 4; // seconds shown
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
  const samples = useMemo(() => {
    const dt = 1 / fs;
    const pts: [number, number][] = [];
    for (let t = 0; t <= T_MAX + 1e-9; t += dt) {
      pts.push([t, Math.sin(2 * Math.PI * SIGNAL_HZ * t)]);
    }
    return pts;
  }, [fs]);

  const focusAlias = nodeId === "aliasing";

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0, T_MAX]} yDomain={[-1.25, 1.25]} grid>
        <Line.Segment point1={[0, 0]} point2={[T_MAX, 0]} color="var(--fg-4)" weight={1} />
        <FunctionCurve
          y={(t) => Math.sin(2 * Math.PI * SIGNAL_HZ * t)}
          domain={[0, T_MAX]}
          color="var(--fg-3)"
          weight={1.5}
          opacity={nyquistOk ? 0.45 : 0.7}
        />
        {!nyquistOk && (
          <FunctionCurve
            y={(t) => Math.sin(2 * Math.PI * aliasHz * t)}
            domain={[0, T_MAX]}
            color="var(--accent)"
            weight={2.1}
            style="dashed"
          />
        )}
        <SamplePoints points={samples} radius={2.7} />
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
