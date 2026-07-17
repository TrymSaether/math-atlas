import { aliasFrequency } from "./fourierMath";
import { MathText } from "@/math/MathText";
import {
  DIA,
  DOT,
  FONT,
  FigureCaption,
  FigureFrame,
  FunctionCurve,
  Line,
  SamplePoints,
  STROKE,
  Text,
  Vector,
} from "../core/FigureFrame";
import { useMovablePoint } from "../core/mafs";
import type { FigureProps } from "../core/types";

const T_MAX = 4; // seconds shown
const SIGNAL_HZ = 3; // the true tone frequency
const MIN_FS = 2;
const MAX_FS = 16;
const HANDLE_MIN = 0.45;
const HANDLE_MAX = 3.65;

function fsFromHandle(x: number): number {
  const t = (x - HANDLE_MIN) / (HANDLE_MAX - HANDLE_MIN);
  return MIN_FS + Math.min(1, Math.max(0, t)) * (MAX_FS - MIN_FS);
}

function handleFromFs(fs: number): number {
  const t = (fs - MIN_FS) / (MAX_FS - MIN_FS);
  return HANDLE_MIN + t * (HANDLE_MAX - HANDLE_MIN);
}

const NYQUIST_HZ = 2 * SIGNAL_HZ; // the critical rate
const NYQUIST_HANDLE_X = handleFromFs(NYQUIST_HZ);

/**
 * A pure tone (solid faint) sampled at rate fs (dots), with the lowest-frequency
 * sine the samples are consistent with drawn on top (accent). Below the Nyquist
 * rate 2·f the reconstruction collapses to a slower alias — the same dots, a
 * different tune. Serves the sampling theorem and aliasing nodes.
 */
export default function SamplingFigure({ nodeId }: FigureProps) {
  const rate = useMovablePoint([0.9, 1.08], {
    color: DIA.accent,
    constrain: ([x]) => [Math.min(HANDLE_MAX, Math.max(HANDLE_MIN, x)), 1.08],
  });
  const fs = fsFromHandle(rate.x);
  const dt = 1 / fs;
  const nyquistOk = fs >= 2 * SIGNAL_HZ;
  const aliasHz = aliasFrequency(SIGNAL_HZ, fs);
  // Cheap to recompute each render (a handful of points); no memo needed.
  const samples: [number, number][] = [];
  for (let t = 0; t <= T_MAX + 1e-9; t += dt) {
    samples.push([t, Math.sin(2 * Math.PI * SIGNAL_HZ * t)]);
  }

  const focusAlias = nodeId === "aliasing";

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0, T_MAX]} yDomain={[-1.25, 1.25]} grid>
        <Line.Segment point1={[0, 0]} point2={[T_MAX, 0]} color={DIA.muted} weight={STROKE.guide} />
        <Line.Segment
          point1={[HANDLE_MIN, 1.08]}
          point2={[HANDLE_MAX, 1.08]}
          color={DIA.muted}
          weight={STROKE.guide}
          style="dashed"
        />
        {/* The critical (Nyquist) rate: a tick on the rate track shows why 2·f is
            the threshold, instead of leaving the user to discover it by dragging. */}
        <Line.Segment
          point1={[NYQUIST_HANDLE_X, 1.0]}
          point2={[NYQUIST_HANDLE_X, 1.16]}
          color={nyquistOk ? DIA.codomain : DIA.alert}
          weight={STROKE.mark}
        />
        <Text x={NYQUIST_HANDLE_X} y={1.22} color={nyquistOk ? DIA.codomain : DIA.alert} size={FONT.hint}>
          2f
        </Text>
        <Vector tail={[HANDLE_MIN, 1.08]} tip={[rate.x, 1.08]} color={DIA.accent} weight={STROKE.mark} />
        <Text x={Math.min(rate.x, NYQUIST_HANDLE_X - 0.28)} y={0.94} color={DIA.accent} size={FONT.tick}>
          f_s
        </Text>
        <Vector tail={[0, -1.08]} tip={[dt, -1.08]} color={DIA.codomain} weight={STROKE.mark} />
        <Text x={Math.max(0.35, dt + 0.22)} y={-1.08} color={DIA.codomain} size={FONT.tick}>
          Δt
        </Text>
        <FunctionCurve
          y={(t) => Math.sin(2 * Math.PI * SIGNAL_HZ * t)}
          domain={[0, T_MAX]}
          color={DIA.faint}
          weight={STROKE.ref}
          opacity={nyquistOk ? 0.45 : 0.7}
        />
        {!nyquistOk && (
          <FunctionCurve
            y={(t) => Math.sin(2 * Math.PI * aliasHz * t)}
            domain={[0, T_MAX]}
            color={DIA.alert}
            weight={STROKE.curve}
            style="dashed"
          />
        )}
        <SamplePoints points={samples} radius={DOT.sample} />
        {rate.element}
      </FigureFrame>
      <FigureCaption>
        <MathText
          text={
            nyquistOk
              ? `Drag the sampling-rate handle. $f_s \\ge 2 \\cdot ${SIGNAL_HZ}\\,\\text{Hz}$: the ${SIGNAL_HZ} Hz tone is captured faithfully.`
              : `Drag the sampling-rate handle. Undersampled — the dots also fit a phantom $${aliasHz.toFixed(1)}\\,\\text{Hz}$ sine (dashed).` +
                (focusAlias ? " That impostor is the alias." : "")
          }
        />
      </FigureCaption>
    </figure>
  );
}
