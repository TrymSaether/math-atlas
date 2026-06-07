import { useState } from "react";

import {
  dirichletKernel,
  fejerKernel,
  kernelPeak,
  poissonKernel,
} from "../../lib/figures/fourierMath";
import { FigureFrame, FunctionCurve, Line } from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

type Kind = "dirichlet" | "fejer" | "poisson";

const KIND_BY_NODE: Record<string, Kind> = {
  dirichlet_kernel: "dirichlet",
  fejer_kernel: "fejer",
  poisson_kernel: "poisson",
};

const CAPTION: Record<Kind, string> = {
  dirichlet: "Dirichlet kernel: dips below zero — its L¹ norm grows like log N.",
  fejer: "Fejér kernel: non-negative and concentrating — a good kernel.",
  poisson: "Poisson kernel: a good kernel concentrating as r → 1.",
};

/**
 * One component, three nodes. Renders the (normalized) Dirichlet, Fejér, or
 * Poisson kernel chosen by node id, with a slider on N (or r for Poisson).
 */
export default function KernelFigure({ nodeId }: FigureProps) {
  const kind = KIND_BY_NODE[nodeId] ?? "dirichlet";
  const isPoisson = kind === "poisson";
  // Dirichlet/Fejér: integer N. Poisson: r in (0,1) via an integer slider /100.
  const [raw, setRaw] = useState(isPoisson ? 70 : 6);
  const param = isPoisson ? raw / 100 : raw;
  const kernel = (x: number) => {
    const peak = kernelPeak(kind, param);
    const v =
      kind === "dirichlet"
        ? dirichletKernel(x, param)
        : kind === "fejer"
          ? fejerKernel(x, param)
          : poissonKernel(x, param);
    return v / peak; // normalize so the peak is 1, keeping the shape readable
  };

  // Dirichlet dips negative; the others are ≥ 0.
  const yDomain: [number, number] = kind === "dirichlet" ? [-0.35, 1.1] : [-0.1, 1.1];
  const discreteHandleMin = 0.25;
  const discreteHandleMax = Math.PI;
  const handleX = isPoisson
    ? param * Math.PI
    : discreteHandleMin + ((raw - 1) / 24) * (discreteHandleMax - discreteHandleMin);

  return (
    <figure className="m-0">
      <FigureFrame xDomain={[-Math.PI, Math.PI]} yDomain={yDomain} grid>
        <FunctionCurve y={kernel} domain={[-Math.PI, Math.PI]} color="var(--accent)" weight={2.1} />
        <Line.Segment point1={[-handleX, yDomain[0]]} point2={[-handleX, yDomain[1]]} color="var(--fg-4)" weight={1} style="dashed" />
        <Line.Segment point1={[handleX, yDomain[0]]} point2={[handleX, yDomain[1]]} color="var(--fg-4)" weight={1} style="dashed" />
      </FigureFrame>
      <RangeControl
        min={isPoisson ? 5 : 1}
        max={isPoisson ? 95 : 25}
        value={raw}
        onChange={setRaw}
        label={isPoisson ? `r = ${param.toFixed(2)}` : `N = ${raw}`}
        ariaLabel={isPoisson ? "Poisson kernel radius r" : "Kernel order N"}
      />
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {CAPTION[kind]}
      </figcaption>
    </figure>
  );
}
