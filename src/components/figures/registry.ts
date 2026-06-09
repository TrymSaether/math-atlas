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
export const FIGURE_REGISTRY: Record<
  string,
  LazyExoticComponent<ComponentType<FigureProps>>
> = {
  function: lazy(() => import("./FunctionSetFigure")),
  domain: lazy(() => import("./FunctionSetFigure")),
  codomain: lazy(() => import("./FunctionSetFigure")),
  image_of_function: lazy(() => import("./FunctionSetFigure")),
  preimage: lazy(() => import("./FunctionSetFigure")),
  inverse_of_function: lazy(() => import("./FunctionSetFigure")),
  restriction_of_function: lazy(() => import("./FunctionSetFigure")),

  injective: lazy(() => import("./MappingPropertyFigure")),
  surjective: lazy(() => import("./MappingPropertyFigure")),
  bijective: lazy(() => import("./MappingPropertyFigure")),

  parseval_identity: lazy(() => import("./ParsevalFigure")),
  plancherel_theorem: lazy(() => import("./ParsevalFigure")),
  riemann_lebesgue_lemma: lazy(() => import("./RiemannLebesgueFigure")),
  mean_square_convergence: lazy(() => import("./L2ConvergenceFigure")),
  convolution: lazy(() => import("./ConvolutionFigure")),
  convolution_theorem: lazy(() => import("./ConvolutionFigure")),
  circular_convolution: lazy(() => import("./ConvolutionFigure")),
  fourier_coefficient: lazy(() => import("./SpectrumFigure")),
  fourier_spectrum: lazy(() => import("./SpectrumFigure")),
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
  hahn_banach_theorem: lazy(() => import("./HahnBanachFigure")),

  // --- Exercises & exam problems: reuse the figure that best illustrates them ---
  // Fourier-series waveforms (triangle / sawtooth / square + partial sums).
  exam2025_p1a: lazy(() => import("./SeriesFigure")),
  ss2_6_ex3: lazy(() => import("./SeriesFigure")),
  ss2_6_ex4: lazy(() => import("./SeriesFigure")),
  ss2_6_ex5: lazy(() => import("./SeriesFigure")),
  ss2_6_ex8: lazy(() => import("./SeriesFigure")),
  // Summability kernels (Dirichlet / Fejér).
  exam2025_p2: lazy(() => import("./KernelFigure")),
  ss2_6_ex15: lazy(() => import("./KernelFigure")),
  ss2_6_ex17b: lazy(() => import("./KernelFigure")),
  ss2_7_prob2: lazy(() => import("./KernelFigure")),
  // Coefficient decay ↔ smoothness, and transform pairs.
  ss2_6_ex10: lazy(() => import("./SpectrumFigure")),
  ss3_3_ex8: lazy(() => import("./SpectrumFigure")),
  ss3_3_ex15: lazy(() => import("./SpectrumFigure")),
  ss3_3_ex17: lazy(() => import("./SpectrumFigure")),
  ss5_5_ex2: lazy(() => import("./SpectrumFigure")),
  ss5_5_ex3a: lazy(() => import("./SpectrumFigure")),
  // Gaussian & the uncertainty principle.
  exam2025_p5: lazy(() => import("./GaussianFigure")),
  ss5_5_ex6: lazy(() => import("./GaussianFigure")),
  ss5_5_ex23: lazy(() => import("./GaussianFigure")),
  ss6_6_ex6: lazy(() => import("./GaussianFigure")),
  // Heat flow / approximate identity.
  exam2025_p6: lazy(() => import("./HeatFigure")),
  ss4_5_ex11: lazy(() => import("./HeatFigure")),
  ss5_6_prob1: lazy(() => import("./HeatFigure")),
  ss5_6_prob2: lazy(() => import("./HeatFigure")),
  ss6_6_ex7: lazy(() => import("./HeatFigure")),
  // Convolution.
  ss5_5_ex7: lazy(() => import("./ConvolutionFigure")),
  // Sampling / sinc / discrete reconstruction.
  exam2025_p3a: lazy(() => import("./SamplingFigure")),
  exam2025_p3b: lazy(() => import("./SamplingFigure")),
  ss7_3_ex1: lazy(() => import("./SamplingFigure")),
  ss7_3_ex3: lazy(() => import("./SamplingFigure")),
};

export function hasInteractiveFigure(nodeId: string): boolean {
  return nodeId in FIGURE_REGISTRY;
}
