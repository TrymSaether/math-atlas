import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import { useGlassPointer } from "../../hooks/useGlassPointer";
import { cn } from "../../lib/utils";

export type GlassVariant = "regular" | "clear";

export interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  /** Liquid Glass variants exposed by Apple's Glass API. */
  variant?: GlassVariant;
  /** Enables the macOS 27 interactive press response. Use only on controls. */
  interactive?: boolean;
  /** Optional semantic tint; avoid tinting large navigation surfaces. */
  tint?: string;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

/** Liquid Glass for the functional layer: navigation and interactive chrome. */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(function Glass(
  { variant = "regular", interactive = false, tint, className, style, ...rest },
  ref,
) {
  const glassRef = useGlassPointer<HTMLDivElement>();
  const glassStyle = tint ? ({ "--glass-tint": tint, ...style } as CSSProperties) : style;
  return (
    <div
      ref={mergeRefs(glassRef, ref)}
      className={cn("liquid-glass", `liquid-glass-${variant}`, interactive && "is-interactive", className)}
      style={glassStyle}
      {...rest}
    />
  );
});

/** A group of related controls that shares one morphable glass container. */
export function GlassControlGroup({
  children,
  variant = "regular",
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: GlassVariant;
}) {
  return (
    <Glass variant={variant} interactive className={cn("shell-control-group", className)} {...rest}>
      {children}
    </Glass>
  );
}
