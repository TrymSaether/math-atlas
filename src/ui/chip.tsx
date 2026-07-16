import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/cn";

const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-sm border border-border bg-card text-muted-foreground transition hover:border-input hover:text-foreground aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary",
  {
    variants: {
      size: {
        xs: "min-h-(--control-h-xs) px-2.5 py-[3px]",
        sm: "min-h-(--control-h-sm) px-2.5 py-0.5",
      },
      variant: {
        mono: "font-mono text-caption-2",
        label: "text-caption-1 font-medium",
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "label",
    },
  },
);

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {
  /** Sets `aria-pressed`, which drives the pressed-state colors above. */
  active?: boolean;
}

/**
 * Small toggleable filter/scope pill (sort mode, deck scope, card direction).
 * Not for facets needing a dynamic per-item color (e.g. domain swatches) —
 * those override the pressed state with inline styles instead.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, size, variant, active, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(chipVariants({ size, variant }), className)}
      {...props}
    />
  );
});
