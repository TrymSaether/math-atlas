import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/cn";

const chipVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 border font-medium outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        xs: "min-h-6 px-2 py-[3px] text-caption-2",
        sm: "min-h-[26px] px-2.5 py-0.5 text-caption-1",
        md: "min-h-8 px-3 py-1 text-footnote",
        lg: "min-h-[44px] px-3 text-caption-1 font-semibold",
      },
      shape: {
        compact: "rounded-sm",
        control: "rounded-[var(--radius-control)]",
        pill: "rounded-full",
      },
      active: {
        true: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
        false: "border-border bg-card text-muted-foreground hover:border-input hover:text-foreground",
      },
    },
    defaultVariants: {
      size: "sm",
      shape: "compact",
      active: false,
    },
  },
);

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {
  dotColor?: string;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, size, shape, active, dotColor, children, style, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={typeof active === "boolean" ? active : props["aria-pressed"]}
      className={cn(chipVariants({ size, shape, active }), className)}
      style={style}
      {...props}
    >
      {dotColor && <span className="size-1.5 shrink-0 rounded-full" style={{ background: dotColor }} />}
      {children}
    </button>
  );
});

const kbdVariants = cva(
  "ml-0.5 hidden h-5 items-center rounded border px-1.5 font-mono text-caption-2 sm:inline-flex",
  {
    variants: {
      onAccent: {
        true: "border-transparent bg-[color-mix(in_srgb,var(--card)_25%,transparent)] text-primary-foreground",
        false: "border-border bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      onAccent: false,
    },
  },
);

export interface KbdKeyProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof kbdVariants> {}

export function KbdKey({ className, onAccent, ...props }: KbdKeyProps) {
  return <kbd className={cn(kbdVariants({ onAccent }), className)} {...props} />;
}
