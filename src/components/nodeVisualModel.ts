import type { GraphNode } from "../types";
import { exactInteractiveFigure, inferredInteractiveFigure } from "./figures/registry";

export function hasNodeVisual(node: GraphNode): boolean {
  return Boolean(exactInteractiveFigure(node.id) || node.diagram?.trim() || inferredInteractiveFigure(node));
}
