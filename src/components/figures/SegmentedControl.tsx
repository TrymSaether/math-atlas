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
 * sequence space, and so on. Wraps the shared macOS Liquid Glass primitive so
 * figures inherit the same sliding pill, stretch, and state styling as the
 * rest of the shell.
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
      className="mt-2.5"
      label={ariaLabel}
      value={value}
      size="small"
      onChange={onChange}
      options={options.map((opt) => ({
        id: opt.value,
        label: opt.label,
        content: <MathText text={opt.label} />,
      }))}
    />
  );
}
