import { useDeferredValue, useMemo } from "react";
import { useViewport } from "reactflow";

export type SemanticDetail = "dot" | "title" | "card";

const TITLE_THRESHOLD = 0.4;
const CARD_THRESHOLD = 0.9;

/**
 * Drives the level-of-detail of nodes/edges off the current ReactFlow zoom.
 *
 * <0.4   → "dot"   — tiny colored discs, no text
 * 0.4–0.9 → "title" — narrow pills with just the title
 * >0.9   → "card"  — full GraphNodeCard
 *
 * The returned value is deferred so a rapid zoom gesture doesn't trigger
 * a re-render for every intermediate frame.
 */
export function useSemanticDetail(): SemanticDetail {
  const { zoom } = useViewport();
  const deferred = useDeferredValue(zoom);
  return useMemo<SemanticDetail>(() => {
    if (deferred < TITLE_THRESHOLD) return "dot";
    if (deferred < CARD_THRESHOLD) return "title";
    return "card";
  }, [deferred]);
}
