import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Surface, type SurfaceProps } from "./surface";
import "./panel.css";

export interface PanelProps extends SurfaceProps {
  /** Which shell dock the panel occupies. */
  dock?: "left";
}

/**
 * A docked glass panel — a positioned {@link Surface} for the shell's side
 * columns (concept card, paths, inspector). The left dock sits beside the
 * navigation sidebar and reflows to the window edge when it collapses. Defaults
 * to the `thick` material. Pass width/flex via `className`.
 */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { dock = "left", material = "thick", className, ...props },
  ref,
) {
  return (
    <Surface
      ref={ref}
      material={material}
      className={cn("ds-panel", dock === "left" && "ds-panel--left", className)}
      {...props}
    />
  );
});
