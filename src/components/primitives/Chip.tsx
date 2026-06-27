import { type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "../../lib/utils";

export interface ShellChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  dotColor?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** Toggleable chip with an optional leading color dot; styling from `.shell-chip`. */
export function ShellChip({ active, dotColor, className, type = "button", children, ...rest }: ShellChipProps) {
  const ariaPressed = rest["aria-pressed"] ?? active;

  return (
    <button
      type={type}
      aria-pressed={ariaPressed}
      className={cn("shell-chip", active && "is-active", className)}
      {...rest}
    >
      {dotColor && <span className="shell-chip-dot" style={{ background: dotColor }} aria-hidden />}
      {children}
    </button>
  );
}
