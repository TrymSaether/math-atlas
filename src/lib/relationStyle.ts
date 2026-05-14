import { RELATION_LABEL } from "../types";
import { palette } from "./colors";

export type RelationStyle = {
  color: string;
  opacity: number;
  width: number;
  dash?: string;
  label: string;
  underlayColor: string;
  underlayOpacity: number;
};

const relationGroups = [
  { match: ["define", "defined", "notation"], color: palette.blue, width: 2.4, opacity: 0.7 },
  { match: ["proof", "prove", "logical", "implies", "requires", "uses"], color: palette.violet, width: 2.3, opacity: 0.64 },
  { match: ["example", "counterexample", "instance"], color: palette.gold, width: 2.1, opacity: 0.58, dash: "5 8" },
  { match: ["assume", "violates", "necessity"], color: palette.red, width: 2.2, opacity: 0.58, dash: "9 7" },
  { match: ["general", "special", "subtype", "inherits", "equivalent"], color: palette.mint, width: 2.2, opacity: 0.66 },
  { match: ["construct", "induce", "property"], color: palette.teal, width: 2.2, opacity: 0.64 },
  { match: ["motivate", "pedagogical", "historical", "prerequisite"], color: palette.orange, width: 2.1, opacity: 0.56, dash: "3 7" },
];

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRelationStyle(
  relation: string,
  highlighted = false,
  dimmed = false,
  route = false,
): RelationStyle {
  const normalized = relation.toLowerCase();
  const group = relationGroups.find((entry) => entry.match.some((part) => normalized.includes(part)));
  const base: { color: string; width: number; opacity: number; dash?: string } = group ?? { color: palette.blue, width: 2, opacity: 0.52 };
  const color = route ? "var(--warning)" : base.color;

  return {
    color,
    opacity: dimmed ? 0.07 : route ? 0.98 : highlighted ? 0.95 : base.opacity,
    width: route ? 4.2 : highlighted ? Math.max(base.width + 1.2, 3.6) : base.width,
    dash: route ? undefined : base.dash,
    label: (RELATION_LABEL as Record<string, string>)[relation] ?? humanize(relation),
    underlayColor: route ? "rgba(var(--warning-rgb),0.18)" : "rgba(var(--primary-rgb),0.14)",
    underlayOpacity: route ? 1 : 0.8,
  };
}
