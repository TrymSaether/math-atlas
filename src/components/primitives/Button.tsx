import { type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "../../lib/utils";

export interface ShellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** @deprecated Use `variant="prominent"`. */
  primary?: boolean;
  destructive?: boolean;
  variant?: "plain" | "bordered" | "prominent" | "glass";
  controlSize?: "mini" | "small" | "regular" | "large";
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
  variant = "bordered",
  controlSize = "regular",
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
        `shell-btn-${primary ? "prominent" : variant}`,
        `shell-btn-${controlSize}`,
        active && "is-active",
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
export function ShellIconButton({ className, shape = "circle", controlSize = "large", ...rest }: ShellButtonProps) {
  return (
    <ShellButton
      variant="plain"
      shape={shape}
      controlSize={controlSize}
      className={cn("shell-btn-icon", className)}
      {...rest}
    />
  );
}
