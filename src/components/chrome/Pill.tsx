import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * A single floating glass pill, Apple-Maps style. Groups one or more related
 * controls. Lays out horizontally by default (top chrome); pass `orientation`
 * to stack vertically (right-rail dock).
 *
 * Shared between the top bar and the canvas dock so radius, padding, and the
 * glass treatment stay identical across all floating chrome. Callers add the
 * scope class (`top-tools` or `canvas-dock`) via `className` to pick up the
 * context-specific icon sizing defined in index.css.
 */
export function Pill({
  children,
  orientation = "horizontal",
  variant = "default",
  className,
}: {
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** `soft` uses a lighter drop shadow — better for clusters of small pills. */
  variant?: "default" | "soft";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center rounded-xl p-1",
        variant === "soft" ? "map-chrome-soft" : "map-chrome",
        orientation === "vertical" && "flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * An icon button sized for a glass Pill — a thin convenience wrapper over
 * {@link Button} that applies the dock's label / pressed conventions.
 */
export function DockButton({
  label,
  title,
  onClick,
  active,
  expanded,
  children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  active?: boolean;
  expanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      kind="icon"
      active={active}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      aria-expanded={expanded}
      title={title ?? label}
    >
      {children}
    </Button>
  );
}
