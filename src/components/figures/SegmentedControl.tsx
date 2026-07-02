import { MathText } from "../../lib/katex";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface SegmentOption<T extends string> {
  value: T;
  /** Plain or KaTeX/Math label, rendered with MathText. */
  label: string;
}

/**
 * Compact segmented (radio-group) control shared by the interactive figures that
 * switch between a small set of named modes: convergence type, waveform, sequence
 * space, and so on. Built on the design system's ToggleGroup so figures inherit
 * the same segmented styling as the rest of the shell.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className="mt-2.5 w-full gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className="h-8 flex-1 rounded-md text-caption data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          <MathText text={opt.label} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
