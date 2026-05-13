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
  { match: ["define", "defined"], color: palette.cyan, width: 1.25, opacity: 0.5 },
  { match: ["proof", "prove", "logical", "implies", "requires", "prerequisite"], color: palette.violet, width: 1.15, opacity: 0.42 },
  { match: ["example", "counterexample", "instance"], color: palette.gold, width: 0.95, opacity: 0.34, dash: "2 5" },
  { match: ["assume", "violates", "necessity"], color: palette.rose, width: 1.05, opacity: 0.38, dash: "6 4" },
  { match: ["general", "special", "subtype", "inherits"], color: palette.mint, width: 1.05, opacity: 0.4 },
  { match: ["motivate", "pedagogical", "historical"], color: palette.orange, width: 0.9, opacity: 0.28, dash: "1 5" },
];

export function getRelationStyle(relation: string, highlighted = false, dimmed = false): RelationStyle {
  const normalized = relation.toLowerCase();
  const group = relationGroups.find((entry) => entry.match.some((part) => normalized.includes(part)));
  const style: { color: string; width: number; opacity: number; dash?: string } = group ?? { color: palette.cyan, width: 0.95, opacity: 0.3 };

  return {
    color: style.color,
    opacity: dimmed ? 0.05 : highlighted ? 0.95 : style.opacity,
    width: highlighted ? Math.max(style.width + 1.2, 2.4) : style.width,
    dash: style.dash,
    label: RELATION_LABEL[relation],
  };
}
