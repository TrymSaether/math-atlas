import { type ComponentType, type LazyExoticComponent, lazy } from "react";

import type { GraphNode } from "@/maps/types";
import type { FigureProps } from "./core/types";

type FigureComponent = LazyExoticComponent<ComponentType<FigureProps>>;

/**
 * Node id → interactive figure component. Lazy-loaded so each figure is its own
 * chunk, fetched only when that node's panel opens (the graph never mounts them).
 *
 * To add a figure: put a `default`-exporting component in the matching domain
 * folder, then add an entry here. Concept views consult this map before falling
 * back to the static `ThemedDiagram`.
 */
export const FIGURE_REGISTRY: Record<string, FigureComponent> = {
  function: lazy(() => import("./core/FunctionSetFigure")),
  domain: lazy(() => import("./core/FunctionSetFigure")),
  codomain: lazy(() => import("./core/FunctionSetFigure")),
  image_of_function: lazy(() => import("./core/FunctionSetFigure")),
  preimage: lazy(() => import("./core/FunctionSetFigure")),
  inverse_of_function: lazy(() => import("./core/FunctionSetFigure")),
  restriction_of_function: lazy(() => import("./core/FunctionSetFigure")),

  injective: lazy(() => import("./core/MappingPropertyFigure")),
  surjective: lazy(() => import("./core/MappingPropertyFigure")),
  bijective: lazy(() => import("./core/MappingPropertyFigure")),

  parseval_identity: lazy(() => import("./fourier/ParsevalFigure")),
  plancherel_theorem: lazy(() => import("./fourier/ParsevalFigure")),
  riemann_lebesgue_lemma: lazy(() => import("./fourier/RiemannLebesgueFigure")),
  mean_square_convergence: lazy(() => import("./fourier/L2ConvergenceFigure")),
  convolution: lazy(() => import("./fourier/ConvolutionFigure")),
  convolution_theorem: lazy(() => import("./fourier/ConvolutionFigure")),
  circular_convolution: lazy(() => import("./fourier/ConvolutionFigure")),
  integer_frequency: lazy(() => import("./fourier/IntegerFrequencyFigure")),
  fourier_coefficient: lazy(() => import("./fourier/SpectrumFigure")),
  fourier_spectrum: lazy(() => import("./fourier/SpectrumFigure")),
  fourier_series: lazy(() => import("./fourier/SeriesFigure")),
  partial_sum: lazy(() => import("./fourier/SeriesFigure")),
  real_fourier_series: lazy(() => import("./fourier/SeriesFigure")),
  square_wave_builder: lazy(() => import("./fourier/SquareWaveBuilderFigure")),
  square_wave_fourier_builder: lazy(() => import("./fourier/SquareWaveBuilderFigure")),
  decay_smoothness: lazy(() => import("./fourier/SpectrumFigure")),
  gibbs_phenomenon: lazy(() => import("./fourier/GibbsFigure")),
  dirichlet_kernel: lazy(() => import("./fourier/KernelFigure")),
  fejer_kernel: lazy(() => import("./fourier/FejerExplorerFigure")),
  fejer_theorem: lazy(() => import("./fourier/FejerExplorerFigure")),
  good_kernel: lazy(() => import("./fourier/FejerExplorerFigure")),
  approximate_identity: lazy(() => import("./fourier/FejerExplorerFigure")),
  poisson_kernel: lazy(() => import("./fourier/KernelFigure")),
  gaussian_transform: lazy(() => import("./fourier/GaussianFigure")),
  uncertainty_principle: lazy(() => import("./fourier/GaussianFigure")),
  sampling_theorem: lazy(() => import("./fourier/SamplingFigure")),
  aliasing: lazy(() => import("./fourier/SamplingFigure")),
  heat_equation: lazy(() => import("./fourier/HeatFigure")),
  hahn_banach_theorem: lazy(() => import("./functional-analysis/HahnBanachFigure")),
  norm: lazy(() => import("./functional-analysis/NormUnitBallFigure")),
  normed_vector_space: lazy(() => import("./functional-analysis/NormUnitBallFigure")),
  closed_unit_ball: lazy(() => import("./functional-analysis/NormUnitBallFigure")),
  lp_norms_on_r2: lazy(() => import("./functional-analysis/NormUnitBallFigure")),
  equivalent_norms: lazy(() => import("./functional-analysis/NormUnitBallFigure")),
  linear_operator: lazy(() => import("./functional-analysis/FunctionalOperatorFigure")),
  bounded_linear_operator: lazy(() => import("./functional-analysis/FunctionalOperatorFigure")),
  continuous_linear_operator: lazy(() => import("./functional-analysis/FunctionalOperatorFigure")),
  operator_norm: lazy(() => import("./functional-analysis/FunctionalOperatorFigure")),
  compact_operator: lazy(() => import("./functional-analysis/FunctionalOperatorFigure")),
  weak_topology: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  weak_star_topology: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  weak_convergence: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  weak_star_convergence: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  weakly_bounded_set: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  unit_ball_weak_star_assumption: lazy(() => import("./functional-analysis/WeakConvergenceFigure")),
  projection_operator: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),
  projection_theorem: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),
  self_adjoint_operator: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),
  spectrum: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),
  spectral_theorem: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),
  compact_self_adjoint_operator_assumption: lazy(() => import("./functional-analysis/HilbertSpectralFigure")),

  // Cauchy sequences and convergence modes.
  cauchy_sequence: lazy(() => import("./functional-analysis/CauchySequenceFigure")),

  // Convergence modes: uniform vs pointwise vs mean-square.
  convergence: lazy(() => import("./functional-analysis/ConvergenceModesFigure")),
  pointwise_limit: lazy(() => import("./functional-analysis/ConvergenceModesFigure")),
  pointwise_limits_of_operators: lazy(() => import("./functional-analysis/ConvergenceModesFigure")),

  // Sequence spaces ℓᵖ / Lᵖ / c₀ and their nesting.
  ell_p_spaces: lazy(() => import("./functional-analysis/SequenceSpaceFigure")),
  l_p_spaces: lazy(() => import("./functional-analysis/SequenceSpaceFigure")),
  c_0: lazy(() => import("./functional-analysis/SequenceSpaceFigure")),
  c_k: lazy(() => import("./functional-analysis/SequenceSpaceFigure")),
  ell_2_as_hilbert_space: lazy(() => import("./functional-analysis/SequenceSpaceFigure")),

  // Inner-product geometry: angle, orthogonality, projection.
  inner_product_space: lazy(() => import("./functional-analysis/InnerProductFigure")),
  hilbert_space: lazy(() => import("./functional-analysis/InnerProductFigure")),

  // Uniform boundedness principle (Banach–Steinhaus).
  uniform_boundedness_principle: lazy(() => import("./functional-analysis/UniformBoundednessFigure")),
  pointwise_bounded_family_assumption: lazy(() => import("./functional-analysis/UniformBoundednessFigure")),
  bounded_operators_banach_space: lazy(() => import("./functional-analysis/UniformBoundednessFigure")),

  // --- Exercises & exam problems: reuse the figure that best illustrates them ---
  // Fourier-series waveforms (triangle / sawtooth / square + partial sums).
  exam2025_p1a: lazy(() => import("./fourier/SeriesFigure")),
  ss2_6_ex3: lazy(() => import("./fourier/SeriesFigure")),
  ss2_6_ex4: lazy(() => import("./fourier/SeriesFigure")),
  ss2_6_ex5: lazy(() => import("./fourier/SeriesFigure")),
  ss2_6_ex8: lazy(() => import("./fourier/SeriesFigure")),
  // Summability kernels (Dirichlet / Fejér).
  tma4170_2026_problem_3: lazy(() => import("./fourier/FejerExplorerFigure")),
  exam2025_p2: lazy(() => import("./fourier/FejerExplorerFigure")),
  ss2_6_ex15: lazy(() => import("./fourier/FejerExplorerFigure")),
  ss2_6_ex17b: lazy(() => import("./fourier/FejerExplorerFigure")),
  ss2_7_prob2: lazy(() => import("./fourier/KernelFigure")),
  // Coefficient decay ↔ smoothness, and transform pairs.
  ss2_6_ex10: lazy(() => import("./fourier/SpectrumFigure")),
  ss3_3_ex8: lazy(() => import("./fourier/SpectrumFigure")),
  ss3_3_ex15: lazy(() => import("./fourier/SpectrumFigure")),
  ss3_3_ex17: lazy(() => import("./fourier/SpectrumFigure")),
  ss5_5_ex2: lazy(() => import("./fourier/SpectrumFigure")),
  ss5_5_ex3a: lazy(() => import("./fourier/SpectrumFigure")),
  // Gaussian & the uncertainty principle.
  exam2025_p5: lazy(() => import("./fourier/GaussianFigure")),
  ss5_5_ex6: lazy(() => import("./fourier/GaussianFigure")),
  ss5_5_ex23: lazy(() => import("./fourier/GaussianFigure")),
  ss6_6_ex6: lazy(() => import("./fourier/GaussianFigure")),
  // Heat flow / approximate identity.
  exam2025_p6: lazy(() => import("./fourier/HeatFigure")),
  ss4_5_ex11: lazy(() => import("./fourier/HeatFigure")),
  ss5_6_prob1: lazy(() => import("./fourier/HeatFigure")),
  ss5_6_prob2: lazy(() => import("./fourier/HeatFigure")),
  ss6_6_ex7: lazy(() => import("./fourier/HeatFigure")),
  // Convolution.
  ss5_5_ex7: lazy(() => import("./fourier/ConvolutionFigure")),
  // Sampling / sinc / discrete reconstruction.
  exam2025_p3a: lazy(() => import("./fourier/SamplingFigure")),
  exam2025_p3b: lazy(() => import("./fourier/SamplingFigure")),
  ss7_3_ex1: lazy(() => import("./fourier/SamplingFigure")),
  ss7_3_ex3: lazy(() => import("./fourier/SamplingFigure")),
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
