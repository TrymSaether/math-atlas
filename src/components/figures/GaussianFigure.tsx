import { gaussian } from "../../lib/figures/fourierMath";
import { DIA, FONT, FigureFrame, FunctionCurve, Line, STROKE, Text, Vector, useMovablePoint } from "./FigureFrame";
import { type FigureProps } from "./types";

const CAPTION: Record<string, string> = {
  gaussian_transform:
    "The Gaussian is its own Fourier transform: narrowing one width (solid) widens the other (dashed).",
  uncertainty_principle:
    "Concentrating in space (solid) forces spreading in frequency (dashed): the product of widths is bounded below.",
};

/**
 * A Gaussian e^{−x²/2σ²} (solid) drawn with its Fourier transform, another
 * Gaussian of reciprocal width 1/σ (dashed). The σ slider makes the
 * space–frequency trade-off concrete. Serves both the self-dual-Gaussian node
 * and the uncertainty principle.
 */
export default function GaussianFigure({ nodeId }: FigureProps) {
  // Start away from σ = 1 (where the Gaussian and its transform coincide and the
  // dashed curve hides under the solid one). At σ ≈ 0.62 the two curves are
  // clearly separated, so the space–frequency trade-off reads before any drag.
  const width = useMovablePoint([0.62, 1.06], {
    color: "var(--accent)",
    constrain: ([x]) => [Math.min(2.2, Math.max(0.25, x)), 1.06],
  });
  const sigma = width.x;
  const freqSigma = 1 / sigma; // width of the transform
  const caption = CAPTION[nodeId] ?? CAPTION.gaussian_transform;

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-6, 6]} yDomain={[-0.08, 1.18]} grid>
        <Line.Segment point1={[0, 1.06]} point2={[2.2, 1.06]} color={DIA.muted} weight={STROKE.guide} style="dashed" />
        <Vector tail={[0, 1.06]} tip={[sigma, 1.06]} color={DIA.accent} weight={STROKE.mark} />
        <Text x={sigma + 0.34} y={1.08} color={DIA.accent} size={FONT.tick}>
          σ
        </Text>
        <Vector tail={[0, 0.88]} tip={[-freqSigma, 0.88]} color={DIA.codomain} weight={STROKE.mark} />
        <Text x={-freqSigma - 0.5} y={0.9} color={DIA.codomain} size={FONT.tick}>
          1/σ
        </Text>
        <FunctionCurve
          y={(x) => gaussian(x, freqSigma)}
          domain={[-6, 6]}
          color={DIA.codomain}
          weight={STROKE.ref}
          style="dashed"
        />
        <FunctionCurve y={(x) => gaussian(x, sigma)} domain={[-6, 6]} color={DIA.accent} weight={STROKE.curve} />
        {width.element}
      </FigureFrame>
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        Drag the handle on the width marker: σ = {sigma.toFixed(2)}, so the transform width is {freqSigma.toFixed(2)}.{" "}
        {caption}
      </figcaption>
    </figure>
  );
}
