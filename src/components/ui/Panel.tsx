import type { ElementType, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Panel({
  as: Component = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Component className={cn("surface-panel", className)}>{children}</Component>;
}
