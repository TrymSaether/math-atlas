import { forwardRef, type HTMLAttributes, type MutableRefObject, type ReactNode, type Ref } from "react";
import { useGlassPointer } from "../../hooks/useGlassPointer";
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

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

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
  const glassRef = useGlassPointer<HTMLDivElement>();
  return <div ref={mergeRefs(glassRef, ref)} className={cn(MATERIAL_CLASS[material], className)} {...rest} />;
});

/**
 * A horizontal cluster of controls sharing a single glass island — the top-bar
 * control groups and the mode switch. Owns the island geometry (`.shell-control-group`)
 * over the glass material.
 */
export function GlassControlGroup({
  children,
  material = "regular",
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  material?: GlassMaterial;
}) {
  return (
    <Glass material={material} className={cn("shell-control-group", className)} {...rest}>
      {children}
    </Glass>
  );
}
