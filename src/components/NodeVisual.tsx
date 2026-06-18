import { Suspense, createElement } from "react";

import type { GraphNode } from "../types";
import { cn } from "../lib/utils";
import { exactInteractiveFigure, inferredInteractiveFigure } from "./figures/registry";
import { DIA, UI } from "./figures/tokens";
import { ThemedDiagram } from "./ThemedDiagram";

export function hasNodeVisual(node: GraphNode): boolean {
  return Boolean(exactInteractiveFigure(node.id) || node.diagram?.trim() || inferredInteractiveFigure(node));
}

export function NodeVisual({ node, className }: { node: GraphNode; className?: string }) {
  const ExactFigure = exactInteractiveFigure(node.id);
  const diagramPath = node.diagram?.trim() ?? "";
  const InferredFigure = diagramPath ? null : inferredInteractiveFigure(node);
  const InteractiveFigure = ExactFigure ?? InferredFigure;
  const frameClassName = cn("node-visual-frame block w-full rounded-md border p-3", className);

  if (InteractiveFigure) {
    return (
      <div
        className={cn("themed-diagram", frameClassName)}
        style={{ borderColor: DIA.border, background: DIA.surface }}
      >
        <Suspense
          fallback={
            <div className="py-8 text-center text-ui-meta" style={{ color: UI.muted }}>
              Loading figure...
            </div>
          }
        >
          {createElement(InteractiveFigure, { nodeId: node.id })}
        </Suspense>
      </div>
    );
  }

  if (diagramPath) {
    return (
      <ThemedDiagram
        src={diagramPath}
        alt={`Diagram for ${node.label}`}
        className={frameClassName}
      />
    );
  }

  return null;
}
