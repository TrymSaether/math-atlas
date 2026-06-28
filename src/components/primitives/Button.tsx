import { type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "../../lib/utils";

export interface ShellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  primary?: boolean;
  destructive?: boolean;
  shape?: "default" | "pill" | "circle";
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The control-layer button. Geometry, states, and theming live in the shared
 * `.shell-btn*` rules (styles/shell.css) on the one control-geometry scale; this
 * component owns only the variant-to-class mapping.
 */
export function ShellButton({
  active,
  primary,
  destructive,
  shape = "default",
  className,
  type = "button",
  ...rest
}: ShellButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "shell-btn",
        active && "is-active",
        primary && "shell-btn-primary",
        destructive && "shell-btn-destructive",
        shape === "pill" && "shell-btn-pill",
        shape === "circle" && "shell-btn-circle",
        className,
      )}
      {...rest}
    />
  );
}

/** Square-hit-area icon button — a `ShellButton` locked to the control height. */
export function ShellIconButton({ className, shape = "circle", ...rest }: ShellButtonProps) {
  return <ShellButton shape={shape} className={cn("shell-btn-icon", className)} {...rest} />;
}
