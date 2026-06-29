import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type SegmentedSelectionRole = "radio" | "tab" | "button";
export type SegmentedControlSize = "mini" | "small" | "regular" | "large";

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

export interface ShellSegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (id: T) => void;
  className?: string;
  hideLabels?: boolean | "responsive";
  selectionRole?: SegmentedSelectionRole;
  size?: SegmentedControlSize;
  equalWidth?: boolean;
  disabled?: boolean;
}

/**
 * macOS-style segmented control behavior. Radio and tab variants use automatic
 * activation while arrowing; action groups preserve separate focus and
 * activation. Disabled segments are skipped by the roving tab stop.
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
}: ShellSegmentedProps<T>) {
  const selectedIndex = options.findIndex((option) => option.id === value && !option.disabled);
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || options.length === 0 || firstEnabledIndex < 0) return;

    const currentIndex = optionRefs.current.findIndex((element) => element === document.activeElement);
    const fromIndex = currentIndex >= 0 ? currentIndex : tabStopIndex;
    let nextIndex: number;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = nextEnabledIndex(fromIndex, 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = nextEnabledIndex(fromIndex, -1);
    else if (event.key === "Home") nextIndex = firstEnabledIndex;
    else if (event.key === "End") nextIndex = lastEnabledIndex();
    else return;

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
    if (selectionRole !== "button" && options[nextIndex]?.id !== value) onChange(options[nextIndex].id);
  };

  const groupRole = selectionRole === "tab" ? "tablist" : selectionRole === "radio" ? "radiogroup" : "group";
  const selectedVisualIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  // Liquid stretch: when the selection slides between segments, scale it from
  // the trailing edge so the pill reaches toward the incoming segment, then
  // settles. Driven imperatively to avoid an extra render on every change.
  const groupRef = useRef<HTMLDivElement>(null);
  const previousIndexRef = useRef(selectedVisualIndex);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const group = groupRef.current;
    const previousIndex = previousIndexRef.current;
    if (group && selectedVisualIndex !== previousIndex) {
      const direction = selectedVisualIndex > previousIndex ? 1 : -1;
      group.style.setProperty("--shell-seg-origin", direction > 0 ? "left center" : "right center");
      group.classList.add("is-sliding");
      clearTimeout(slideTimer.current);
      slideTimer.current = setTimeout(() => group.classList.remove("is-sliding"), 260);
    }
    previousIndexRef.current = selectedVisualIndex;
  }, [selectedVisualIndex]);
  useEffect(() => () => clearTimeout(slideTimer.current), []);

  const segmentStyle = {
    "--shell-seg-count": Math.max(1, options.length),
    "--shell-seg-index": selectedVisualIndex,
  } as CSSProperties;

  return (
    <div
      ref={groupRef}
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
      style={segmentStyle}
    >
      {equalWidth && selectionRole !== "button" && <span className="shell-seg-selection" aria-hidden="true" />}
      {options.map((option, index) => {
        const active = option.id === value;
        const optionDisabled = disabled || Boolean(option.disabled);
        const role = selectionRole === "tab" ? "tab" : selectionRole === "radio" ? "radio" : undefined;

        return (
          <button
            key={option.id}
            ref={(element) => {
              optionRefs.current[index] = element;
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
