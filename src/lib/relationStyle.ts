import { RELATION_LABEL } from "../types";
import { palette } from "./colors";

export type RelationStyle = {
  color: string;
  opacity: number;
  width: number;
  dash?: string;
  label: string;
};

const relationGroups = [
  {
    match: ["define", "defined", "notation"],
    color: palette.blue,
    width: 2.2,
    opacity: 0.58,
  },
  {
    match: ["proof", "prove", "logical", "implies", "requires", "uses"],
    color: palette.violet,
    width: 2.1,
    opacity: 0.52,
  },
  {
    match: ["example", "counterexample", "instance"],
    color: palette.gold,
    width: 1.9,
    opacity: 0.46,
    dash: "4 7",
  },
  {
    match: ["assume", "violates", "necessity"],
    color: palette.red,
    width: 2.0,
    opacity: 0.48,
    dash: "8 6",
  },
  {
    match: ["general", "special", "subtype", "inherits", "equivalent"],
    color: palette.mint,
    width: 2.0,
    opacity: 0.52,
  },
  {
    match: ["construct", "induce", "property"],
    color: palette.teal,
    width: 2.0,
    opacity: 0.5,
  },
  {
    match: ["motivate", "pedagogical", "historical", "prerequisite"],
    color: palette.orange,
    width: 1.9,
    opacity: 0.42,
    dash: "2 6",
  },
];

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRelationStyle(
  relation: string,
  highlighted = false,
  dimmed = false,
): RelationStyle {
  const normalized = relation.toLowerCase();
  const group = relationGroups.find((entry) =>
    entry.match.some((part) => normalized.includes(part)),
  );
  const style: {
    color: string;
    width: number;
    opacity: number;
    dash?: string;
  } = group ?? { color: palette.blue, width: 1.8, opacity: 0.38 };

  return {
    color: style.color,
    opacity: dimmed ? 0.08 : highlighted ? 0.95 : style.opacity,
    width: highlighted ? Math.max(style.width + 1.4, 3.6) : style.width,
    dash: style.dash,
    label:
      (RELATION_LABEL as Record<string, string>)[relation] ??
      humanize(relation),
  };
}
