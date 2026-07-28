import { MathText } from "@/math/MathText";
import { SegmentedControl as BaseSegmentedControl } from "@/ui/segmented-control";

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
    <BaseSegmentedControl
      value={value}
      options={options.map((option) => ({
        value: option.value,
        label: <MathText text={option.label} />,
      }))}
      onChange={onChange}
      ariaLabel={ariaLabel}
      size="small"
      className="mt-2.5 w-full"
    />
  );
}
