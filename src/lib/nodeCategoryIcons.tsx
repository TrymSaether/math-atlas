/**
 * Category → Phosphor icon mapping. Kept separate from ./nodeCategory so that the
 * (React-free) category data can be reused by Node tooling; this is the view half
 * that pulls in the icon components.
 */
import {
  CircleIcon,
  DiamondIcon,
  CompassToolIcon,
  CubeIcon,
  PencilLineIcon,
  ProhibitIcon,
  ScrollIcon,
  FlaskIcon,
  TagIcon,
  type Icon,
} from "@phosphor-icons/react";
import { categoryOf, type NodeCategory } from "./nodeCategory";

export const CATEGORY_ICON: Record<NodeCategory, Icon> = {
  definition: CircleIcon,
  structure: CubeIcon,
  theorem: DiamondIcon,
  property: TagIcon,
  construction: CompassToolIcon,
  example: FlaskIcon,
  proof: ScrollIcon,
  exercise: PencilLineIcon,
};

/**
 * Per-kind glyph overrides — used when the precise kind reads as something
 * distinct from (or opposite to) its category. Counterexamples and non-examples
 * collapse into the `example` category, but they carry the opposite signal
 * ("where the property fails"), so they get a prohibition glyph instead of the
 * example flask.
 */
export const KIND_ICON_OVERRIDE: Record<string, Icon> = {
  counterexample: ProhibitIcon,
  non_example: ProhibitIcon,
};

/** Icon for a raw concept kind: a per-kind override if any, else its category icon. */
export function kindIcon(kind: string): Icon {
  return KIND_ICON_OVERRIDE[kind] ?? CATEGORY_ICON[categoryOf(kind)];
}
