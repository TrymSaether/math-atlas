export type KindTier = "primary" | "secondary" | "compact";

const KIND_ABBREV: Record<string, string> = {
  definition: "D",
  theorem: "T",
  lemma: "L",
  proposition: "P",
  corollary: "C",
  example: "E",
  remark: "R",
  axiom: "A",
  construction: "C",
  property: "P",
  object: "O",
  structure: "S",
  notation: "N",
};

const PRIMARY_KINDS = new Set(["definition", "theorem", "axiom", "structure"]);
const COMPACT_KINDS = new Set(["example", "remark", "notation", "counterexample", "non_example"]);

export function getKindAbbrev(kind: string): string {
  return KIND_ABBREV[kind] ?? kind[0]?.toUpperCase() ?? "?";
}

export function getKindTier(kind: string): KindTier {
  if (PRIMARY_KINDS.has(kind)) return "primary";
  if (COMPACT_KINDS.has(kind)) return "compact";
  return "secondary";
}
