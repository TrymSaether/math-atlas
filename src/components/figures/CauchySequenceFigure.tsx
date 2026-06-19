// src/components/figures/CauchySequenceFigure.tsx

import { useMemo, useState } from "react";
import { MovablePoint } from "mafs";
import "katex/dist/katex.min.css";

import { MathText } from "../../lib/katex";
import { DIA, DOT, FONT, FigureFrame, LaTeX, Line, Point, Polygon, STROKE, Text, type Domain } from "./FigureFrame";
import { SegmentedControl } from "./SegmentedControl";

type Mode = "convergent" | "incomplete" | "bad";

type Term = {
  n: number;
  x: number;
  y: number;
};

const COUNT = 30;
const MIN_TAIL_TERMS = 6;

const MODE_OPTIONS = [
  { value: "convergent" as const, label: "Convergent" },
  { value: "incomplete" as const, label: "Incomplete space" },
  { value: "bad" as const, label: "Not Cauchy" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number): number {
  return clamp(Math.round(value), min, max);
}

function makeTerms(mode: Mode): Term[] {
  if (mode === "convergent") {
    return Array.from({ length: COUNT }, (_, i) => {
      const n = i + 1;
      return { n, x: n, y: 1 / n };
    });
  }

  if (mode === "incomplete") {
    return Array.from({ length: COUNT }, (_, i) => {
      const n = i + 1;
      const scale = 10 ** Math.min(n - 1, 12);

      return {
        n,
        x: n,
        y: Math.floor(Math.sqrt(2) * scale) / scale,
      };
    });
  }

  return Array.from({ length: COUNT }, (_, i) => {
    const n = i + 1;
    return { n, x: n, y: n % 2 === 0 ? 1 : -1 };
  });
}

function getTailStats(terms: Term[], N: number) {
  const tail = terms.filter((term) => term.n >= N);
  if (tail.length === 0) return undefined;

  const values = tail.map((term) => term.y);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    min,
    max,
    diameter: max - min,
  };
}

function findFirstCauchyTail(terms: Term[], epsilon: number): number | undefined {
  for (let N = 1; N <= COUNT - MIN_TAIL_TERMS + 1; N += 1) {
    const stats = getTailStats(terms, N);

    if (stats !== undefined && stats.diameter < epsilon) {
      return N;
    }
  }

  return undefined;
}

function titleTex(mode: Mode): string {
  if (mode === "convergent") {
    return String.raw`x_n=\frac{1}{n}\text{ in }\mathbb{R}`;
  }

  if (mode === "incomplete") {
    return String.raw`\text{rational truncations of }\sqrt{2}\text{ in }\mathbb{Q}`;
  }

  return String.raw`x_n=(-1)^n`;
}

export default function CauchySequenceFigure() {
  const [mode, setMode] = useState<Mode>("convergent");
  const [epsilon, setEpsilon] = useState(0.2);
  const [n, setNIndex] = useState(12);
  const [m, setMIndex] = useState(20);

  const terms = useMemo(() => makeTerms(mode), [mode]);
  const limit = mode === "convergent" ? 0 : mode === "incomplete" ? Math.sqrt(2) : undefined;
  const epsilonOrigin = limit ?? 0;
  const epsilonMax = mode === "incomplete" ? 0.24 : 1.2;
  const activeEpsilon = clamp(epsilon, 0.03, epsilonMax);
  const tailStart = findFirstCauchyTail(terms, activeEpsilon);
  const tailStats = tailStart === undefined ? undefined : getTailStats(terms, tailStart);

  const xn = terms[n - 1].y;
  const xm = terms[m - 1].y;
  const pairwiseDistance = Math.abs(xm - xn);
  const yRange: Domain =
    mode === "incomplete"
      ? [Math.sqrt(2) - Math.max(0.18, activeEpsilon * 1.25), Math.sqrt(2) + activeEpsilon * 1.25]
      : mode === "bad"
        ? [-1.25, 1.25]
        : [Math.min(-0.15, -activeEpsilon * 1.15), Math.max(1.12, activeEpsilon * 1.15)];
  const xMax = COUNT + 1;
  const bandTop = limit === undefined ? undefined : limit + activeEpsilon;
  const bandBottom = limit === undefined ? undefined : limit - activeEpsilon;
  const epsilonHandle: [number, number] = [xMax - 1.2, epsilonOrigin + activeEpsilon];
  const labelGap = 0.07 * (yRange[1] - yRange[0]);
  const bottomLabelY = yRange[0] + 0.1 * (yRange[1] - yRange[0]);
  const topLabelY = yRange[1] - 0.09 * (yRange[1] - yRange[0]);
  const selectedLabelsShareLevel = Math.abs(xn - xm) < 2 * labelGap;
  const snapToTerm = ([x]: [number, number]): [number, number] => {
    const index = clampInt(x, 1, COUNT);
    return [index, terms[index - 1].y];
  };
  const labelY = (value: number, offset: number): number =>
    clamp(value + offset, yRange[0] + labelGap, yRange[1] - labelGap);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[0, xMax]} yDomain={yRange} height={210} grid>
        {limit !== undefined && bandTop !== undefined && bandBottom !== undefined && (
          <>
            <Polygon
              points={[
                [0, bandBottom],
                [xMax, bandBottom],
                [xMax, bandTop],
                [0, bandTop],
              ]}
              color={DIA.ok}
              fillOpacity={0.1}
              strokeOpacity={0}
            />
            <Line.Segment
              point1={[0, limit]}
              point2={[xMax, limit]}
              color={DIA.ink}
              weight={STROKE.ref}
              style="dashed"
              opacity={0.72}
            />
            <Line.Segment
              point1={[0, bandTop]}
              point2={[xMax, bandTop]}
              color={DIA.alert}
              weight={STROKE.hair}
              opacity={0.78}
            />
            <Line.Segment
              point1={[0, bandBottom]}
              point2={[xMax, bandBottom]}
              color={DIA.alert}
              weight={STROKE.hair}
              opacity={0.78}
            />
            <LaTeX at={[xMax - 3.4, labelY(limit, labelGap)]} tex={String.raw`\ell`} color={DIA.text} />
          </>
        )}

        {limit === undefined && (
          <Line.Segment
            point1={[0, activeEpsilon]}
            point2={[xMax, activeEpsilon]}
            color={DIA.alert}
            weight={STROKE.hair}
            style="dashed"
            opacity={0.6}
          />
        )}

        <LaTeX
          at={[epsilonHandle[0] - 1.25, labelY(epsilonHandle[1], labelGap)]}
          tex={String.raw`\varepsilon`}
          color={DIA.alert}
        />

        {tailStart !== undefined && tailStats !== undefined && (
          <>
            <Polygon
              points={[
                [tailStart, tailStats.min],
                [xMax, tailStats.min],
                [xMax, tailStats.max],
                [tailStart, tailStats.max],
              ]}
              color={DIA.ok}
              fillOpacity={0.16}
              strokeOpacity={0}
            />
            <Line.Segment
              point1={[tailStart, yRange[0]]}
              point2={[tailStart, yRange[1]]}
              color={DIA.ink}
              weight={STROKE.mark}
              opacity={0.9}
            />
            <LaTeX
              at={[Math.min(tailStart + 1.1, xMax - 2.8), yRange[1] - 0.08 * (yRange[1] - yRange[0])]}
              tex={String.raw`N=${tailStart}`}
              color={DIA.ink}
            />
          </>
        )}

        {n !== m && (
          <>
            <Line.Segment point1={[n, xn]} point2={[m, xn]} color={DIA.codomain} weight={STROKE.mark} opacity={0.9} />
            <Line.Segment point1={[m, xn]} point2={[m, xm]} color={DIA.codomain} weight={STROKE.mark} opacity={0.9} />
          </>
        )}

        <Text x={xMax - 0.75} y={bottomLabelY} color={DIA.text} size={FONT.tick}>
          n
        </Text>
        <Text x={0.7} y={topLabelY} color={DIA.text} size={FONT.tick}>
          x_n
        </Text>

        {terms.map(({ n: termN, x, y }) => {
          const selected = termN === n || termN === m;
          const inTail = tailStart !== undefined && termN >= tailStart;

          if (selected) return null;

          return (
            <Point key={termN} x={x} y={y} color={inTail ? DIA.ok : DIA.accent} svgCircleProps={{ r: DOT.sample }} />
          );
        })}

        <LaTeX
          at={[n + 0.45, labelY(xn, selectedLabelsShareLevel ? labelGap : labelGap * 0.8)]}
          tex={String.raw`x_{${n}}`}
          color={DIA.ok}
        />
        <LaTeX
          at={[m + 0.45, labelY(xm, selectedLabelsShareLevel ? -labelGap : labelGap * 0.8)]}
          tex={String.raw`x_{${m}}`}
          color={DIA.ok}
        />

        <MovablePoint
          point={[n, xn]}
          color={DIA.ok}
          onMove={([x]) => setNIndex(clampInt(x, 1, COUNT))}
          constrain={snapToTerm}
        />
        <MovablePoint
          point={[m, xm]}
          color={DIA.ok}
          onMove={([x]) => setMIndex(clampInt(x, 1, COUNT))}
          constrain={snapToTerm}
        />
        <MovablePoint
          point={epsilonHandle}
          color={DIA.alert}
          onMove={([, y]) => setEpsilon(clamp(Math.abs(y - epsilonOrigin), 0.03, epsilonMax))}
          constrain={([, y]) => [
            epsilonHandle[0],
            epsilonOrigin + clamp(Math.abs(y - epsilonOrigin), 0.03, epsilonMax),
          ]}
        />
      </FigureFrame>

      <SegmentedControl value={mode} options={MODE_OPTIONS} onChange={setMode} ariaLabel="Cauchy sequence example" />

      <figcaption className="mt-2 space-y-1 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        <div className="font-math" style={{ color: "var(--fg-2)" }}>
          <MathText
            text={`$${titleTex(mode)}\\quad \\varepsilon=${activeEpsilon.toFixed(2)}\\quad n=${n}\\quad m=${m}\\quad |x_m-x_n|=${pairwiseDistance.toFixed(3)}\\quad ${
              tailStart === undefined
                ? String.raw`\text{no displayed Cauchy tail}`
                : String.raw`\operatorname{diam}(x_k:k\ge ${tailStart})=${tailStats?.diameter.toFixed(3)}`
            }$`}
          />
        </div>
        <MathText
          text={
            mode === "convergent"
              ? String.raw`The terms of $x_n=1/n$ eventually fit inside every $\varepsilon$-tail, so the sequence is Cauchy and converges in $\mathbb{R}$.`
              : mode === "incomplete"
                ? String.raw`These rational truncations are Cauchy in $\mathbb{Q}$, but their limit is $\sqrt{2}$, which is not rational.`
                : String.raw`The alternating sequence is not Cauchy: every long tail still contains terms separated by $2$.`
          }
        />
      </figcaption>
    </figure>
  );
}
