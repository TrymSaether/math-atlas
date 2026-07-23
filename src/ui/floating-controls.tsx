import type { ComponentProps, ReactNode } from "react";
import { Surface } from "@/design";
import { Button } from "./button";
import { cn } from "./cn";

/**
 * Shared chrome for controls that float directly over a canvas.
 * Keeps atlas and sandbox controls on the same size, spacing, and interaction
 * contract instead of reassembling slightly different glass pills.
 */
export function FloatingControlDock({
  className,
  children,
  ...props
}: ComponentProps<typeof Surface> & { children: ReactNode }) {
  return (
    <Surface
      material="regular"
      className={cn("flex w-12 flex-col items-center gap-0.5 rounded-[24px] p-1", className)}
      {...props}
    >
      {children}
    </Surface>
  );
}

export function FloatingControlButton({
  className,
  active = false,
  ...props
}: ComponentProps<typeof Button> & { active?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-10 rounded-full text-foreground transition-[background-color,color,transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "hover:bg-accent/80 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring/55",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        active && "bg-primary/12 text-primary hover:bg-primary/16",
        className,
      )}
      {...props}
    />
  );
}

export function FloatingControlDivider() {
  return <span aria-hidden className="my-0.5 h-px w-6 bg-border/80" />;
}
