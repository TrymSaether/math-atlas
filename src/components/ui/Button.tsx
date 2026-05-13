import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";
type ButtonSize = "xs" | "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary: "border-[rgba(var(--primary-rgb),0.35)] bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.18)]",
  secondary: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
  ghost: "border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
  quiet: "border-[var(--border-soft)] bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-soft)]",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 gap-1 rounded-lg px-2 text-[11px]",
  sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
  md: "h-9 gap-2 rounded-xl px-3 text-sm",
};

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.28)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
