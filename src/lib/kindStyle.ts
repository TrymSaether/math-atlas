import { KIND_LABEL } from "../types";

const KIND_COLOR: Record<string, string> = {
  definition: "var(--blue)",
  theorem: "var(--purple)",
  lemma: "var(--green)",
  proposition: "var(--pink)",
  corollary: "var(--orange)",
  example: "var(--gold)",
  counterexample: "var(--red)",
  non_example: "var(--red)",
  proof: "var(--orange)",
  proof_step: "var(--orange)",
  proof_method: "var(--orange)",
  axiom: "var(--blue)",
  assumption: "var(--pink)",
  structure: "var(--teal)",
  object: "var(--teal)",
  property: "var(--green)",
  construction: "var(--teal)",
  notation: "var(--gold)",
  conjecture: "var(--purple)",
  application: "var(--gold)",
};

const FALLBACK = [
  "var(--blue)",
  "var(--green)",
  "var(--purple)",
  "var(--orange)",
  "var(--teal)",
  "var(--pink)",
  "var(--gold)",
];

const KIND_ABBREV: Record<string, string> = {
  definition: "Def",
  theorem: "Thm",
  lemma: "Lem",
  proposition: "Prop",
  corollary: "Cor",
  example: "Ex",
  non_example: "N-Ex",
  counterexample: "C-Ex",
  proof: "Pf",
  proof_step: "Pf",
  proof_method: "Pf",
  axiom: "Ax",
  assumption: "Asm",
  structure: "Str",
  object: "Obj",
  property: "Prop",
  construction: "Con",
  notation: "Not",
  conjecture: "Conj",
  application: "App",
};

function hash(value: string): number {
  let h = 0;
  for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function getKindColor(kind: string): string {
  return KIND_COLOR[kind] ?? FALLBACK[hash(kind) % FALLBACK.length];
}

export function getKindAbbrev(kind: string): string {
  return KIND_ABBREV[kind] ?? (KIND_LABEL[kind] ?? kind).slice(0, 4);
}

export function getKindTier(kind: string): "primary" | "secondary" | "compact" {
  if (["definition", "theorem", "structure", "object", "axiom"].includes(kind)) return "primary";
  if (["lemma", "proposition", "corollary", "property", "construction", "proof"].includes(kind)) {
    return "secondary";
  }
  return "compact";
}
