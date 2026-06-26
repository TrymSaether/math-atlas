import { Suspense, createElement, useEffect, useRef, useState } from "react";

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

  // Mafs reads its size from the container; if it renders before the frame has a
  // measured width (e.g. while a card slides in, or in a not-yet-shown surface)
  // it computes NaN dimensions and floods the console. Hold the figure until the
  // frame actually has width, then mount it once laid out.
  const frameRef = useRef<HTMLDivElement>(null);
  const [hasWidth, setHasWidth] = useState(false);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const check = () => setHasWidth(el.clientWidth > 0);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || !ExactFigure || !diagramPath) return;
    console.warn(
      `[math-atlas] Node "${node.id}" defines both an exact interactive figure and a diagram; the interactive figure is rendered first.`,
    );
  }, [ExactFigure, diagramPath, node.id]);

  if (InteractiveFigure) {
    return (
      <div
        ref={frameRef}
        className={cn("themed-diagram", frameClassName)}
        style={{ borderColor: DIA.border, background: DIA.surface }}
      >
        <Suspense
          fallback={
            <div className="py-8 text-center text-caption-1" style={{ color: UI.muted }}>
              Loading figure...
            </div>
          }
        >
          {hasWidth ? (
            createElement(InteractiveFigure, { nodeId: node.id })
          ) : (
            <div className="py-8 text-center text-caption-1" style={{ color: UI.muted }}>
              Loading figure...
            </div>
          )}
        </Suspense>
      </div>
    );
  }

  if (diagramPath) {
    return <ThemedDiagram src={diagramPath} alt={`Diagram for ${node.label}`} className={frameClassName} />;
  }

  return null;
}
