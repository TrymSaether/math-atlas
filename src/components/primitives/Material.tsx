import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type MaterialThickness = "thin" | "regular" | "thick";

export interface MaterialProps extends HTMLAttributes<HTMLDivElement> {
  thickness?: MaterialThickness;
}

/**
 * Standard material for content-layer panels and dialogs. Unlike Liquid Glass,
 * it has no lensing, pointer highlight, tint, or interactive press response.
 */
export const Material = forwardRef<HTMLDivElement, MaterialProps>(function Material(
  { thickness = "regular", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn("standard-material", `standard-material-${thickness}`, className)} {...rest} />;
});
