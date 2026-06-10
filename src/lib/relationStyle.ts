import { isSymmetricRelation } from "../data/relations";
import type { GraphEdge } from "../types";

export interface RelationStyle {
  color: string;
  opacity: number;
  width: number;
  dash?: string;
  family: EdgeFamily;
  marker: EdgeMarker;
  /** Symmetric relations (related_to) are undirected — drawn head-less, both ends. */
  symmetric: boolean;
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
 * The "blueprint" marker grammar splits edges into three visual families. Direction
 * and *relation type* are encoded by the head SHAPE (not hue, which stays reserved
 * for domains), so the structure reads like an architectural schematic:
 *
 * - `dependency`     — the logical backbone: defined_in_terms_of / uses / assumes /
 *                      constructed_from. Solid ink, filled-triangle head.
 * - `generalization` — generalizes / specializes. Solid ink, open-triangle head
 *                      (the "is-a" relation reads as a hollow arrow, UML-style).
 * - `soft`           — the supplementary overlay: motivated_by / related_to /
 *                      satisfies / violates / proves. Dotted ink, open-circle head.
 */
export type EdgeFamily = "dependency" | "generalization" | "soft";
export type EdgeMarker = "triangle" | "open-triangle" | "circle";

/**
 * Hard vs soft is the artifact's own `isDependency` flag: the dependency
 * relations (defined_in_terms_of / uses / assumes / constructed_from /
 * generalizes) are the structural backbone; everything else (motivated_by,
 * related_to, satisfies, violates, proves) is a supplementary overlay.
 */
export function classifyEdge(edge: Pick<GraphEdge, "isDependency">): EdgeClass {
  return edge.isDependency ? "hard" : "soft";
}

/**
 * Render family. `generalizes`/`specializes` are still dependencies (they belong to
 * the backbone and the transitive reduction) but get their own head shape so the
 * "is-a-special-case-of" relation is legible at a glance.
 */
export function familyOf(edge: { relation: string; isDependency: boolean }): EdgeFamily {
  if (edge.relation === "generalizes" || edge.relation === "specializes") {
    return "generalization";
  }
  return edge.isDependency ? "dependency" : "soft";
}

// Neutral ink for every family — structure reads as one quiet schematic rather than
// a rainbow. The head shape carries the type; highlight switches to the accent.
const FAMILY_BASE: Record<EdgeFamily, Omit<RelationStyle, "family" | "symmetric">> = {
  dependency: { color: "var(--edge-ink)", opacity: 0.46, width: 1.4, marker: "triangle" },
  generalization: { color: "var(--edge-ink)", opacity: 0.46, width: 1.4, marker: "open-triangle" },
  soft: { color: "var(--edge-ink)", opacity: 0.3, width: 1.1, dash: "2 5", marker: "circle" },
};

export function getEdgeStyle(
  edge: { relation: string; isDependency: boolean },
  highlighted = false,
  dimmed = false,
): RelationStyle {
  const family = familyOf(edge);
  const base = FAMILY_BASE[family];
  return {
    color: highlighted ? "var(--edge-highlight)" : base.color,
    opacity: dimmed ? 0.06 : highlighted ? 0.95 : base.opacity,
    width: highlighted ? Math.max(base.width + 1.4, 2.8) : base.width,
    dash: highlighted ? undefined : base.dash,
    family,
    marker: base.marker,
    symmetric: isSymmetricRelation(edge.relation),
  };
}
