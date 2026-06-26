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

/* ========================================================================
   Edge "skins" — five interchangeable visual languages for relations, each
   selectable from the canvas controls. None reuse the blueprint marker grammar
   above; all but `typed` keep hue reserved for domains (color encodes nothing,
   the morphology does). See TopoEdge for the per-skin SVG rendering.
   ======================================================================== */

/** Five relation families, the encoding axis shared by every skin. */
export type EdgeKind = "backbone" | "generalization" | "equivalence" | "association" | "soft";

/**
 * Coarser than `familyOf`: splits the symmetric relations (equivalent_to,
 * related_to) into their own kinds so every skin can give them a distinct,
 * head-less treatment (double rule / contour / dashed pair).
 */
export function edgeKindOf(edge: { relation: string; isDependency: boolean }): EdgeKind {
  if (edge.relation === "generalizes" || edge.relation === "specializes") return "generalization";
  if (edge.relation === "equivalent_to") return "equivalence";
  if (edge.relation === "related_to") return "association";
  return edge.isDependency ? "backbone" : "soft";
}

export interface EdgeVisual {
  kind: EdgeKind;
  symmetric: boolean;
  /** Stroke color: neutral ink for every skin except `typed` (relation hue). */
  color: string;
  width: number;
  opacity: number;
  dash?: string;
}

/** Per-kind ink weights for the monochrome skins (flow / ink / notation / glass). */
const INK_BASE: Record<EdgeKind, { width: number; opacity: number; dash?: string }> = {
  backbone: { width: 1.8, opacity: 0.66 },
  generalization: { width: 1.7, opacity: 0.64 },
  equivalence: { width: 1.5, opacity: 0.66 },
  association: { width: 1.4, opacity: 0.46, dash: "5 5" },
  soft: { width: 1.3, opacity: 0.38, dash: "1.5 5" },
};

/**
 * The `typed` skin recolors the imported design system's typed connections with
 * math-atlas palette tokens (color is deliberate here — this is the one skin
 * that opts out of the hue-reserved-for-domains rule). Soft links split by their
 * semantic charge: counterexamples red, proofs purple, satisfies teal, etc.
 */
function typedColor(edge: { relation: string }, kind: EdgeKind): string {
  // Blue is reserved for the active-edge accent and amber for the route trail,
  // so the typed palette steers clear of both to stay unambiguous.
  switch (kind) {
    case "backbone":
      return "var(--teal)";
    case "generalization":
      return "var(--green)";
    case "equivalence":
      return "var(--violet)";
    case "association":
      return "var(--slate)";
    case "soft":
      if (edge.relation === "violates" || edge.relation === "violated_by") return "var(--red)";
      if (edge.relation === "proves" || edge.relation === "proved_by") return "var(--purple)";
      if (edge.relation === "satisfies" || edge.relation === "satisfied_by") return "var(--cyan)";
      if (edge.relation === "motivated_by" || edge.relation === "motivates") return "var(--pink)";
      return "var(--rose)";
  }
}

const TYPED_DASH: Record<EdgeKind, string | undefined> = {
  backbone: undefined,
  generalization: undefined,
  equivalence: "8 4 2 4",
  association: "2 4",
  soft: "2 4",
};

export type EdgeSkin = "flow" | "ink" | "notation" | "glass" | "typed";

/**
 * Resolve the base stroke parameters for a skin. The structural rendering
 * (gradients, grooves, tapers, double rules, markers) lives in TopoEdge; this
 * supplies the shared color / weight / dash and the highlight + dim overrides.
 */
export function getEdgeVisual(
  skin: EdgeSkin,
  edge: { relation: string; isDependency: boolean },
  highlighted = false,
  dimmed = false,
): EdgeVisual {
  const kind = edgeKindOf(edge);
  const symmetric = isSymmetricRelation(edge.relation);

  if (skin === "typed") {
    return {
      kind,
      symmetric,
      color: highlighted ? "var(--edge-highlight)" : typedColor(edge, kind),
      width: highlighted ? 3 : 2,
      opacity: dimmed ? 0.08 : highlighted ? 1 : kind === "soft" ? 0.85 : 0.92,
      dash: highlighted ? undefined : TYPED_DASH[kind],
    };
  }

  const base = INK_BASE[kind];
  // Notation keeps every line a quiet hairline so the operator chip is the star;
  // soft still hints with a dotted stroke.
  const width = skin === "notation" ? (kind === "soft" ? 0.75 : 0.9) : base.width;
  const opacity = skin === "notation" ? (kind === "soft" ? 0.32 : 0.42) : base.opacity;
  return {
    kind,
    symmetric,
    color: highlighted ? "var(--edge-highlight)" : "var(--edge-ink)",
    width: highlighted ? Math.max(width + 1.4, 2.8) : width,
    opacity: dimmed ? 0.06 : highlighted ? 0.95 : opacity,
    dash: highlighted ? undefined : skin === "notation" && kind !== "soft" ? undefined : base.dash,
  };
}
