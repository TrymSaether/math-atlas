import { cn } from "../../lib/utils";

/** Labeled toggle switch (role="switch"); track/thumb styling from `.shell-switch`. */
export function ShellSwitch({
  label,
  on,
  onToggle,
  className,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn("shell-switch-btn", className)}
    >
      <span className="font-medium">{label}</span>
      <span className={cn("shell-switch", on && "is-on")} aria-hidden />
    </button>
  );
}
