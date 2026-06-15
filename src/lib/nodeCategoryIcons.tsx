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

/** Icon for a raw concept kind, via its category. */
export function kindIcon(kind: string): Icon {
  return CATEGORY_ICON[categoryOf(kind)];
}
