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
  "equivalent_to",
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
    // A generalization link is lateral, not a strict prerequisite: the data uses
    // it both as abstraction-of-concrete and as superclass-of-subclass, so the
    // prerequisite ordering it would impose is ambiguous and contradicts the
    // definitional edges (e.g. `normed_vector_space generalizes banach_space`
    // vs `banach_space defined_in_terms_of normed_vector_space`). The real
    // learning order is carried by defined_in_terms_of / uses / constructed_from
    // / assumes, so generalizes stays out of the dependency DAG.
    isDependency: false,
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
  equivalent_to: {
    reads: "is equivalent to",
    inverse: "equivalent_to",
    symmetric: true,
    // A genuine equivalence (different presentations of the same concept, e.g.
    // the open-cover / sequential / FIP characterizations of compactness). It is
    // deliberately NOT a dependency: equivalent concepts have no prerequisite
    // ordering between them, and routing it out of the DAG is what lets authors
    // record a legitimate mutual relationship WITHOUT it surfacing as a circular
    // definition. Consumers collapse an equivalence class into one ordering unit
    // (see equivalenceClasses / topoSortWithCycles in lib/graph).
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
  "equivalent_to",
  "related_to",
  "satisfies",
  "violates",
  "proves",
] as const satisfies readonly RelationType[];

export type AuthorableRelation = (typeof AUTHORABLE_RELATIONS)[number];

/**
 * Terse verb form of each relation, in the *forward* reading direction (how
 * `source → target` reads). Kept alongside the prose `reads` so the edge-label
 * control can offer a compact alternative without re-deriving grammar.
 */
export const RELATION_TERSE: Record<RelationType, string> = {
  defined_in_terms_of: "defined from",
  defines: "defines",
  uses: "uses",
  used_by: "used by",
  assumes: "assumes",
  assumed_by: "underlies",
  constructed_from: "built from",
  constructs: "builds",
  generalizes: "generalizes",
  specializes: "special case",
  motivated_by: "motivated by",
  motivates: "motivates",
  equivalent_to: "equivalent",
  related_to: "related",
  satisfies: "satisfies",
  satisfied_by: "satisfied by",
  violates: "violates",
  violated_by: "violated by",
  proves: "proves",
  proved_by: "proved by",
};

function isRelationType(relation: string): relation is RelationType {
  return relation in RELATIONS;
}

/** True when the relation is its own inverse (related_to, equivalent_to). */
export function isSymmetricRelation(relation: string): boolean {
  return isRelationType(relation) && RELATIONS[relation].symmetric;
}

/**
 * Relations that assert two concepts are the same thing under different
 * presentations (only `equivalent_to` today). Consumers collapse the connected
 * components of these edges into a single ordering unit. Distinct from the
 * `symmetric` flag, which `related_to` also carries without implying sameness.
 */
export const EQUIVALENCE_RELATIONS = new Set<RelationType>(["equivalent_to"]);

export function isEquivalenceRelation(relation: string): boolean {
  return isRelationType(relation) && EQUIVALENCE_RELATIONS.has(relation as RelationType);
}

/**
 * The relation key whose forward prose reads *along the drawn arrow*. Dependency
 * edges are stored prerequisite → dependent (the reverse of how they were
 * authored), so their label must use the inverse relation; everything else reads
 * source → target as-authored.
 */
export function orientedRelation(relation: string, isDependency: boolean): RelationType | null {
  if (!isRelationType(relation)) return null;
  return isDependency ? RELATIONS[relation].inverse : relation;
}

/**
 * Human label for an edge, read in the direction of the arrow. `prose` uses the
 * relations table's `reads` phrase ("is used to define"); `terse` uses the short
 * verb form ("defines"). Falls back to the raw key for unknown relations.
 */
export function edgeLabel(relation: string, isDependency: boolean, style: "prose" | "terse"): string {
  const oriented = orientedRelation(relation, isDependency);
  if (!oriented) return relation;
  return style === "terse" ? RELATION_TERSE[oriented] : RELATIONS[oriented].reads;
}

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
