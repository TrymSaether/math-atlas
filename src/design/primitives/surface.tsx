import { forwardRef, useCallback, type HTMLAttributes, type PointerEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/cn";
import "./surface.css";

/**
 * Surface — the single liquid-glass primitive.
 *
 * Compose every floating chrome surface from this (toolbars, panels, palette,
 * sheets). `material` picks the optical density, `elevation` picks the spatial
 * layer, and `reactive` makes the specular highlight track the pointer. Graph
 * nodes use `material="chrome"`.
 *
 * @example
 * <Surface material="regular" reactive className="p-4">…</Surface>
 */
const surfaceVariants = cva("surface", {
  variants: {
    material: {
      ultrathin: "surface--ultrathin",
      thin: "surface--thin",
      regular: "surface--regular",
      thick: "surface--thick",
      chrome: "surface--chrome",
    },
    specular: {
      true: "",
      false: "surface--plain",
    },
    elevation: {
      base: "surface--elevation-base",
      raised: "surface--elevation-raised",
      overlay: "surface--elevation-overlay",
    },
  },
  defaultVariants: {
    material: "regular",
    specular: true,
    elevation: "base",
  },
});

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof surfaceVariants> {
  /** Track the pointer so the specular highlight follows it. */
  reactive?: boolean;
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { className, material, specular, elevation, reactive = false, onPointerMove, ...props },
  ref,
) {
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--surface-mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty("--surface-my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      onPointerMove?.(event);
    },
    [onPointerMove],
  );

  return (
    <div
      ref={ref}
      className={cn(surfaceVariants({ material, specular, elevation }), className)}
      onPointerMove={reactive ? handlePointerMove : onPointerMove}
      {...props}
    />
  );
});
