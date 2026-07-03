/**
 * Category → icon mapping. Kept separate from ./nodeCategory so that the
 * (React-free) category data can be reused by node tooling; this is the view half
 * that pulls in the icon components. Uses lucide-react (the app's icon library).
 */
import {
  Ban,
  Box,
  Circle,
  Diamond,
  DraftingCompass,
  FlaskConical,
  PencilLine,
  Scroll,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { categoryOf, type NodeCategory } from "@/maps/nodeCategory";

export const CATEGORY_ICON: Record<NodeCategory, LucideIcon> = {
  definition: Circle,
  structure: Box,
  theorem: Diamond,
  property: Tag,
  construction: DraftingCompass,
  example: FlaskConical,
  proof: Scroll,
  exercise: PencilLine,
};

/**
 * Per-kind glyph overrides — used when the precise kind reads as something
 * distinct from (or opposite to) its category. Counterexamples and non-examples
 * collapse into the `example` category, but they carry the opposite signal
 * ("where the property fails"), so they get a prohibition glyph instead of the
 * example flask.
 */
export const KIND_ICON_OVERRIDE: Record<string, LucideIcon> = {
  counterexample: Ban,
  non_example: Ban,
};

/** Icon for a raw concept kind: a per-kind override if any, else its category icon. */
export function kindIcon(kind: string): LucideIcon {
  return KIND_ICON_OVERRIDE[kind] ?? CATEGORY_ICON[categoryOf(kind)];
}
