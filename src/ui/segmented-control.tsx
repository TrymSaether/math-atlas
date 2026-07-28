import { useId, type ReactNode } from "react";

import { cn } from "@/ui/cn";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  title?: string;
  disabled?: boolean;
}

type AccessibleName = { label: string; ariaLabel?: never } | { label?: never; ariaLabel: string };

type SegmentedControlProps<T extends string> = AccessibleName & {
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  size?: "mini" | "small" | "regular" | "large";
  appearance?: "standard" | "toolbar" | "capsule";
  equalWidth?: boolean;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
};

const SIZE = {
  mini: "h-(--control-h-mini) px-1.5 text-caption-2",
  small: "h-(--control-h-sm) px-2 text-caption-1",
  regular: "h-(--control-h-md) px-2.5 text-footnote",
  large: "h-(--control-h-lg) px-3 text-subhead",
} as const;

const APPEARANCE = {
  standard: "rounded-[8px] border border-border/70 bg-secondary p-0.5 shadow-[inset_0_0.5px_rgb(0_0_0/0.08)]",
  toolbar: "rounded-[7px] border border-border/60 bg-background/55 p-0.5 shadow-[inset_0_0.5px_rgb(0_0_0/0.1)]",
  capsule: "rounded-full border border-border/60 bg-secondary p-0.5",
} as const;

/**
 * A single-choice, Apple-style segmented control.
 *
 * Segments have equal width, preserve one selected value, and inherit Radix's
 * radio semantics, roving focus, and arrow-key navigation.
 */
export function SegmentedControl<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  size = "regular",
  appearance = "standard",
  equalWidth = true,
  disabled = false,
  className,
  itemClassName,
}: SegmentedControlProps<T>) {
  const labelId = useId();

  return (
    <div className={cn("min-w-0", label && "space-y-1.5")}>
      {label && (
        <span id={labelId} className="block text-caption text-muted-foreground">
          {label}
        </span>
      )}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as T)}
        onKeyDown={(event) => {
          if (event.key.startsWith("Arrow")) event.stopPropagation();
        }}
        aria-label={label ? undefined : ariaLabel}
        aria-labelledby={label ? labelId : undefined}
        orientation="horizontal"
        spacing={1}
        className={cn(
          "isolate inline-grid w-fit items-stretch gap-px disabled:opacity-45",
          APPEARANCE[appearance],
          className,
        )}
        style={{ gridTemplateColumns: equalWidth ? `repeat(${options.length}, minmax(0, 1fr))` : undefined }}
        disabled={disabled}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel}
            title={option.title}
            disabled={option.disabled}
            onFocus={() => {
              if (option.value !== value) onChange(option.value);
            }}
            className={cn(
              "min-w-0 rounded-[5px] border border-transparent font-medium text-muted-foreground shadow-none transition-[background-color,border-color,color,box-shadow] duration-150",
              appearance === "capsule" && "rounded-full",
              "hover:bg-card/45 hover:text-foreground",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-muted",
              "data-[state=on]:border-border/70 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(255_255_255/0.18)_inset]",
              SIZE[size],
              itemClassName,
            )}
          >
            {option.icon}
            <span className="min-w-0 truncate">{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
