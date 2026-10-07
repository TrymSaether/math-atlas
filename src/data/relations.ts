/**
 * Relation registry — the single source of truth for edge semantics.
 *
 * Authors only ever write the FORWARD relation key on an edge. Direction is
 * fixed here, never authored per-edge; inverses and the dependency-DAG meaning
 * are declared once and applied at build time. This is what kills the class of
 * bugs where a per-edge `direction` disagrees with its `relation`.
 *
 * `reads`         — how `source → target` reads in prose.
 * `inverse`       — relation name for the reverse direction (for labelling
 *                   incoming edges at render time; reverse edges are NOT stored).
 * `symmetric`     — true when the relation is its own inverse (e.g. related_to).
 * `isDependency`  — true when the edge belongs to the logical dependency DAG,
 *                   i.e. `target` is a prerequisite of `source`.
 */
export interface RelationMeta {
  reads: string;
  inverse: RelationType;
  symmetric: boolean;
  isDependency: boolean;
}

// Order here is the canonical relation vocabulary. Keep it closed.
export const RELATION_KEYS = [
  "defined_in_terms_of",
  "uses",
  "assumes",
  "constructed_from",
  "generalizes",
  "specializes",
  "motivated_by",
  "motivates",
  "related_to",
  "satisfies",
  "satisfied_by",
  "violates",
  "violated_by",
  "proves",
  "proved_by",
  "defines",
  "used_by",
  "assumed_by",
  "constructs",
] as const;

export type RelationType = (typeof RELATION_KEYS)[number];

export const RELATIONS: Record<RelationType, RelationMeta> = {
  defined_in_terms_of: {
    reads: "is defined using",
    inverse: "defines",
    symmetric: false,
    isDependency: true,
  },
  defines: {
    reads: "is used to define",
    inverse: "defined_in_terms_of",
    symmetric: false,
    isDependency: false,
  },
  uses: {
    reads: "uses",
    inverse: "used_by",
    symmetric: false,
    isDependency: true,
  },
  used_by: {
    reads: "is used by",
    inverse: "uses",
    symmetric: false,
    isDependency: false,
  },
  assumes: {
    reads: "assumes",
    inverse: "assumed_by",
    symmetric: false,
    isDependency: true,
  },
  assumed_by: {
    reads: "is assumed by",
    inverse: "assumes",
    symmetric: false,
    isDependency: false,
  },
  constructed_from: {
    reads: "is constructed from",
    inverse: "constructs",
    symmetric: false,
    isDependency: true,
  },
  constructs: {
    reads: "constructs",
    inverse: "constructed_from",
    symmetric: false,
    isDependency: false,
  },
  generalizes: {
    reads: "generalizes",
    inverse: "specializes",
    symmetric: false,
    isDependency: true,
  },
  specializes: {
    reads: "is a special case of",
    inverse: "generalizes",
    symmetric: false,
    isDependency: false,
  },
  motivated_by: {
    reads: "is motivated by",
    inverse: "motivates",
    symmetric: false,
    isDependency: false,
  },
  motivates: {
    reads: "motivates",
    inverse: "motivated_by",
    symmetric: false,
    isDependency: false,
  },
  related_to: {
    reads: "is related to",
    inverse: "related_to",
    symmetric: true,
    isDependency: false,
  },
  satisfies: {
    reads: "satisfies",
    inverse: "satisfied_by",
    symmetric: false,
    isDependency: false,
  },
  satisfied_by: {
    reads: "is satisfied by",
    inverse: "satisfies",
    symmetric: false,
    isDependency: false,
  },
  violates: {
    reads: "violates",
    inverse: "violated_by",
    symmetric: false,
    isDependency: false,
  },
  violated_by: {
    reads: "is violated by",
    inverse: "violates",
    symmetric: false,
    isDependency: false,
  },
  proves: {
    reads: "proves",
    inverse: "proved_by",
    symmetric: false,
    isDependency: false,
  },
  proved_by: {
    reads: "is proved by",
    inverse: "proves",
    symmetric: false,
    isDependency: false,
  },
};

/**
 * Relations an author is allowed to write. The remaining keys exist only as
 * `inverse` targets and are never authored or stored on disk.
 */
export const AUTHORABLE_RELATIONS = [
  "defined_in_terms_of",
  "uses",
  "assumes",
  "constructed_from",
  "generalizes",
  "motivated_by",
  "related_to",
  "satisfies",
  "violates",
  "proves",
] as const satisfies readonly RelationType[];

export type AuthorableRelation = (typeof AUTHORABLE_RELATIONS)[number];

/**
 * Orient an authored edge into the artifact's `from → to` convention, where
 * `from` is the prerequisite and `to` is the dependent for dependency edges.
 * Non-dependency edges keep their authored source → target orientation.
 */
export function orientEdge(
  source: string,
  target: string,
  relation: AuthorableRelation,
): { from: string; to: string; isDependency: boolean } {
  const meta = RELATIONS[relation];
  if (meta.isDependency) {
    // "source defined_in_terms_of target" ⇒ target is the prerequisite.
    return { from: target, to: source, isDependency: true };
  }
  return { from: source, to: target, isDependency: false };
}
