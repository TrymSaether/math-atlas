import { type WaveKind } from "../../lib/figures/fourierMath";

const LABELS: Record<WaveKind, string> = {
  square: "Square",
  sawtooth: "Sawtooth",
  triangle: "Triangle",
};

const ORDER: WaveKind[] = ["square", "sawtooth", "triangle"];

/** Compact segmented control for picking which target waveform a figure draws. */
export function WaveSelect({
  value,
  onChange,
}: {
  value: WaveKind;
  onChange: (k: WaveKind) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Target waveform"
      className="mt-2.5 inline-flex overflow-hidden rounded-[var(--radius-md)] border p-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {ORDER.map((k) => {
        const active = k === value;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(k)}
            className="rounded-[var(--radius-sm)] px-2.5 py-1 text-ui-meta transition-colors"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-fg, #fff)" : "var(--fg-2)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}
