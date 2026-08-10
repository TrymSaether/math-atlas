import { DIA, FigureCaption, FigureFrame, FunctionCurve, LaTeX, STROKE } from "../core/FigureFrame";

const RATES = [
  { r: 3, color: DIA.alert, label: String.raw`C^3:\ r=3` },
  { r: 1.5, color: DIA.accent, label: String.raw`C^{1,1/2}:\ r=3/2` },
  { r: 1, color: DIA.codomain, label: String.raw`\text{jumps}:\ r=1` },
  { r: 0.25, color: DIA.warning, label: String.raw`3^k:\ r=1/4` },
] as const;

/** Log-log comparison of the four sharp coefficient-decay exponents in Exam 2026 Problem 2. */
export default function DecayRatesFigure() {
  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-0.15, 3.4]} yDomain={[-10.5, 0.8]} grid>
        {RATES.map(({ r, color }) => (
          <FunctionCurve key={r} y={(x) => -r * x} domain={[0, 3.15]} color={color} weight={STROKE.curve} />
        ))}
        <LaTeX at={[2.35, -7.65]} tex={RATES[0].label} color={RATES[0].color} />
        <LaTeX at={[2.15, -4.15]} tex={RATES[1].label} color={RATES[1].color} />
        <LaTeX at={[1.7, -1.65]} tex={RATES[2].label} color={RATES[2].color} />
        <LaTeX at={[2.15, -0.2]} tex={RATES[3].label} color={RATES[3].color} />
        <LaTeX at={[2.9, 0.45]} tex={String.raw`\log |n|`} color={DIA.ink} />
        <LaTeX at={[0.68, -9.9]} tex={String.raw`\log |\widehat f(n)|`} color={DIA.ink} />
      </FigureFrame>
      <FigureCaption>
        On log–log axes, a bound |f̂(n)| ≤ C|n|<sup>−r</sup> has slope −r. More regularity makes the line steeper.
      </FigureCaption>
    </figure>
  );
}
