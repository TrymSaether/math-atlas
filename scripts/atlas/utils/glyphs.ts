/**
 * Unicode glyph vocabulary. Mirrors the app's category encoding (see
 * src/maps/nodeCategory.ts) so a `theorem` reads the same in the terminal as on
 * the canvas — color is reserved for domains, shape distinguishes kinds.
 */
import { categoryOf, type NodeCategory } from "@/maps/nodeCategory";

export const CATEGORY_GLYPH: Record<NodeCategory, string> = {
  definition: "○",
  structure: "◆",
  theorem: "◈",
  property: "▣",
  construction: "⊕",
  example: "▷",
  proof: "✎",
  exercise: "✐",
};

export function kindGlyph(kind: string): string {
  return CATEGORY_GLYPH[categoryOf(kind)] ?? "·";
}

/** Severity markers, TS-compiler flavoured. */
export const MARK = {
  error: "✖",
  warning: "⚠",
  suggestion: "✸",
  ok: "✓",
  info: "›",
  bullet: "•",
  arrow: "→",
  arrowDep: "⟵",
};

/** Box-drawing pieces for trees and tables. */
export const BOX = {
  tee: "├─",
  last: "└─",
  pipe: "│ ",
  gap: "  ",
  h: "─",
  v: "│",
  tl: "╭",
  tr: "╮",
  bl: "╰",
  br: "╯",
  cross: "┼",
};
