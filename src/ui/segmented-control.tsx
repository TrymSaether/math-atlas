import { useId, type ReactNode } from "react";

import { cn } from "@/ui/cn";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  title?: string;
}

type AccessibleName = { label: string; ariaLabel?: never } | { label?: never; ariaLabel: string };

type SegmentedControlProps<T extends string> = AccessibleName & {
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  size?: "small" | "regular" | "large";
  className?: string;
  itemClassName?: string;
};

const SIZE = {
  small: "h-8 px-2.5 text-caption-1",
  regular: "h-9 px-3 text-footnote",
  large: "h-11 px-3 text-footnote",
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
          "isolate inline-grid w-fit items-stretch gap-px rounded-[10px] border border-border/70 bg-muted/85 p-[3px] shadow-[inset_0_0.5px_0_rgb(255_255_255/0.2)]",
          className,
        )}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel}
            title={option.title}
            onFocus={() => {
              if (option.value !== value) onChange(option.value);
            }}
            className={cn(
              "min-w-0 rounded-[7px] border border-transparent font-medium text-muted-foreground shadow-none transition-[background-color,border-color,color,box-shadow] duration-150",
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
