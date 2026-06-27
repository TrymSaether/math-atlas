import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Roving-focus segmented control (tablist or button group). Owns keyboard
 * navigation and ARIA wiring; geometry/theming come from `.shell-seg*`.
 */
export function ShellSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  hideLabels = false,
  selectionRole = "tab",
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string; icon?: ReactNode; ariaLabel?: string; title?: string }[];
  onChange: (id: T) => void;
  className?: string;
  hideLabels?: boolean | "responsive";
  selectionRole?: "tab" | "button";
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  const focusIndexRef = useRef(selectedIndex);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusOption = (index: number) => {
    focusIndexRef.current = index;
    optionRefs.current[index]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (options.length === 0) return;

    const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);

    const fromIndex = currentIndex >= 0 ? currentIndex : selectedIndex;

    let nextIndex: number;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (fromIndex + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (fromIndex - 1 + options.length) % options.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = options.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    focusOption(nextIndex);
  };

  return (
    <div
      className={cn("shell-seg", className)}
      role={selectionRole === "tab" ? "tablist" : "group"}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const active = option.id === value;

        return (
          <button
            key={option.id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role={selectionRole === "tab" ? "tab" : undefined}
            aria-selected={selectionRole === "tab" ? active : undefined}
            aria-pressed={selectionRole === "button" ? active : undefined}
            aria-label={hideLabels ? (option.ariaLabel ?? option.label) : option.ariaLabel}
            title={option.title ?? option.label}
            tabIndex={active ? 0 : -1}
            className={cn("shell-seg-opt", active && "is-active")}
            onClick={() => onChange(option.id)}
            onFocus={() => {
              focusIndexRef.current = index;
            }}
          >
            {option.icon}
            <span
              className={cn(
                hideLabels === true && "sr-only",
                hideLabels === "responsive" && "shell-seg-label-responsive",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
