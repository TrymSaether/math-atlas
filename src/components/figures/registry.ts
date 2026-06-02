import { type ComponentType, type LazyExoticComponent, lazy } from "react";

import { type FigureProps } from "./types";

/**
 * Node id → interactive figure component. Lazy-loaded so each figure is its own
 * chunk, fetched only when that node's panel opens (the graph never mounts them).
 *
 * To add a figure: write a `default`-exporting component in this folder taking
 * `FigureProps`, then add an entry here. NodePanel consults this map before
 * falling back to the static `ThemedDiagram`.
 */
export const FIGURE_REGISTRY: Record<string, LazyExoticComponent<ComponentType<FigureProps>>> = {
  convolution: lazy(() => import("./ConvolutionFigure")),
  convolution_theorem: lazy(() => import("./ConvolutionFigure")),
  circular_convolution: lazy(() => import("./ConvolutionFigure")),
  fourier_coefficient: lazy(() => import("./SpectrumFigure")),
  fourier_series: lazy(() => import("./SeriesFigure")),
  partial_sum: lazy(() => import("./SeriesFigure")),
  real_fourier_series: lazy(() => import("./SeriesFigure")),
  decay_smoothness: lazy(() => import("./SpectrumFigure")),
  gibbs_phenomenon: lazy(() => import("./GibbsFigure")),
  dirichlet_kernel: lazy(() => import("./KernelFigure")),
  fejer_kernel: lazy(() => import("./KernelFigure")),
  poisson_kernel: lazy(() => import("./KernelFigure")),
  gaussian_transform: lazy(() => import("./GaussianFigure")),
  uncertainty_principle: lazy(() => import("./GaussianFigure")),
  sampling_theorem: lazy(() => import("./SamplingFigure")),
  aliasing: lazy(() => import("./SamplingFigure")),
  heat_equation: lazy(() => import("./HeatFigure")),
};

export function hasInteractiveFigure(nodeId: string): boolean {
  return nodeId in FIGURE_REGISTRY;
}
