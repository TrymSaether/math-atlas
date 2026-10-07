import {
  Box,
  Check,
  Circle,
  Diamond,
  FlaskConical,
  Layers,
  PencilLine,
  Tag,
  type LucideIcon,
} from "lucide-react";

/**
 * The raw data carries 20+ `kind` values with a long singleton tail. For visual
 * encoding we collapse them into seven canonical categories. The precise kind is
 * still kept on the node (badge + side panel); category only drives the glyph,
 * grouping, and the exercise filter.
 *
 * Color is reserved for *domains* — categories are distinguished by glyph/shape,
 * never hue.
 */
export type NodeCategory =
  | "definition"
  | "structure"
  | "theorem"
  | "property"
  | "example"
  | "construction"
  | "proof"
  | "exercise";

const KIND_TO_CATEGORY: Record<string, NodeCategory> = {
  // Definitions & primitives — "what things are".
  definition: "definition",
  object: "definition",
  notation: "definition",
  axiom: "definition",
  assumption: "definition",
  // Structures — the spaces and algebraic objects of study.
  structure: "structure",
  // Theorems — "what is true".
  theorem: "theorem",
  lemma: "theorem",
  proposition: "theorem",
  corollary: "theorem",
  conjecture: "theorem",
  // Properties — "attributes and characteristics".
  property: "property",
  // Instances — "what it looks like".
  example: "example",
  counterexample: "example",
  non_example: "example",
  // Constructions — "how to build".
  construction: "construction",
  application: "construction",
  // Proofs — "how to show".
  proof: "proof",
  proof_method: "proof",
  proof_step: "proof",
  // Practice.
  exercise: "exercise",
};

/**
 * Non-color encodings for category. Color stays reserved for domains, so kinds
 * are told apart by the *texture* of the lane rail and the weight of the glyph:
 *
 *  - rail "solid"  — assertions you build on (definition / result / construction)
 *  - rail "dashed" — instances & illustrations (example / counterexample)
 *  - rail "dotted" — process steps (proof) and practice (exercise)
 *  - glyphFilled   — results get a filled glyph chip; they are the load-bearing
 *                    nodes and should pop out of a field of definitions.
 */
export type RailTexture = "solid" | "dashed" | "dotted";

export interface CategoryMeta {
  id: NodeCategory;
  label: string;
  icon: LucideIcon;
  rail: RailTexture;
  glyphFilled: boolean;
}

export const CATEGORY_META: Record<NodeCategory, CategoryMeta> = {
  definition: {
    id: "definition",
    label: "Definition",
    icon: Circle,
    rail: "solid",
    glyphFilled: false,
  },
  structure: {
    id: "structure",
    label: "Structure",
    icon: Layers,
    rail: "solid",
    glyphFilled: false,
  },
  theorem: {
    id: "theorem",
    label: "Theorem",
    icon: Diamond,
    rail: "solid",
    glyphFilled: true,
  },
  property: {
    id: "property",
    label: "Property",
    icon: Tag,
    rail: "solid",
    glyphFilled: false,
  },
  construction: {
    id: "construction",
    label: "Construction",
    icon: Box,
    rail: "solid",
    glyphFilled: false,
  },
  example: {
    id: "example",
    label: "Example",
    icon: FlaskConical,
    rail: "dashed",
    glyphFilled: false,
  },
  proof: {
    id: "proof",
    label: "Proof",
    icon: Check,
    rail: "dotted",
    glyphFilled: false,
  },
  exercise: {
    id: "exercise",
    label: "Exercise",
    icon: PencilLine,
    rail: "dotted",
    glyphFilled: false,
  },
};

/** CSS `background` for the lane rail given its domain color and texture. */
export function railBackground(color: string, texture: RailTexture): string {
  switch (texture) {
    case "dashed":
      return `repeating-linear-gradient(to bottom, ${color} 0 7px, transparent 7px 12px)`;
    case "dotted":
      return `repeating-linear-gradient(to bottom, ${color} 0 2.5px, transparent 2.5px 6.5px)`;
    default:
      return color;
  }
}

export const CATEGORY_ORDER: NodeCategory[] = [
  "definition",
  "structure",
  "theorem",
  "property",
  "construction",
  "example",
  "proof",
  "exercise",
];

export function categoryOf(kind: string): NodeCategory {
  return KIND_TO_CATEGORY[kind] ?? "definition";
}

export function isExerciseKind(kind: string): boolean {
  return categoryOf(kind) === "exercise";
}

/** Categories shown on first load — the concept skeleton without proof detail or practice. */
export const DEFAULT_VISIBLE_CATEGORIES: NodeCategory[] = [
  "definition",
  "structure",
  "theorem",
  "property",
  "construction",
  "example",
];

/** Raw kinds present in the map, grouped by category in display order. */
export function kindsByCategory(
  kinds: string[],
): { category: NodeCategory; kinds: string[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    kinds: kinds.filter((k) => categoryOf(k) === category),
  })).filter((group) => group.kinds.length > 0);
}

/** The default visible kind set: every kind whose category is shown by default. */
export function defaultVisibleKinds(kinds: string[]): string[] {
  return kinds.filter((k) =>
    DEFAULT_VISIBLE_CATEGORIES.includes(categoryOf(k)),
  );
}
