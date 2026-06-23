import { useMemo, useState } from "react";

import { MathText } from "../../lib/katex";
import { DIA, FONT, FigureCaption, FigureFrame, LaTeX, Line, Polygon, STROKE, Text } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { SegmentedControl } from "./SegmentedControl";

type Mode = "banach" | "incomplete";

const CEILING = 1;
const MAX_OPS = 15; // max number of operators we can show without the labels overlapping too much

const MODE_OPTIONS = [
  { value: "banach" as const, label: "Banach domain" },
  { value: "incomplete" as const, label: "Incomplete" },
];

/** ‖T_n‖ for the n-th operator in the family, per regime. */
function opNorm(mode: Mode, n: number): number {
  if (mode === "banach") return CEILING * (1 - 0.55 ** n); // stays under the ceiling
  return 0.32 * Math.sqrt(n); // pointwise bounded yet escapes any ceiling
}

export default function UniformBoundednessFigure() {
  const [mode, setMode] = useState<Mode>("banach");
  const [count, setCount] = useState(8);

  const values = useMemo(() => Array.from({ length: count }, (_, i) => opNorm(mode, i + 1)), [mode, count]);
  const peak = Math.max(...values);
  const bounded = peak <= CEILING + 1e-9;
  const yMax = Math.max(1.25, peak + 0.2);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0.3, MAX_OPS + 0.7]} yDomain={[-0.16 * yMax, yMax]} height={190} grid={false}>
        <Line.Segment point1={[0.5, 0]} point2={[MAX_OPS + 0.5, 0]} color={DIA.ink} weight={STROKE.guide} />
        {/* uniform bound (ceiling) */}
        <Line.Segment
          point1={[0.5, CEILING]}
          point2={[MAX_OPS + 0.5, CEILING]}
          color={bounded ? DIA.ink : DIA.alert}
          weight={STROKE.mark}
          style="dashed"
        />
        {values.map((v, i) => {
          const n = i + 1;
          const over = v > CEILING + 1e-9;
          return (
            <g key={n}>
              <Polygon
                points={[
                  [n - 0.28, 0],
                  [n - 0.28, v],
                  [n + 0.28, v],
                  [n + 0.28, 0],
                ]}
                color={over ? DIA.alert : DIA.accent}
                fillOpacity={0.85}
                strokeOpacity={0}
              />
              {(n === 1 || n % 4 === 0) && (
                <Text x={n} y={-0.09 * yMax} color={DIA.ref} size={FONT.tick}>
                  {n}
                </Text>
              )}
            </g>
          );
        })}
        <LaTeX at={[2, yMax]} tex={String.raw`\sup_\alpha\|T_\alpha\|`} color={bounded ? DIA.ink : DIA.alert} />
        <LaTeX at={[8.5, yMax]} tex={String.raw`\|T_n\|`} color={DIA.ink} />
      </FigureFrame>
      <SegmentedControl value={mode} options={MODE_OPTIONS} onChange={setMode} ariaLabel="Domain completeness" />
      <RangeControl
        min={3}
        max={MAX_OPS}
        value={count}
        onChange={setCount}
        label={`N = ${count}`}
        ariaLabel="Number of operators in the family"
      />
      <FigureCaption>
        <MathText
          text={
            mode === "banach"
              ? "On a Banach domain, a family that is bounded at each point ($\\sup_\\alpha\\|T_\\alpha x\\|<\\infty$) is automatically bounded in operator norm — the bars never breach the ceiling."
              : "Drop completeness and the principle fails: the family can stay pointwise bounded while $\\|T_n\\|\\to\\infty$ breaks through any uniform ceiling."
          }
        />
      </FigureCaption>
    </figure>
  );
}
