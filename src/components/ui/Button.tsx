import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";
type ButtonSize = "xs" | "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent-cyan/35 bg-accent-cyan/12 text-accent-cyan hover:bg-accent-cyan/18",
  secondary: "border-white/10 bg-white/[0.055] text-white/80 hover:bg-white/[0.085] hover:text-white",
  ghost: "border-transparent bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white/90",
  quiet: "border-white/10 bg-transparent text-white/55 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/85",
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
        "inline-flex shrink-0 items-center justify-center border font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent-cyan/35 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
