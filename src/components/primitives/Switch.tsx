import { type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

/** Labeled toggle switch (role="switch"); track/thumb styling from `.shell-switch`. */
export function ShellSwitch({
  label,
  on,
  onToggle,
  className,
  size = "mini",
  disabled = false,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  className?: string;
  size?: "mini" | "regular";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        onToggle();
      }}
      disabled={disabled}
      className={cn("shell-switch-btn", `shell-switch-btn-${size}`, className)}
    >
      <span className="shell-switch-label">{label}</span>
      <span className={cn("shell-switch", `shell-switch-${size}`, on && "is-on")} aria-hidden>
        <span className="shell-switch-thumb" />
      </span>
    </button>
  );
}
