import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type SegmentedSelectionRole = "radio" | "tab" | "button";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  content?: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  controls?: string;
}

/**
 * Roving-focus segmented control (radio, tab, or pressed-button group). Owns
 * keyboard navigation and ARIA wiring; geometry/theming come from `.shell-seg*`.
 */
export function ShellSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  hideLabels = false,
  selectionRole = "radio",
  size = "regular",
  equalWidth = true,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (id: T) => void;
  className?: string;
  hideLabels?: boolean | "responsive";
  selectionRole?: SegmentedSelectionRole;
  size?: "compact" | "mini" | "small" | "regular" | "large";
  equalWidth?: boolean;
  disabled?: boolean;
}) {
  const selectedIndex = options.findIndex((option) => option.id === value && !option.disabled);
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const nextEnabledIndex = (fromIndex: number, direction: 1 | -1) => {
    for (let offset = 1; offset <= options.length; offset += 1) {
      const index = (fromIndex + direction * offset + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return fromIndex;
  };

  const lastEnabledIndex = () => {
    for (let index = options.length - 1; index >= 0; index -= 1) {
      if (!options[index]?.disabled) return index;
    }
    return -1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0 || firstEnabledIndex < 0) return;

    const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);

    const fromIndex = currentIndex >= 0 ? currentIndex : tabStopIndex;

    let nextIndex: number;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = nextEnabledIndex(fromIndex, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = nextEnabledIndex(fromIndex, -1);
    } else if (e.key === "Home") {
      nextIndex = firstEnabledIndex;
    } else if (e.key === "End") {
      nextIndex = lastEnabledIndex();
    } else {
      return;
    }

    e.preventDefault();
    focusOption(nextIndex);

    // Radio groups and tabs use automatic activation, matching the direct,
    // one-step keyboard interaction of NSSegmentedControl. Button groups keep
    // focus and activation separate so Space/Enter can trigger the button.
    if (selectionRole !== "button" && options[nextIndex]?.id !== value) {
      onChange(options[nextIndex].id);
    }
  };

  const groupRole = selectionRole === "tab" ? "tablist" : selectionRole === "radio" ? "radiogroup" : "group";

  return (
    <div
      className={cn(
        "shell-seg",
        `shell-seg-${size}`,
        equalWidth && "shell-seg-equal",
        disabled && "is-disabled",
        className,
      )}
      role={groupRole}
      aria-label={label}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const active = option.id === value;
        const optionDisabled = disabled || Boolean(option.disabled);
        const role = selectionRole === "tab" ? "tab" : selectionRole === "radio" ? "radio" : undefined;

        return (
          <button
            key={option.id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role={role}
            aria-selected={selectionRole === "tab" ? active : undefined}
            aria-checked={selectionRole === "radio" ? active : undefined}
            aria-pressed={selectionRole === "button" ? active : undefined}
            aria-label={hideLabels ? (option.ariaLabel ?? option.label) : option.ariaLabel}
            aria-controls={selectionRole === "tab" ? option.controls : undefined}
            title={option.title ?? (option.icon || hideLabels ? option.label : undefined)}
            disabled={optionDisabled}
            tabIndex={!optionDisabled && index === tabStopIndex ? 0 : -1}
            className={cn("shell-seg-opt", active && "is-active")}
            onClick={() => {
              if (!optionDisabled && option.id !== value) onChange(option.id);
            }}
          >
            {option.icon && (
              <span className="shell-seg-icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span
              className={cn(
                hideLabels === true && "sr-only",
                hideLabels === "responsive" && "shell-seg-label-responsive",
              )}
            >
              {option.content ?? option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
