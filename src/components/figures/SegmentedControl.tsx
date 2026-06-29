import { MathText } from "../../lib/katex";
import { ShellSegmented } from "../primitives";

export interface SegmentOption<T extends string> {
  value: T;
  /** Plain or KaTeX/Math label, rendered with MathText. */
  label: string;
}

/**
 * Compact segmented (radio-group) control shared by the interactive figures
 * that switch between a small set of named modes: convergence type, waveform,
 * sequence space, and so on.
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
    <ShellSegmented
      label={ariaLabel}
      value={value}
      onChange={onChange}
      selectionRole="button"
      size="small"
      className="mt-2.5"
      options={options.map((option) => ({
        id: option.value,
        label: option.label,
        content: <MathText text={option.label} />,
      }))}
    />
  );
}
