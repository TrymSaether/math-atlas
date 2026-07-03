import { type ComponentType, type LazyExoticComponent, lazy } from "react";

import type { GraphNode } from "@/maps/types";
import { type FigureProps } from "./types";

type FigureComponent = LazyExoticComponent<ComponentType<FigureProps>>;

/**
 * Node id → interactive figure component. Lazy-loaded so each figure is its own
 * chunk, fetched only when that node's panel opens (the graph never mounts them).
 *
 * To add a figure: write a `default`-exporting component in this folder taking
 * `FigureProps`, then add an entry here. NodePanel consults this map before
 * falling back to the static `ThemedDiagram`.
 */
export const FIGURE_REGISTRY: Record<string, FigureComponent> = {
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
  integer_frequency: lazy(() => import("./IntegerFrequencyFigure")),
  fourier_coefficient: lazy(() => import("./SpectrumFigure")),
  fourier_spectrum: lazy(() => import("./SpectrumFigure")),
  fourier_series: lazy(() => import("./SeriesFigure")),
  partial_sum: lazy(() => import("./SeriesFigure")),
  real_fourier_series: lazy(() => import("./SeriesFigure")),
  square_wave_builder: lazy(() => import("./SquareWaveBuilderFigure")),
  square_wave_fourier_builder: lazy(() => import("./SquareWaveBuilderFigure")),
  decay_smoothness: lazy(() => import("./SpectrumFigure")),
  gibbs_phenomenon: lazy(() => import("./GibbsFigure")),
  dirichlet_kernel: lazy(() => import("./KernelFigure")),
  fejer_kernel: lazy(() => import("./FejerExplorerFigure")),
  fejer_theorem: lazy(() => import("./FejerExplorerFigure")),
  good_kernel: lazy(() => import("./FejerExplorerFigure")),
  approximate_identity: lazy(() => import("./FejerExplorerFigure")),
  poisson_kernel: lazy(() => import("./KernelFigure")),
  gaussian_transform: lazy(() => import("./GaussianFigure")),
  uncertainty_principle: lazy(() => import("./GaussianFigure")),
  sampling_theorem: lazy(() => import("./SamplingFigure")),
  aliasing: lazy(() => import("./SamplingFigure")),
  heat_equation: lazy(() => import("./HeatFigure")),
  hahn_banach_theorem: lazy(() => import("./HahnBanachFigure")),
  norm: lazy(() => import("./NormUnitBallFigure")),
  normed_vector_space: lazy(() => import("./NormUnitBallFigure")),
  closed_unit_ball: lazy(() => import("./NormUnitBallFigure")),
  lp_norms_on_r2: lazy(() => import("./NormUnitBallFigure")),
  equivalent_norms: lazy(() => import("./NormUnitBallFigure")),
  linear_operator: lazy(() => import("./FunctionalOperatorFigure")),
  bounded_linear_operator: lazy(() => import("./FunctionalOperatorFigure")),
  continuous_linear_operator: lazy(() => import("./FunctionalOperatorFigure")),
  operator_norm: lazy(() => import("./FunctionalOperatorFigure")),
  compact_operator: lazy(() => import("./FunctionalOperatorFigure")),
  weak_topology: lazy(() => import("./WeakConvergenceFigure")),
  weak_star_topology: lazy(() => import("./WeakConvergenceFigure")),
  weak_convergence: lazy(() => import("./WeakConvergenceFigure")),
  weak_star_convergence: lazy(() => import("./WeakConvergenceFigure")),
  weakly_bounded_set: lazy(() => import("./WeakConvergenceFigure")),
  unit_ball_weak_star_assumption: lazy(() => import("./WeakConvergenceFigure")),
  projection_operator: lazy(() => import("./HilbertSpectralFigure")),
  projection_theorem: lazy(() => import("./HilbertSpectralFigure")),
  self_adjoint_operator: lazy(() => import("./HilbertSpectralFigure")),
  spectrum: lazy(() => import("./HilbertSpectralFigure")),
  spectral_theorem: lazy(() => import("./HilbertSpectralFigure")),
  compact_self_adjoint_operator_assumption: lazy(() => import("./HilbertSpectralFigure")),

  // Cauchy sequences and convergence modes.
  cauchy_sequence: lazy(() => import("./CauchySequenceFigure")),

  // Convergence modes: uniform vs pointwise vs mean-square.
  convergence: lazy(() => import("./ConvergenceModesFigure")),
  pointwise_limit: lazy(() => import("./ConvergenceModesFigure")),
  pointwise_limits_of_operators: lazy(() => import("./ConvergenceModesFigure")),

  // Sequence spaces ℓᵖ / Lᵖ / c₀ and their nesting.
  ell_p_spaces: lazy(() => import("./SequenceSpaceFigure")),
  l_p_spaces: lazy(() => import("./SequenceSpaceFigure")),
  c_0: lazy(() => import("./SequenceSpaceFigure")),
  c_k: lazy(() => import("./SequenceSpaceFigure")),
  ell_2_as_hilbert_space: lazy(() => import("./SequenceSpaceFigure")),

  // Inner-product geometry: angle, orthogonality, projection.
  inner_product_space: lazy(() => import("./InnerProductFigure")),
  hilbert_space: lazy(() => import("./InnerProductFigure")),

  // Uniform boundedness principle (Banach–Steinhaus).
  uniform_boundedness_principle: lazy(() => import("./UniformBoundednessFigure")),
  pointwise_bounded_family_assumption: lazy(() => import("./UniformBoundednessFigure")),
  bounded_operators_banach_space: lazy(() => import("./UniformBoundednessFigure")),

  // --- Exercises & exam problems: reuse the figure that best illustrates them ---
  // Fourier-series waveforms (triangle / sawtooth / square + partial sums).
  exam2025_p1a: lazy(() => import("./SeriesFigure")),
  ss2_6_ex3: lazy(() => import("./SeriesFigure")),
  ss2_6_ex4: lazy(() => import("./SeriesFigure")),
  ss2_6_ex5: lazy(() => import("./SeriesFigure")),
  ss2_6_ex8: lazy(() => import("./SeriesFigure")),
  // Summability kernels (Dirichlet / Fejér).
  tma4170_2026_problem_3: lazy(() => import("./FejerExplorerFigure")),
  exam2025_p2: lazy(() => import("./FejerExplorerFigure")),
  ss2_6_ex15: lazy(() => import("./FejerExplorerFigure")),
  ss2_6_ex17b: lazy(() => import("./FejerExplorerFigure")),
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

const CONCEPT_FIGURE_TAGS: { tags: string[]; component: FigureComponent }[] = [
  { tags: ["unit-ball", "norm"], component: FIGURE_REGISTRY.norm },
  { tags: ["operator", "linear"], component: FIGURE_REGISTRY.linear_operator },
  { tags: ["weak", "weak-*"], component: FIGURE_REGISTRY.weak_topology },
  { tags: ["hilbert", "projection"], component: FIGURE_REGISTRY.projection_operator },
  { tags: ["hilbert", "inner-product"], component: FIGURE_REGISTRY.inner_product_space },
  { tags: ["spectrum", "operator"], component: FIGURE_REGISTRY.spectrum },
  { tags: ["cauchy", "sequence"], component: FIGURE_REGISTRY.cauchy_sequence },
  { tags: ["pointwise", "convergence"], component: FIGURE_REGISTRY.convergence },
  { tags: ["fourier", "kernel"], component: FIGURE_REGISTRY.dirichlet_kernel },
  { tags: ["convolution"], component: FIGURE_REGISTRY.convolution },
  { tags: ["sampling"], component: FIGURE_REGISTRY.sampling_theorem },
  { tags: ["gaussian"], component: FIGURE_REGISTRY.gaussian_transform },
  { tags: ["heat"], component: FIGURE_REGISTRY.heat_equation },
];

function normalizedTags(node: GraphNode): Set<string> {
  return new Set(
    [node.kind, node.domain, node.label, ...node.tags]
      .flatMap((value) => {
        const raw = value.toLowerCase().trim();
        if (!raw) return [];
        return [raw, raw.replace(/_/g, "-"), ...raw.split(/[\s_/.-]+/)];
      })
      .filter(Boolean),
  );
}

function tagMatch(node: GraphNode): FigureComponent | null {
  const tags = normalizedTags(node);
  for (const candidate of CONCEPT_FIGURE_TAGS) {
    if (candidate.tags.every((tag) => tags.has(tag))) return candidate.component;
  }
  return null;
}

export function exactInteractiveFigure(nodeId: string): FigureComponent | null {
  return FIGURE_REGISTRY[nodeId] ?? null;
}

export function inferredInteractiveFigure(node: GraphNode): FigureComponent | null {
  return tagMatch(node);
}

export function interactiveFigureForNode(node: GraphNode): FigureComponent | null {
  return exactInteractiveFigure(node.id) ?? inferredInteractiveFigure(node);
}

export function hasInteractiveFigure(nodeOrId: GraphNode | string): boolean {
  if (typeof nodeOrId === "string") return nodeOrId in FIGURE_REGISTRY;
  return interactiveFigureForNode(nodeOrId) !== null;
}
