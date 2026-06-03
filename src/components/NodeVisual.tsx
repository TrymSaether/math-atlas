import { Suspense } from "react";

import type { GraphNode } from "../types";
import { cn } from "../lib/utils";
import { FIGURE_REGISTRY } from "./figures/registry";
import { ThemedDiagram } from "./ThemedDiagram";

export function hasNodeVisual(node: GraphNode): boolean {
  return Boolean(FIGURE_REGISTRY[node.id] || node.diagramPath.trim());
}

export function NodeVisual({
  node,
  className,
}: {
  node: GraphNode;
  className?: string;
}) {
  const InteractiveFigure = FIGURE_REGISTRY[node.id];
  const diagramPath = node.diagramPath.trim();
  const frameClassName = cn("block w-full rounded-[12px] border p-3", className);

  if (InteractiveFigure) {
    return (
      <div
        className={cn("themed-diagram", frameClassName)}
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <Suspense
          fallback={
            <div className="py-8 text-center text-ui-meta" style={{ color: "var(--fg-3)" }}>
              Loading figure...
            </div>
          }
        >
          <InteractiveFigure nodeId={node.id} />
        </Suspense>
      </div>
    );
  }

  if (diagramPath) {
    return <ThemedDiagram src={diagramPath} alt={`Diagram for ${node.title}`} className={frameClassName} />;
  }

  return null;
}
