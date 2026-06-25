import { useMemo, useState } from "react";

import { linspace } from "../../lib/figures/plot";
import { dirichletKernel, fejerKernel, kernelPeak, poissonKernel } from "../../lib/figures/fourierMath";
import { MathText } from "../../lib/katex";
import { DIA, FigureCaption, FigureFrame, FunctionCurve, LaTeX, Line, Polygon, STROKE, type Vec2 } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";
import { type FigureProps } from "./types";

type Kind = "dirichlet" | "fejer" | "poisson";

const KIND_BY_NODE: Record<string, Kind> = {
  dirichlet_kernel: "dirichlet",
  fejer_kernel: "fejer",
  poisson_kernel: "poisson",
};

const EXERCISE_FOCUS: Record<string, Kind> = {
  exam2025_p2: "fejer",
  ss2_6_ex15: "fejer",
  ss2_6_ex17b: "fejer",
  ss2_7_prob2: "dirichlet",
};

const OPTIONS: SegmentOption<Kind>[] = [
  { value: "dirichlet", label: "$D_N$" },
  { value: "fejer", label: "$F_N$" },
  { value: "poisson", label: "$P_r$" },
];

const LABEL: Record<Kind, string> = {
  dirichlet: String.raw`D_N`,
  fejer: String.raw`F_N`,
  poisson: String.raw`P_r`,
};

const CAPTION: Record<Kind, string> = {
  dirichlet: "Dirichlet kernel: sharp Fourier cutoff with equal weights and oscillatory side lobes.",
  fejer: "Fejer kernel: Cesaro damping with triangular weights and no negative side lobes.",
  poisson: "Poisson kernel: Abel damping with exponentially decaying weights and no negative side lobes.",
};

const SUMMARY: Record<Kind, string> = {
  dirichlet: String.raw`Not positive; resolution $\Delta x\asymp N^{-1}$; peak $D_N(0)=2N+1$; size $\|D_N\|_1\sim\log N$.`,
  fejer: String.raw`Positive; resolution $\Delta x\asymp N^{-1}$; peak $F_N(0)=N+1$; size $\|F_N\|_1=O(1)$.`,
  poisson: String.raw`Positive; resolution $\Delta x\asymp 1-r$; peak $P_r(0)=\frac{1+r}{1-r}$; size $\|P_r\|_1=O(1)$.`,
};

const XS = linspace(-Math.PI, Math.PI, 620);

const Y_DOMAIN: [number, number] = [-0.34, 1.15];

const WEIGHT_DOMAIN: [number, number] = [-14.7, 15.0];
const WEIGHT_Y_DOMAIN: [number, number] = [-0.18, 1.18];
const WEIGHT_INDICES = Array.from({ length: 29 }, (_, i) => i - 14);

const MAIN_X_AXIS_Y = 0;
const WEIGHT_X_AXIS_Y = 0;
const WEIGHT_AXIS_LEFT = -14.4;
const WEIGHT_AXIS_RIGHT = 14.55;

function kernelValue(kind: Kind, x: number, param: number): number {
  if (kind === "dirichlet") return dirichletKernel(x, param);
  if (kind === "fejer") return fejerKernel(x, param);
  return poissonKernel(x, param);
}

function normalizedKernel(kind: Kind, x: number, param: number): number {
  return kernelValue(kind, x, param) / kernelPeak(kind, param);
}

function concentrationWidth(kind: Kind, param: number): number {
  if (kind === "poisson") return Math.max(0.16, (1 - param) * Math.PI);
  return Math.max(0.16, Math.PI / (param + 1));
}

function spectralWeight(kind: Kind, index: number, param: number): number {
  const k = Math.abs(index);
  if (kind === "dirichlet") return k <= param ? 1 : 0;
  if (kind === "fejer") return Math.max(0, 1 - k / (param + 1));
  return Math.pow(param, k);
}

function lobePolygons(samples: Vec2[], sign: "positive" | "negative"): Vec2[][] {
  const polys: Vec2[][] = [];
  let current: Vec2[] = [];

  samples.forEach(([x, y], index) => {
    const keep = sign === "positive" ? y >= 0 : y <= 0;

    if (keep) {
      if (current.length === 0) current.push([x, 0]);
      current.push([x, y]);
      return;
    }

    if (current.length > 1) {
      current.push([samples[index - 1][0], 0]);
      polys.push(current);
    }

    current = [];
  });

  if (current.length > 1) {
    current.push([samples[samples.length - 1][0], 0]);
    polys.push(current);
  }

  return polys;
}

function initialKind(nodeId: string): Kind {
  return KIND_BY_NODE[nodeId] ?? EXERCISE_FOCUS[nodeId] ?? "dirichlet";
}

/**
 * Shared kernel visual for the core kernel nodes and exercises that lean on
 * summability-kernel behavior. It starts from the node's natural focus, but the
 * control lets readers compare the three standard kernels in one place.
 */
export default function KernelFigure({ nodeId }: FigureProps) {
  const [kind, setKind] = useState<Kind>(() => initialKind(nodeId));
  const isPoisson = kind === "poisson";

  const [rawN, setRawN] = useState(kind === "dirichlet" ? 8 : 10);
  const [rawR, setRawR] = useState(72);

  const raw = isPoisson ? rawR : rawN;
  const param = isPoisson ? raw / 100 : raw;
  const peak = kernelPeak(kind, param);
  const width = concentrationWidth(kind, param);

  const samples = useMemo(() => XS.map((x): Vec2 => [x, normalizedKernel(kind, x, param)]), [kind, param]);
  const positiveLobes = useMemo(() => lobePolygons(samples, "positive"), [samples]);
  const negativeLobes = useMemo(() => lobePolygons(samples, "negative"), [samples]);
  const hasNegativeLobes = kind === "dirichlet";
  const massLabel = kind === "dirichlet" ? String.raw`=O(\log N)` : String.raw`=O(1)`;
  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={Y_DOMAIN} height={205} grid>
        <Polygon
          points={[
            [-width, 0],
            [-width, 1.08],
            [width, 1.08],
            [width, 0],
          ]}
          color={DIA.codomain}
          fillOpacity={0.1}
          strokeOpacity={0}
        />
        {positiveLobes.map((points, i) => (
          <Polygon key={`pos-${i}`} points={points} color={DIA.accent} fillOpacity={0.12} strokeOpacity={0} />
        ))}
        {hasNegativeLobes &&
          negativeLobes.map((points, i) => (
            <Polygon key={`neg-${i}`} points={points} color={DIA.alert} fillOpacity={0.18} strokeOpacity={0} />
          ))}
        <Line.Segment
          point1={[-Math.PI, MAIN_X_AXIS_Y]}
          point2={[Math.PI, MAIN_X_AXIS_Y]}
          color={DIA.ink}
          weight={STROKE.guide}
        />
        <FunctionCurve
          y={(x) => normalizedKernel(kind, x, param)}
          domain={[-Math.PI, Math.PI]}
          color={kind === "dirichlet" ? DIA.warning : DIA.accent}
          weight={STROKE.curve}
        />
        <Line.Segment
          point1={[-width, Y_DOMAIN[0]]}
          point2={[-width, Y_DOMAIN[1]]}
          color={DIA.codomain}
          weight={STROKE.guide}
          style="dashed"
        />
        <Line.Segment
          point1={[width, Y_DOMAIN[0]]}
          point2={[width, Y_DOMAIN[1]]}
          color={DIA.codomain}
          weight={STROKE.guide}
          style="dashed"
        />
        <LaTeX at={[0, -0.25]} tex={String.raw`\Delta x_{\mathrm{res}}`} />
        <LaTeX at={[-2, 1]} tex={String.raw`\|${LABEL[kind]}\|_1${massLabel}`} />
        <LaTeX at={[2, 1]} tex={String.raw`${LABEL[kind]}(0)=${isPoisson ? peak.toFixed(1) : peak}`} />
        // x-axis label
        <LaTeX at={[Math.PI - 0.3, -0.25]} tex={String.raw`x`} />
        // y-axis label
        <LaTeX at={[-0.3, 1.05]} tex={String.raw`\widehat K(k)`} />
      </FigureFrame>

      <div className="mt-5">
        <FigureFrame xDomain={WEIGHT_DOMAIN} yDomain={WEIGHT_Y_DOMAIN} height={100} axes={false}>
          {WEIGHT_INDICES.map((k) => {
            const height = spectralWeight(kind, k, param);
            const active = height > 0;

            return (
              <Polygon
                key={k}
                points={[
                  [k - 0.32, 0],
                  [k - 0.32, height],
                  [k + 0.32, height],
                  [k + 0.32, 0],
                ]}
                color={k === 0 ? DIA.accent : DIA.codomain}
                fillOpacity={active ? (k === 0 ? 0.92 : 0.72) : 0.08}
                strokeOpacity={0}
              />
            );
          })}

          <Line.Segment
            point1={[WEIGHT_AXIS_LEFT, WEIGHT_X_AXIS_Y]}
            point2={[WEIGHT_AXIS_RIGHT, WEIGHT_X_AXIS_Y]}
            color={DIA.ink}
            weight={STROKE.guide}
          />

          <Polygon
            points={[
              [WEIGHT_AXIS_RIGHT, WEIGHT_X_AXIS_Y],
              [WEIGHT_AXIS_RIGHT - 0.34, WEIGHT_X_AXIS_Y + 0.045],
              [WEIGHT_AXIS_RIGHT - 0.34, WEIGHT_X_AXIS_Y - 0.045],
            ]}
            color={DIA.ink}
            fillOpacity={1}
            strokeOpacity={0}
          />

          <LaTeX at={[WEIGHT_AXIS_RIGHT - 0.16, WEIGHT_X_AXIS_Y + 0.2]} tex={String.raw`k`} />
        </FigureFrame>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SegmentedControl value={kind} options={OPTIONS} onChange={setKind} ariaLabel="Kernel type" />
      </div>

      <RangeControl
        min={isPoisson ? 5 : 1}
        max={isPoisson ? 95 : 25}
        value={raw}
        onChange={isPoisson ? setRawR : setRawN}
        label={isPoisson ? `r = ${param.toFixed(2)}` : `N = ${raw}`}
        ariaLabel={isPoisson ? "Poisson kernel radius r" : "Kernel order N"}
      />

      <FigureCaption>
        <MathText
          text={`${CAPTION[kind]} The lower panel plots Fourier weights $\\widehat K(k)$ along the frequency axis $k$. ${SUMMARY[kind]}`}
        />
      </FigureCaption>
    </figure>
  );
}
