import { MathText } from "../../lib/katex";

export interface SegmentOption<T extends string> {
  value: T;
  /** Plain or KaTeX/Math label, rendered with MathText. */
  label: string;
}

/**
 * Compact segmented (radio-group) control shared by the interactive figures
 * that switch between a small set of named modes — convergence type, which
 * sequence space, and so on. Mirrors `WaveSelect`'s look but is generic.
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
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="mt-2.5 inline-flex overflow-hidden rounded-md border p-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className="rounded-sm px-2.5 py-1 text-ui-meta transition-colors"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--fg-on-color)" : "var(--fg-2)",
              fontWeight: active ? 600 : 400,
            }}
          >
            <MathText text={opt.label} />
          </button>
        );
      })}
    </div>
  );
}
