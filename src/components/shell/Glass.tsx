import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type GlassMaterial = "thin" | "regular" | "thick";

export interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  /** Material thickness — maps to the .glass-* classes in styles/glass.css. */
  material?: GlassMaterial;
}

const MATERIAL_CLASS: Record<GlassMaterial, string> = {
  thin: "glass-thin",
  regular: "glass-regular",
  thick: "glass-thick",
};

/**
 * The Liquid Glass material primitive. Every floating surface in the shell —
 * search field, control cluster, popovers, the concept card — is a `Glass`, so
 * the translucency, blur budget, opaque fallback, panning guard, and
 * reduced-transparency degradation all live in one place (styles/glass.css).
 *
 * Owns only the material; radius, padding, and layout are the caller's via
 * `className`.
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(function Glass(
  { material = "regular", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn(MATERIAL_CLASS[material], className)} {...rest} />;
});
