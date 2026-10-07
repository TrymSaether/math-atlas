import { RELATION_LABEL } from "../types";
import type { GraphEdge } from "../types";

export interface RelationStyle {
  color: string;
  opacity: number;
  width: number;
  dash?: string;
  label: string;
}

/**
 * Edge classes. Color is reserved for domains, so edges are near-monochrome and
 * distinguished by weight + dash instead of hue:
 *
 * - `hard` — definitional / logical / construction / assumption dependencies and
 *            the structural backbone. Solid hairline. This is the real hierarchy.
 * - `soft` — pedagogical "learn-this-first" orderings (≈half the edges) and loose
 *            illustrative links. Dashed and fainter; hidden by default.
 */
export type EdgeClass = "hard" | "soft";

/**
 * Hard vs soft is the artifact's own `isDependency` flag: the dependency
 * relations (defined_in_terms_of / uses / assumes / constructed_from /
 * generalizes) are the structural backbone; everything else (motivated_by,
 * related_to, satisfies, violates, proves) is a supplementary overlay.
 */
export function classifyEdge(edge: Pick<GraphEdge, "isDependency">): EdgeClass {
  return edge.isDependency ? "hard" : "soft";
}

// Neutral ink — the same hairline for every hard edge, so structure reads as one
// quiet web rather than a rainbow. Highlight switches to the accent.
const HARD: Omit<RelationStyle, "label"> = {
  color: "var(--edge-ink)",
  opacity: 0.34,
  width: 1.6,
};
const SOFT: Omit<RelationStyle, "label"> = {
  color: "var(--edge-ink)",
  opacity: 0.22,
  width: 1.3,
  dash: "2 6",
};

export function getEdgeStyle(
  edge: { relation: string; isDependency: boolean },
  highlighted = false,
  dimmed = false,
): RelationStyle {
  const base = classifyEdge(edge) === "soft" ? SOFT : HARD;
  return {
    color: highlighted ? "var(--edge-highlight)" : base.color,
    opacity: dimmed ? 0.06 : highlighted ? 0.95 : base.opacity,
    width: highlighted ? Math.max(base.width + 1.4, 2.8) : base.width,
    dash: highlighted ? undefined : base.dash,
    label: RELATION_LABEL[edge.relation],
  };
}
