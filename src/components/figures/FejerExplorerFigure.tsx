import { useMemo, useState, type ReactNode } from "react";

import { linspace } from "../../lib/figures/plot";
import {
  cesaroSquareWaveOrder,
  dirichletKernel,
  fejerExamKernel,
  squareWavePartialSumOrder,
} from "../../lib/figures/fourierMath";
import { MathText } from "../../lib/katex";
import {
  DIA,
  FigureCaption,
  FigureFrame,
  FunctionCurve,
  LaTeX,
  Line,
  Polygon,
  SERIES,
  STROKE,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";

const X_DOMAIN: [number, number] = [-Math.PI, Math.PI];
const KERNEL_Y: [number, number] = [-0.34, 1.12];
const CONVOLUTION_Y: [number, number] = [-1.8, 1.8];
const WAVE_Y: [number, number] = [-1.45, 1.45];
const PROPERTY_Y: [number, number] = [-0.12, 1.1];

const XS = linspace(-Math.PI, Math.PI, 720);

const C = {
  dirichlet: DIA.alert,
  fejer: DIA.codomain,
  sigma: DIA.accent,
  target: DIA.ref,
  marker: DIA.warning,
  good: DIA.ok,
} as const;

function normalizedDirichlet(x: number, k: number): number {
  return dirichletKernel(x, k) / Math.max(1, 2 * k + 1);
}

function normalizedFejer(x: number, N: number): number {
  return fejerExamKernel(x, N) / Math.max(1, N);
}

function testFunction(x: number): number {
  return 0.9 * Math.sin(x) + 0.5 * Math.cos(2 * x) + 0.35 * Math.sin(3 * x) + 0.2 * Math.cos(5 * x);
}

function positiveLobePolygons(samples: Vec2[]): Vec2[][] {
  const polygons: Vec2[][] = [];
  let current: Vec2[] = [];

  samples.forEach(([x, y], index) => {
    if (y >= 0) {
      if (current.length === 0) current.push([x, 0]);
      current.push([x, y]);
      return;
    }

    if (current.length > 1) {
      current.push([samples[index - 1][0], 0]);
      polygons.push(current);
    }
    current = [];
  });

  if (current.length > 1) {
    current.push([samples[samples.length - 1][0], 0]);
    polygons.push(current);
  }

  return polygons;
}

function tailBands(delta: number): Vec2[][] {
  return [
    [
      [-Math.PI, 0],
      [-Math.PI, PROPERTY_Y[1]],
      [-delta, PROPERTY_Y[1]],
      [-delta, 0],
    ],
    [
      [delta, 0],
      [delta, PROPERTY_Y[1]],
      [Math.PI, PROPERTY_Y[1]],
      [Math.PI, 0],
    ],
  ];
}

function midpointIntegral(fn: (x: number) => number, samples = 1600): number {
  const h = (2 * Math.PI) / samples;
  let acc = 0;
  for (let i = 0; i < samples; i++) {
    const x = -Math.PI + (i + 0.5) * h;
    acc += fn(x) * h;
  }
  return acc;
}

function convolutionAt(x: number, N: number): number {
  return midpointIntegral((y) => testFunction(x - y) * fejerExamKernel(y, N), 1200) / (2 * Math.PI);
}

function tailMass(N: number, delta: number): number {
  return (
    midpointIntegral((x) => {
      if (Math.abs(x) < delta) return 0;
      return fejerExamKernel(x, N);
    }) /
    (2 * Math.PI)
  );
}

function unitMass(N: number): number {
  return midpointIntegral((x) => fejerExamKernel(x, N)) / (2 * Math.PI);
}

function tailBound(N: number, delta: number): number {
  return 1 / (N * Math.sin(delta / 2) ** 2);
}

function Sym({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="font-math" style={{ color }}>
      {children}
    </span>
  );
}

function FormulaCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-caption-1 leading-[1.75] text-fg-2">
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  good = false,
}: {
  label: ReactNode;
  value: string;
  note?: ReactNode;
  good?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <div className="text-caption-1 leading-snug text-fg-3">{label}</div>
      <div className="mt-1 font-math text-body" style={{ color: good ? C.good : C.target }}>
        {value}
      </div>
      {note && <div className="mt-0.5 text-caption-1 leading-snug text-fg-3">{note}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface-2 p-3">
      <h4 className="mb-2 text-footnote font-semibold text-fg-1">{title}</h4>
      {children}
    </section>
  );
}

function KernelComparisonPanel({ N }: { N: number }) {
  const peak = 2 * N + 1;
  const dirichletL1 = useMemo(() => midpointIntegral((x) => Math.abs(dirichletKernel(x, N))) / (2 * Math.PI), [N]);
  const fejerL1 = useMemo(() => midpointIntegral((x) => Math.abs(fejerExamKernel(x, N))) / (2 * Math.PI), [N]);
  const dirichletMin = useMemo(() => Math.min(...XS.map((x) => dirichletKernel(x, N))), [N]);

  return (
    <Panel title="1. Dirichlet vs Fejér: averaging fixes the sign, not just the size">
      <p className="mb-3 text-caption-1 leading-relaxed text-fg-2">
        Raw partial sums convolve against <Sym color={C.dirichlet}>D_N</Sym>; Cesàro means convolve against{" "}
        <Sym color={C.fejer}>F_N</Sym>. Move the shared order control and compare their structure.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        <div>
          <div className="mb-1 font-math text-caption-1" style={{ color: C.dirichlet }}>
            D_N(x) = sin((N+½)x) / sin(x/2)
          </div>
          <FigureFrame xDomain={X_DOMAIN} yDomain={[-peak * 0.42, peak * 1.05]} height={190} grid>
            <FunctionCurve
              y={(x) => dirichletKernel(x, N)}
              domain={X_DOMAIN}
              color={C.dirichlet}
              weight={STROKE.curve}
            />
          </FigureFrame>
          <FigureCaption>
            Negative side lobes persist as N grows; cancellation can overshoot the range of f.
          </FigureCaption>
        </div>

        <div>
          <div className="mb-1 font-math text-caption-1" style={{ color: C.fejer }}>
            F_N(x) = N⁻¹(sin(Nx/2) / sin(x/2))²
          </div>
          <FigureFrame xDomain={X_DOMAIN} yDomain={[-N * 0.08, N * 1.05]} height={190} grid>
            <FunctionCurve y={(x) => fejerExamKernel(x, N)} domain={X_DOMAIN} color={C.fejer} weight={STROKE.curve} />
          </FigureFrame>
          <FigureCaption>A ratio of squares is non-negative and concentrates its unit mass at x = 0.</FigureCaption>
        </div>
      </div>

      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))" }}
      >
        <StatCard
          label={
            <span>
              (2π)⁻¹∫|D<sub>N</sub>|
            </span>
          }
          value={dirichletL1.toFixed(3)}
          note="grows with N"
        />
        <StatCard
          label={
            <span>
              min D<sub>N</sub>(x)
            </span>
          }
          value={dirichletMin.toFixed(2)}
          note="negative: sign changes"
        />
        <StatCard
          label={
            <span>
              (2π)⁻¹∫|F<sub>N</sub>|
            </span>
          }
          value={fejerL1.toFixed(3)}
          note="unit mass for every N"
          good
        />
      </div>
    </Panel>
  );
}

function ConvolutionPanel({ N }: { N: number }) {
  const [x0, setX0] = useState(1.1);
  const average = useMemo(() => convolutionAt(x0, N), [N, x0]);
  const exact = testFunction(x0);
  const error = Math.abs(average - exact);

  return (
    <Panel title="2. Convolution is a sliding weighted average">
      <p className="mb-2 text-caption-1 leading-relaxed text-fg-2">
        The normalized teal spike is F<sub>N</sub>(x₀−t), centred at the selected output point. The gold curve is the
        weighted product whose signed area gives (f∗F<sub>N</sub>)(x₀).
      </p>

      <FigureFrame xDomain={X_DOMAIN} yDomain={CONVOLUTION_Y} height={230} grid>
        <Line.Segment
          point1={[x0, CONVOLUTION_Y[0]]}
          point2={[x0, CONVOLUTION_Y[1]]}
          color={C.marker}
          weight={STROKE.guide}
          style="dashed"
        />
        <FunctionCurve y={testFunction} domain={X_DOMAIN} color={C.target} weight={STROKE.ref} />
        <FunctionCurve
          y={(t) => fejerExamKernel(x0 - t, N) / N}
          domain={X_DOMAIN}
          color={C.fejer}
          weight={STROKE.curve}
        />
        <FunctionCurve
          y={(t) => (testFunction(t) * fejerExamKernel(x0 - t, N)) / N}
          domain={X_DOMAIN}
          color={C.sigma}
          weight={STROKE.ref}
          style="dashed"
        />
        <LaTeX at={[-2.85, 1.5]} tex={String.raw`f(t)`} color={C.target} />
        <LaTeX at={[-2.85, 1.18]} tex={String.raw`F_N(x_0-t)/N`} color={C.fejer} />
        <LaTeX at={[x0 + 0.18, -1.5]} tex={String.raw`x_0`} color={C.marker} />
      </FigureFrame>

      <RangeControl
        min={-3.1}
        max={3.1}
        step={0.02}
        value={x0}
        onChange={setX0}
        label={`x_0 = ${x0.toFixed(2)}`}
        ariaLabel="Convolution output point x zero"
      />

      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))" }}
      >
        <StatCard
          label={
            <span>
              (f∗F<sub>N</sub>)(x₀)
            </span>
          }
          value={average.toFixed(4)}
          good
        />
        <StatCard label="f(x₀)" value={exact.toFixed(4)} />
        <StatCard
          label="absolute error"
          value={error.toFixed(4)}
          note="shrinks as the spike narrows"
          good={error < 0.05}
        />
      </div>
    </Panel>
  );
}

function KernelAssemblyPanel({ N }: { N: number }) {
  const fejerSamples = useMemo(() => XS.map((x): Vec2 => [x, normalizedFejer(x, N)]), [N]);
  const lobes = useMemo(() => positiveLobePolygons(fejerSamples), [fejerSamples]);
  const dirichletOrders = useMemo(() => {
    const step = Math.max(1, Math.floor((N - 1) / 5));
    const values = Array.from({ length: 6 }, (_, i) => Math.min(N - 1, i * step));
    return [...new Set([0, ...values, N - 1])].slice(-7);
  }, [N]);

  return (
    <Panel title="5. Watch the Fejér kernel assemble from Dirichlet kernels">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
        <FigureFrame xDomain={X_DOMAIN} yDomain={KERNEL_Y} height={170} grid>
          <Line.Segment point1={[-Math.PI, 0]} point2={[Math.PI, 0]} color={DIA.ink} weight={STROKE.guide} />
          {dirichletOrders.map((k, i) => (
            <FunctionCurve
              key={k}
              y={(x) => normalizedDirichlet(x, k)}
              domain={X_DOMAIN}
              color={SERIES[i % SERIES.length]}
              weight={STROKE.hair}
              opacity={0.75}
            />
          ))}
          <LaTeX at={[-2.8, 0.93]} tex={String.raw`D_0,\dots,D_{N-1}`} color={C.dirichlet} />
        </FigureFrame>

        <FigureFrame xDomain={X_DOMAIN} yDomain={KERNEL_Y} height={170} grid>
          {lobes.map((points, i) => (
            <Polygon key={i} points={points} color={C.fejer} fillOpacity={0.12} strokeOpacity={0} />
          ))}
          <Line.Segment point1={[-Math.PI, 0]} point2={[Math.PI, 0]} color={DIA.ink} weight={STROKE.guide} />
          <FunctionCurve y={(x) => normalizedFejer(x, N)} domain={X_DOMAIN} color={C.fejer} weight={STROKE.curve} />
          <LaTeX at={[-2.75, 0.93]} tex={String.raw`F_N=\frac1N\sum_{k=0}^{N-1}D_k`} color={C.fejer} />
        </FigureFrame>
      </div>

      <div className="mt-2">
        <FormulaCard>
          <Sym color={C.fejer}>
            F<sub>N</sub>
          </Sym>
          {" = (1/N) average of "}
          <Sym color={C.dirichlet}>
            D<sub>0</sub>, …, D<sub>N−1</sub>
          </Sym>
          {". The off-centre oscillations cancel, while the common peak at "}
          <Sym color={C.marker}>0</Sym>
          {" survives."}
        </FormulaCard>
      </div>
    </Panel>
  );
}

function CesaroPanel({ N }: { N: number }) {
  return (
    <Panel title="3. Cesàro averaging tames Gibbs oscillation">
      <FigureFrame xDomain={X_DOMAIN} yDomain={WAVE_Y} height={220} grid>
        <Line.Segment point1={[-Math.PI, -1]} point2={[0, -1]} color={C.target} weight={STROKE.ref} style="dashed" />
        <Line.Segment point1={[0, 1]} point2={[Math.PI, 1]} color={C.target} weight={STROKE.ref} style="dashed" />
        <Line.Segment point1={[0, -1.2]} point2={[0, 1.2]} color={DIA.muted} weight={STROKE.guide} style="dashed" />

        <FunctionCurve
          y={(x) => squareWavePartialSumOrder(x, N)}
          domain={X_DOMAIN}
          color={C.dirichlet}
          weight={STROKE.ref}
          opacity={0.82}
        />
        <FunctionCurve y={(x) => cesaroSquareWaveOrder(x, N)} domain={X_DOMAIN} color={C.sigma} weight={STROKE.curve} />

        <LaTeX at={[-2.95, 1.18]} tex={String.raw`f`} color={C.target} />
        <LaTeX at={[-2.95, 0.88]} tex={String.raw`S_N=f*D_N`} color={C.dirichlet} />
        <LaTeX at={[-2.95, 0.58]} tex={String.raw`\sigma_N=f*F_N`} color={C.sigma} />
      </FigureFrame>

      <div className="mt-2">
        <FormulaCard>
          <Sym color={C.sigma}>
            σ<sub>N</sub>(f)(x)
          </Sym>
          {" = (1/N)Σ"}
          <Sym color={C.dirichlet}>
            S<sub>k</sub>(f)(x)
          </Sym>
          {" = (1/2π)∫ "}
          <Sym color={C.fejer}>
            F<sub>N</sub>(y)
          </Sym>{" "}
          <Sym color={C.target}>f(x−y)</Sym>
          {" dy."}
        </FormulaCard>
      </div>
    </Panel>
  );
}

function GoodKernelPanel({ N, delta, setDelta }: { N: number; delta: number; setDelta: (v: number) => void }) {
  const mass = useMemo(() => unitMass(N), [N]);
  const absoluteMass = useMemo(() => midpointIntegral((x) => Math.abs(fejerExamKernel(x, N))) / (2 * Math.PI), [N]);
  const tail = useMemo(() => tailMass(N, delta), [N, delta]);
  const bound = useMemo(() => tailBound(N, delta), [N, delta]);

  return (
    <Panel title="4. The good-kernel properties, measured live">
      <FigureFrame xDomain={X_DOMAIN} yDomain={PROPERTY_Y} height={170} grid>
        {tailBands(delta).map((points, i) => (
          <Polygon key={i} points={points} color={C.dirichlet} fillOpacity={0.1} strokeOpacity={0} />
        ))}
        <Line.Segment point1={[-Math.PI, 0]} point2={[Math.PI, 0]} color={DIA.ink} weight={STROKE.guide} />
        <Line.Segment
          point1={[-delta, PROPERTY_Y[0]]}
          point2={[-delta, PROPERTY_Y[1]]}
          color={C.marker}
          weight={STROKE.guide}
          style="dashed"
        />
        <Line.Segment
          point1={[delta, PROPERTY_Y[0]]}
          point2={[delta, PROPERTY_Y[1]]}
          color={C.marker}
          weight={STROKE.guide}
          style="dashed"
        />
        <FunctionCurve y={(x) => normalizedFejer(x, N)} domain={X_DOMAIN} color={C.fejer} weight={STROKE.curve} />
        <LaTeX at={[-delta - 0.2, 0.95]} tex={String.raw`-\delta`} color={C.marker} />
        <LaTeX at={[delta + 0.2, 0.95]} tex={String.raw`\delta`} color={C.marker} />
      </FigureFrame>

      <RangeControl
        min={0.2}
        max={2.4}
        step={0.05}
        value={delta}
        onChange={setDelta}
        label={`\\delta = ${delta.toFixed(2)}`}
        ariaLabel="Good-kernel tail cutoff delta"
      />

      <div
        className="mt-3 grid gap-2 text-caption-1 text-fg-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))" }}
      >
        <FormulaCard>
          <Sym color={C.good}>(a) mass</Sym>
          {": (2π)⁻¹∫F_N ≈ "}
          <span className="font-math">{mass.toFixed(3)}</span>
        </FormulaCard>
        <FormulaCard>
          <Sym color={C.good}>(b) L¹ norm</Sym>
          {": (2π)⁻¹∫|F_N| ≈ "}
          <span className="font-math">{absoluteMass.toFixed(3)}</span>
        </FormulaCard>
        <FormulaCard>
          <Sym color={C.marker}>(c) tail</Sym>
          {": (2π)⁻¹∫_{δ≤|y|≤π}F_N ≈ "}
          <span className="font-math">{tail.toFixed(3)}</span>
        </FormulaCard>
        <FormulaCard>
          <Sym color={C.dirichlet}>bound</Sym>
          {": ≤ "}
          <span className="font-math">{bound.toFixed(3)}</span>
        </FormulaCard>
      </div>
    </Panel>
  );
}

/**
 * Fejér / Cesàro explorer for TMA4170-style Problem 3.
 *
 * This is intentionally built on the shared figure system instead of the
 * standalone SVG artifact: formulas, plot colors, controls, and light/dark
 * behavior all inherit from the Math Atlas figure tokens.
 */
export default function FejerExplorerFigure() {
  const [N, setN] = useState(8);
  const [delta, setDelta] = useState(0.65);

  return (
    <figure className="m-0 space-y-4">
      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <p className="text-caption-1 leading-relaxed text-fg-2">
          One order controls all five views. Increasing N makes the Fejér spike narrower, reduces convolution error, and
          pushes mass out of every fixed tail region.
        </p>
        <RangeControl min={2} max={28} value={N} onChange={setN} label={`N = ${N}`} ariaLabel="Fejer order N" />
      </div>

      <KernelComparisonPanel N={N} />
      <ConvolutionPanel N={N} />
      <CesaroPanel N={N} />
      <GoodKernelPanel N={N} delta={delta} setDelta={setDelta} />
      <KernelAssemblyPanel N={N} />

      <FigureCaption>
        <MathText
          text={String.raw`Color code: $D_k$ is the sign-changing Dirichlet object, $F_N$ is the positive Fejer kernel, and $\sigma_N(f)=f*F_N$ is the Cesaro average. The dummy integration variable is $y$; the output point is $x$.`}
        />
      </FigureCaption>
    </figure>
  );
}
