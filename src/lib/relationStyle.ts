import { RELATION_LABEL } from "../types";

export type RelationStyle = {
  color: string;
  opacity: number;
  width: number;
  dash?: string;
  label: string;
};

const RELATION_GROUPS = [
  { match: ["define", "defined", "notation"], color: "var(--blue)", width: 2.2, opacity: 0.58 },
  { match: ["proof", "prove", "logical", "implies", "requires", "uses", "assumes"], color: "var(--purple)", width: 2.1, opacity: 0.52 },
  { match: ["example", "counterexample", "instance"], color: "var(--gold)", width: 1.9, opacity: 0.46, dash: "4 7" },
  { match: ["violates", "necessity"], color: "var(--red)", width: 2.0, opacity: 0.48, dash: "8 6" },
  { match: ["general", "special", "subtype", "inherits", "equivalent"], color: "var(--green)", width: 2.0, opacity: 0.52 },
  { match: ["construct", "induce", "property"], color: "var(--teal)", width: 2.0, opacity: 0.5 },
  { match: ["motivate", "pedagogical", "historical", "prerequisite"], color: "var(--orange)", width: 1.9, opacity: 0.42, dash: "2 6" },
];

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRelationStyle(relation: string, highlighted = false, dimmed = false): RelationStyle {
  const normalized = relation.toLowerCase();
  const group = RELATION_GROUPS.find((entry) => entry.match.some((part) => normalized.includes(part)));
  const style = group ?? { color: "var(--fg-4)", width: 1.7, opacity: 0.38 };

  return {
    color: style.color,
    opacity: dimmed ? 0.08 : highlighted ? 0.95 : style.opacity,
    width: highlighted ? Math.max(style.width + 1.4, 3.6) : style.width,
    dash: "dash" in style ? style.dash : undefined,
    label: RELATION_LABEL[relation] ?? humanize(relation),
  };
}
