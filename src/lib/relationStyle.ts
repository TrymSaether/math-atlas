import type { Relation } from "../types";

export interface RelationStyle {
  color: string;
  dash?: string;
  label: string;
  opacity: number;
  width: number;
}

const RELATION_META: Record<string, Omit<RelationStyle, "opacity" | "width">> = {
  requires: { color: "var(--purple)", label: "Requires" },
  uses: { color: "var(--purple)", label: "Uses" },
  assumes: { color: "var(--purple)", label: "Assumes" },
  defined_by: { color: "var(--blue)", label: "Defined by" },
  defines: { color: "var(--blue)", label: "Defines" },
  proves: { color: "var(--green)", label: "Proves" },
  implies: { color: "var(--green)", label: "Implies" },
  equivalent_to: { color: "var(--teal)", label: "Equivalent" },
  generalizes: { color: "var(--orange)", label: "Generalizes" },
  specializes: { color: "var(--orange)", label: "Specializes" },
  has_example: { color: "var(--gold)", label: "Example", dash: "2 5" },
  has_counterexample: { color: "var(--red)", label: "Counterexample", dash: "5 4" },
  statement: { color: "var(--blue)", label: "Statement" },
  proof: { color: "var(--purple)", label: "Proof", dash: "5 4" },
  illustration: { color: "var(--gold)", label: "Illustration", dash: "2 5" },
};

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRelationStyle(
  relation: Relation,
  highlighted = false,
  dimmed = false,
): RelationStyle {
  const meta = RELATION_META[relation] ?? { color: "var(--fg-3)", label: titleCase(relation) };
  return {
    ...meta,
    opacity: dimmed ? 0.12 : highlighted ? 0.96 : 0.42,
    width: highlighted ? 2.8 : 1.35,
  };
}
