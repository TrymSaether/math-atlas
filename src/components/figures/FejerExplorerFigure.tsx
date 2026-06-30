import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { MathText } from "../../lib/katex";
import {
  cesaroSquareWaveOrder,
  dirichletKernel,
  fejerExamKernel,
  squareWavePartialSumOrder,
} from "../../lib/figures/fourierMath";
import { ShellButton, ShellSlider } from "../primitives";
import { DIA, UI } from "./tokens";

const TAU = 2 * Math.PI;
const X_RANGE: Range = [-Math.PI, Math.PI];

const COL = {
  ink: DIA.text,
  dim: UI.muted,
  faint: DIA.faint,
  grid: DIA.grid,
  dirichlet: DIA.alert,
  fejer: DIA.codomain,
  f: DIA.ref,
  accent: DIA.warning,
  pos: DIA.codomain,
  neg: DIA.alert,
} as const;

const MONO = "var(--font-mono, 'SFMono-Regular', Consolas, monospace)";
const SANS = "var(--font-sans, Inter, system-ui, sans-serif)";

type Range = [number, number];
type NumericFn = (x: number) => number;

interface Curve {
  fn: NumericFn;
  color: string;
  width?: number;
  samples?: number;
  dash?: string;
  opacity?: number;
}

interface PlotMarker {
  x: number;
  color: string;
}

interface FillRegion {
  x0: number;
  x1: number;
  color: string;
}

interface PlotProps {
  width?: number;
  height?: number;
  xRange?: Range;
  yRange: Range;
  curves: Curve[];
  shadeSign?: { fn: NumericFn };
  markers?: PlotMarker[];
  fillBetween?: FillRegion[];
  yTicks?: number[];
  xTicksPi?: boolean;
  caption?: ReactNode;
  ariaLabel: string;
}

interface SignSegment {
  sign: 1 | -1;
  points: [number, number][];
}

function integrate(fn: NumericFn, samples = 4000): number {
  const h = TAU / samples;
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const x = -Math.PI + (i + 0.5) * h;
    total += fn(x) * h;
  }
  return total;
}

function integrateTail(fn: NumericFn, delta: number, samples = 4000): number {
  const h = TAU / samples;
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const x = -Math.PI + (i + 0.5) * h;
    if (Math.abs(x) >= delta) total += fn(x) * h;
  }
  return total;
}

function squareWave(x: number): number {
  let t = ((x % TAU) + TAU) % TAU;
  if (t > Math.PI) t -= TAU;
  return t > 0 ? 1 : -1;
}

function testFunction(x: number): number {
  return 0.9 * Math.sin(x) + 0.5 * Math.cos(2 * x) + 0.35 * Math.sin(3 * x) + 0.2 * Math.cos(5 * x);
}

function convolutionAt(x0: number, N: number, samples = 1500): number {
  const h = TAU / samples;
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const y = -Math.PI + (i + 0.5) * h;
    total += testFunction(x0 - y) * fejerExamKernel(y, N) * h;
  }
  return total / TAU;
}

function averagedDirichlet(x: number, terms: number): number {
  let total = 0;
  for (let k = 0; k < terms; k++) total += dirichletKernel(x, k);
  return total / terms;
}

function formatTick(value: number): string {
  if (Math.abs(value) < 1e-10) return "0";
  if (Number.isInteger(value)) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

function Plot({
  width = 560,
  height = 240,
  xRange = X_RANGE,
  yRange,
  curves,
  shadeSign,
  markers,
  fillBetween,
  yTicks,
  xTicksPi = true,
  caption,
  ariaLabel,
}: PlotProps) {
  const rawId = useId();
  const clipId = `fejer-plot-${rawId.replace(/:/g, "")}`;
  const pad = { left: 44, right: 14, top: 14, bottom: 26 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const ix = (x: number) => pad.left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth;
  const iy = (y: number) => height - pad.bottom - ((y - yRange[0]) / (yRange[1] - yRange[0])) * plotHeight;
  const clampY = (y: number) => Math.max(yRange[0], Math.min(yRange[1], y));

  const curvePath = (fn: NumericFn, samples = 700) => {
    let path = "";
    let previousValid = false;
    for (let i = 0; i <= samples; i++) {
      const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
      const y = fn(x);
      if (!Number.isFinite(y)) {
        previousValid = false;
        continue;
      }
      path += `${previousValid ? "L" : "M"}${ix(x).toFixed(2)},${iy(clampY(y)).toFixed(2)} `;
      previousValid = true;
    }
    return path;
  };

  const signSegments = (() => {
    if (!shadeSign) return [];
    const segments: SignSegment[] = [];
    const samples = 700;
    const zero = iy(0);
    let current: SignSegment | null = null;
    for (let i = 0; i <= samples; i++) {
      const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
      const y = shadeSign.fn(x);
      if (!Number.isFinite(y)) continue;
      const sign: 1 | -1 = y >= 0 ? 1 : -1;
      if (!current || current.sign !== sign) {
        if (current) {
          const lastX = current.points[current.points.length - 1][0];
          current.points.push([lastX, zero]);
          segments.push(current);
        }
        current = { sign, points: [[ix(x), zero]] };
      }
      current.points.push([ix(x), iy(clampY(y))]);
    }
    if (current) {
      const lastX = current.points[current.points.length - 1][0];
      current.points.push([lastX, zero]);
      segments.push(current);
    }
    return segments;
  })();

  const ticksY = yTicks ?? [yRange[0], 0, yRange[1]];
  const ticksPi: [number, string][] = [
    [-Math.PI, "−π"],
    [-Math.PI / 2, "−π/2"],
    [0, "0"],
    [Math.PI / 2, "π/2"],
    [Math.PI, "π"],
  ];

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={pad.left} y={pad.top} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>

        {ticksY.map((tick) => (
          <line
            key={`grid-y-${tick}`}
            x1={pad.left}
            x2={width - pad.right}
            y1={iy(tick)}
            y2={iy(tick)}
            stroke={COL.grid}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {xTicksPi &&
          ticksPi.map(([tick]) => (
            <line
              key={`grid-x-${tick}`}
              x1={ix(tick)}
              x2={ix(tick)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke={COL.grid}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

        <g clipPath={`url(#${clipId})`}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={iy(0)}
            y2={iy(0)}
            stroke={COL.faint}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />

          {fillBetween?.map((region) => (
            <rect
              key={`${region.x0}:${region.x1}`}
              x={ix(region.x0)}
              y={pad.top}
              width={ix(region.x1) - ix(region.x0)}
              height={plotHeight}
              fill={region.color}
              opacity={0.12}
            />
          ))}

          {signSegments.map((segment, index) => {
            const path = `M${segment.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;
            return (
              <path
                key={`${segment.sign}:${index}`}
                d={path}
                fill={segment.sign > 0 ? COL.pos : COL.neg}
                opacity={segment.sign > 0 ? 0.16 : 0.22}
              />
            );
          })}

          {curves.map((curve, index) => (
            <path
              key={`${curve.color}:${index}`}
              d={curvePath(curve.fn, curve.samples)}
              fill="none"
              stroke={curve.color}
              strokeWidth={curve.width ?? 2}
              strokeDasharray={curve.dash}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={curve.opacity ?? 1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {markers?.map((marker) => (
            <line
              key={`${marker.x}:${marker.color}`}
              x1={ix(marker.x)}
              x2={ix(marker.x)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke={marker.color}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {ticksY.map((tick) => (
          <text
            key={`label-y-${tick}`}
            x={pad.left - 6}
            y={iy(tick) + 3}
            textAnchor="end"
            fontSize={10}
            fill={COL.dim}
            fontFamily={MONO}
          >
            {formatTick(tick)}
          </text>
        ))}
        {xTicksPi &&
          ticksPi.map(([tick, label]) => (
            <text
              key={`label-x-${tick}`}
              x={ix(tick)}
              y={height - pad.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill={COL.dim}
              fontFamily={MONO}
            >
              {label}
            </text>
          ))}
      </svg>
      {caption && (
        <div className="mt-1 text-caption-1 leading-relaxed" style={{ color: COL.dim }}>
          {caption}
        </div>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => ReactNode;
}

function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps) {
  const id = useId();
  return (
    <div className="my-1.5 flex items-center gap-3">
      <label htmlFor={id} className="w-[84px] shrink-0 font-mono text-caption-1 text-fg-3">
        {label}
      </label>
      <ShellSlider
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        accent={COL.fejer}
        showValue={false}
        className="min-w-0 flex-1"
        aria-label={label}
      />
      <span className="w-[58px] shrink-0 text-right font-mono text-caption-1 text-fg-1">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

interface StatProps {
  label: ReactNode;
  value: string;
  target?: ReactNode;
  good?: boolean;
}

function Stat({ label, value, target, good = false }: StatProps) {
  return (
    <div className="rounded-md border bg-surface-2 px-3 py-2.5" style={{ borderColor: good ? COL.fejer : UI.border }}>
      <div className="text-caption-1 leading-snug text-fg-3">{label}</div>
      <div className="mt-1 font-mono text-[17px] leading-tight" style={{ color: good ? COL.fejer : COL.ink }}>
        {value}
      </div>
      {target && <div className="mt-1 font-mono text-[10px] leading-snug text-fg-3">{target}</div>}
    </div>
  );
}

function PanelHead({ n, title, sub }: { n: string; title: string; sub: ReactNode }) {
  return (
    <header className="mb-3">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-caption-1" style={{ color: COL.accent }}>
          {n}
        </span>
        <h3 className="m-0 text-footnote font-semibold tracking-[-0.01em] text-fg-1">{title}</h3>
      </div>
      <div className="mt-1.5 text-caption-1 leading-relaxed text-fg-3">{sub}</div>
    </header>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-border bg-surface-1 p-4">{children}</section>;
}

const plotGrid: CSSProperties = {
  gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
};

const statGrid: CSSProperties = {
  gridTemplateColumns: "repeat(auto-fit, minmax(min(135px, 100%), 1fr))",
};

function Panel1() {
  const [N, setN] = useState(6);
  const dirichletNorm = useMemo(() => integrate((x) => Math.abs(dirichletKernel(x, N))) / TAU, [N]);
  const fejerNorm = useMemo(() => integrate((x) => Math.abs(fejerExamKernel(x, N))) / TAU, [N]);
  const dirichletMin = useMemo(() => {
    let minimum = Infinity;
    for (let i = 0; i <= 800; i++) {
      minimum = Math.min(minimum, dirichletKernel(-Math.PI + (i / 800) * TAU, N));
    }
    return minimum;
  }, [N]);

  return (
    <Panel>
      <PanelHead
        n="01"
        title="Dirichlet vs Fejér: why averaging fixes the kernel"
        sub={
          <MathText
            text={String.raw`$D_N$ drives raw partial sums; $F_N$ drives their Cesàro averages. Move $N$ and compare the structural difference: sign, not size.`}
          />
        }
      />
      <div className="grid gap-4" style={plotGrid}>
        <div>
          <div className="mb-1 font-mono text-caption-1" style={{ color: COL.dirichlet }}>
            <MathText text={String.raw`$D_N(x)=\sin((N+\frac12)x)/\sin(x/2)$`} />
          </div>
          <Plot
            height={210}
            yRange={[-(2 * N + 1) * 0.4, 2 * N + 1]}
            yTicks={[0, 2 * N + 1]}
            curves={[{ fn: (x) => dirichletKernel(x, N), color: COL.dirichlet, width: 1.8 }]}
            shadeSign={{ fn: (x) => dirichletKernel(x, N) }}
            ariaLabel={`Dirichlet kernel of order ${N}`}
            caption="Teal lobes are positive; red lobes are negative. The negative lobes persist, violating positivity."
          />
        </div>
        <div>
          <div className="mb-1 font-mono text-caption-1" style={{ color: COL.fejer }}>
            <MathText text={String.raw`$F_N(x)=\frac1N\frac{\sin^2(Nx/2)}{\sin^2(x/2)}$`} />
          </div>
          <Plot
            height={210}
            yRange={[-N * 0.4, N]}
            yTicks={[0, N]}
            curves={[{ fn: (x) => fejerExamKernel(x, N), color: COL.fejer, width: 1.8 }]}
            shadeSign={{ fn: (x) => fejerExamKernel(x, N) }}
            ariaLabel={`Fejer kernel of order ${N}`}
            caption="A ratio of squares is non-negative. As N grows, its unit mass concentrates into a spike at zero."
          />
        </div>
      </div>
      <div className="mt-2">
        <Slider label="N" value={N} min={1} max={24} onChange={setN} />
      </div>
      <div className="mt-2.5 grid gap-2" style={statGrid}>
        <Stat
          label={<MathText text={String.raw`$(2\pi)^{-1}\int |D_N|$ — grows like $\log N$`} />}
          value={dirichletNorm.toFixed(3)}
          target="unbounded ⇒ not good"
        />
        <Stat
          label={<MathText text={String.raw`$\min_x D_N(x)$ — negative`} />}
          value={dirichletMin.toFixed(2)}
          target="sign changes"
        />
        <Stat
          label={<MathText text={String.raw`$(2\pi)^{-1}\int |F_N|$ — fixed`} />}
          value={fejerNorm.toFixed(3)}
          target="= 1 for every N ✓"
          good
        />
      </div>
    </Panel>
  );
}

function Panel2() {
  const [N, setN] = useState(8);
  const [x0, setX0] = useState(1.1);
  const convolution = useMemo(() => convolutionAt(x0, N), [N, x0]);
  const exact = testFunction(x0);
  const error = Math.abs(convolution - exact);
  const kernelShifted = (t: number) => fejerExamKernel(x0 - t, N);
  const scale = 1 / N;

  return (
    <Panel>
      <PanelHead
        n="02"
        title="Convolution = a sliding weighted average"
        sub={
          <MathText
            text={String.raw`$(f*F_N)(x_0)=(2\pi)^{-1}\int f(t)F_N(x_0-t)\,dt$. The unit-mass spike is centred at $x_0$; as $N\to\infty$, the average collapses onto $f(x_0)$.`}
          />
        }
      />
      <Plot
        height={250}
        yRange={[-1.8, 1.8]}
        yTicks={[-1, 0, 1]}
        markers={[{ x: x0, color: COL.accent }]}
        curves={[
          { fn: testFunction, color: COL.f, width: 2 },
          { fn: (t) => kernelShifted(t) * scale, color: COL.fejer, width: 1.8 },
          { fn: (t) => testFunction(t) * kernelShifted(t) * scale, color: COL.accent, width: 1.4, dash: "4 3" },
        ]}
        ariaLabel={`Sliding Fejer convolution at x zero ${x0.toFixed(2)} with order ${N}`}
        caption={
          <span>
            <span style={{ color: COL.f }}>━ f(t)</span> ·{" "}
            <span style={{ color: COL.fejer }}>
              ━ F<sub>N</sub>(x₀−t), scaled
            </span>{" "}
            · <span style={{ color: COL.accent }}>┄ product</span> · <span style={{ color: COL.accent }}>┊ x₀</span>.
            The product’s signed area, divided by 2π, is the convolution value.
          </span>
        }
      />
      <div className="mt-2">
        <Slider label="N (sharpness)" value={N} min={1} max={40} onChange={setN} />
        <Slider
          label="x₀ (centre)"
          value={x0}
          min={-3.1}
          max={3.1}
          step={0.02}
          onChange={setX0}
          format={(value) => value.toFixed(2)}
        />
      </div>
      <div className="mt-2.5 grid gap-2" style={statGrid}>
        <Stat
          label={<MathText text={String.raw`$(f*F_N)(x_0)$ — weighted average`} />}
          value={convolution.toFixed(4)}
          good
        />
        <Stat label={<MathText text={String.raw`$f(x_0)$ — true value`} />} value={exact.toFixed(4)} />
        <Stat
          label={<MathText text={String.raw`$|f*F_N-f|$ at $x_0$`} />}
          value={error.toFixed(4)}
          target="shrinks with N"
          good={error < 0.05}
        />
      </div>
    </Panel>
  );
}

function Panel3() {
  const [detail, setDetail] = useState(7);
  const order = 2 * detail + 1;

  return (
    <Panel>
      <PanelHead
        n="03"
        title="Cesàro averaging tames Gibbs oscillation"
        sub={
          <MathText
            text={String.raw`At a jump, $S_Nf$ overshoots and ripples. The Cesàro mean $\sigma_Nf=N^{-1}\sum_{m=0}^{N-1}S_mf$ uses the positive Fejér kernel, so it cannot overshoot the range of $f$.`}
          />
        }
      />
      <div className="grid gap-4" style={plotGrid}>
        <div>
          <div className="mb-1 font-mono text-caption-1" style={{ color: COL.dirichlet }}>
            <MathText text={String.raw`$S_Nf=f*D_N$ (partial sum)`} />
          </div>
          <Plot
            height={220}
            yRange={[-1.6, 1.6]}
            yTicks={[-1, 0, 1]}
            curves={[
              { fn: squareWave, color: COL.faint, width: 1.6, dash: "5 4" },
              { fn: (x) => squareWavePartialSumOrder(x, order), color: COL.dirichlet, width: 1.6 },
            ]}
            ariaLabel={`Square wave Fourier partial sum of order ${order}`}
            caption="The Gibbs ears near 0 and ±π narrow but do not shrink: their height remains about 9% of the jump."
          />
        </div>
        <div>
          <div className="mb-1 font-mono text-caption-1" style={{ color: COL.fejer }}>
            <MathText text={String.raw`$\sigma_Nf=f*F_N$ (Cesàro mean)`} />
          </div>
          <Plot
            height={220}
            yRange={[-1.6, 1.6]}
            yTicks={[-1, 0, 1]}
            curves={[
              { fn: squareWave, color: COL.faint, width: 1.6, dash: "5 4" },
              { fn: (x) => cesaroSquareWaveOrder(x, order), color: COL.fejer, width: 1.8 },
            ]}
            ariaLabel={`Cesaro mean of a square wave at order ${order}`}
            caption="No overshoot: a positive weighted average stays inside the range of the original function."
          />
        </div>
      </div>
      <div className="mt-2">
        <Slider label="detail" value={detail} min={1} max={30} onChange={setDetail} format={() => order} />
      </div>
      <p className="mt-2 text-caption-1 leading-relaxed text-fg-3">
        Dashed grey is the target square wave. Uniform convergence is not expected across the jumps themselves; away
        from them, the Fejér means converge cleanly.
      </p>
    </Panel>
  );
}

function Panel4() {
  const [N, setN] = useState(8);
  const [delta, setDelta] = useState(0.6);
  const mass = useMemo(() => integrate((x) => fejerExamKernel(x, N)) / TAU, [N]);
  const norm = useMemo(() => integrate((x) => Math.abs(fejerExamKernel(x, N))), [N]);
  const tail = useMemo(() => integrateTail((x) => fejerExamKernel(x, N), delta) / TAU, [N, delta]);
  const bound = 1 / (N * Math.sin(delta / 2) ** 2);

  return (
    <Panel>
      <PanelHead
        n="04"
        title="The three good-kernel properties, live"
        sub={
          <MathText
            text={String.raw`A family $\{K_N\}$ is good when it has unit mass, uniformly bounded $L^1$ norm, and vanishing mass outside every fixed neighbourhood of $0$.`}
          />
        }
      />
      <Plot
        height={210}
        yRange={[-N * 0.3, N]}
        yTicks={[0, N]}
        fillBetween={[
          { x0: -Math.PI, x1: -delta, color: COL.dirichlet },
          { x0: delta, x1: Math.PI, color: COL.dirichlet },
        ]}
        markers={[
          { x: -delta, color: COL.dirichlet },
          { x: delta, color: COL.dirichlet },
        ]}
        curves={[{ fn: (x) => fejerExamKernel(x, N), color: COL.fejer, width: 1.8 }]}
        ariaLabel={`Fejer kernel tail outside delta ${delta.toFixed(2)} at order ${N}`}
        caption={
          <span>
            The shaded tail is <MathText text={String.raw`$\delta\le |x|\le\pi$`} />. As N grows, its mass tends to zero
            while the central mass remains one.
          </span>
        }
      />
      <div className="mt-2">
        <Slider label="N" value={N} min={1} max={40} onChange={setN} />
        <Slider
          label="δ (cutoff)"
          value={delta}
          min={0.15}
          max={2.5}
          step={0.01}
          onChange={setDelta}
          format={(value) => value.toFixed(2)}
        />
      </div>
      <div
        className="mt-2.5 grid gap-2"
        style={{ ...statGrid, gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))" }}
      >
        <Stat
          label={<MathText text={String.raw`$(a)\quad (2\pi)^{-1}\int_{-\pi}^{\pi}F_N$`} />}
          value={mass.toFixed(4)}
          target="= 1 (unit mass) ✓"
          good={Math.abs(mass - 1) < 0.01}
        />
        <Stat
          label={<MathText text={String.raw`$(b)\quad \int_{-\pi}^{\pi}|F_N|$`} />}
          value={norm.toFixed(3)}
          target={`= 2π ≈ ${TAU.toFixed(3)} ✓`}
          good={Math.abs(norm - TAU) < 0.05}
        />
        <Stat
          label={<MathText text={String.raw`$(c)\quad (2\pi)^{-1}\int_{\delta\le|x|\le\pi}F_N$`} />}
          value={tail.toFixed(4)}
          target="→ 0 as N → ∞"
          good={tail < 0.05}
        />
        <Stat
          label={<MathText text={String.raw`$1/(N\sin^2(\delta/2))$ bound`} />}
          value={bound.toFixed(4)}
          target="tail ≤ bound → 0"
          good={bound < 0.1}
        />
      </div>
      <p className="mt-2.5 text-caption-1 leading-relaxed text-fg-3">
        <MathText
          text={String.raw`On $\delta\le |x|\le\pi$, $\sin^2(x/2)\ge\sin^2(\delta/2)$ and $\sin^2(Nx/2)\le1$, hence $F_N(x)\le [N\sin^2(\delta/2)]^{-1}$.`}
        />
      </p>
    </Panel>
  );
}

function Panel5() {
  const [N, setN] = useState(6);
  const [showAll, setShowAll] = useState(true);
  const peak = 2 * (N - 1) + 1;
  const dirichletCurves: Curve[] = showAll
    ? Array.from({ length: N }, (_, k) => {
        const mix = N > 1 ? Math.round((k / (N - 1)) * 100) : 0;
        return {
          fn: (x: number) => dirichletKernel(x, k),
          color: `color-mix(in srgb, ${COL.dirichlet} ${100 - mix}%, ${COL.fejer})`,
          width: 1,
          opacity: 0.5,
          samples: 600,
        };
      })
    : [{ fn: (x) => dirichletKernel(x, N - 1), color: COL.dirichlet, width: 1.4 }];

  return (
    <Panel>
      <PanelHead
        n="05"
        title="Watch Fₙ assemble: the average of the Dirichlet kernels"
        sub={
          <MathText
            text={String.raw`$F_N=N^{-1}\sum_{k=0}^{N-1}D_k$. All $D_k$ peak at zero, while their off-centre negative lobes are staggered; averaging cancels the oscillations and preserves the common peak.`}
          />
        }
      />
      <div className="grid gap-4" style={plotGrid}>
        <div>
          <div className="mb-1 font-mono text-caption-1 text-fg-3">
            <MathText text={String.raw`ingredients: $D_0,\ldots,D_{N-1}$`} />
          </div>
          <Plot
            height={230}
            yRange={[-peak * 0.5, peak]}
            yTicks={[0, peak]}
            curves={dirichletCurves}
            ariaLabel={`${N} Dirichlet kernels before averaging`}
            caption="Each curve is one Dₖ. Their central peaks align, but their negative lobes occur at different positions."
          />
        </div>
        <div>
          <div className="mb-1 font-mono text-caption-1" style={{ color: COL.fejer }}>
            <MathText text={String.raw`average: $F_N=N^{-1}\sum D_k$`} />
          </div>
          <Plot
            height={230}
            yRange={[-N * 0.5, N]}
            yTicks={[0, N]}
            curves={[
              { fn: (x) => averagedDirichlet(x, N), color: COL.fejer, width: 2 },
              { fn: (x) => fejerExamKernel(x, N), color: COL.accent, width: 1, dash: "3 3" },
            ]}
            shadeSign={{ fn: (x) => averagedDirichlet(x, N) }}
            ariaLabel={`Average of ${N} Dirichlet kernels compared with the Fejer closed form`}
            caption={
              <span>
                <span style={{ color: COL.fejer }}>━ running average</span> matches{" "}
                <span style={{ color: COL.accent }}>┄ closed form</span> exactly. The result is non-negative.
              </span>
            }
          />
        </div>
      </div>
      <div className="mt-2">
        <Slider label="N (terms)" value={N} min={1} max={20} onChange={setN} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <ShellButton controlSize="small" active={showAll} onClick={() => setShowAll((value) => !value)}>
          {showAll ? "showing all Dₖ" : "show all Dₖ"}
        </ShellButton>
        <span className="min-w-[220px] flex-1 text-caption-1 leading-relaxed text-fg-3">
          Toggle the ingredients to isolate the highest-order Dirichlet kernel or reveal the full family entering the
          average.
        </span>
      </div>
    </Panel>
  );
}

export default function FejerExplorerFigure() {
  return (
    <figure className="m-0 space-y-4" style={{ fontFamily: SANS }}>
      <header className="px-1 pb-0.5">
        <div className="mb-1 font-mono text-[10px] tracking-[0.1em]" style={{ color: COL.accent }}>
          TMA4170 · PROBLEM 3 · FEJÉR & GOOD KERNELS
        </div>
        <h2 className="m-0 text-title-3 font-semibold tracking-[-0.02em] text-fg-1">
          Why averaging makes a kernel good
        </h2>
        <p className="mt-2 text-caption-1 leading-relaxed text-fg-3">
          Raw Fourier partial sums use the oscillating Dirichlet kernel. Cesàro averaging replaces it with the positive
          Fejér kernel—an approximate identity—so continuous periodic functions are recovered uniformly.
        </p>
      </header>

      <Panel1 />
      <Panel2 />
      <Panel3 />
      <Panel4 />
      <Panel5 />

      <figcaption className="px-1 text-center text-caption-1 leading-relaxed text-fg-4">
        All integrals are computed numerically on [−π, π]. Convolutions use the periodic normalization{" "}
        <MathText text={String.raw`$(2\pi)^{-1}\int f(x-y)F_N(y)\,dy$`} />.
      </figcaption>
    </figure>
  );
}
