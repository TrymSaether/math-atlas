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
  gibbs_phenomenon: lazy(() => import("./GibbsFigure")),
  dirichlet_kernel: lazy(() => import("./KernelFigure")),
  fejer_kernel: lazy(() => import("./KernelFigure")),
  poisson_kernel: lazy(() => import("./KernelFigure")),
};

export function hasInteractiveFigure(nodeId: string): boolean {
  return nodeId in FIGURE_REGISTRY;
}
