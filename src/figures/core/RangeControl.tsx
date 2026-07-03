import { type CSSProperties, type ReactNode } from "react";

import { MathText } from "@/math/MathText";
import { Slider } from "@/ui/slider";
import { DIA, UI } from "./FigureFrame";

/** Themed slider with a KaTeX-rendered live value label. */
export function RangeControl({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  ariaLabel,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** KaTeX/Math source for the live label, e.g. `N = 7`. */
  label: string;
  ariaLabel: string;
}): ReactNode {
  return (
    <div className="mt-2.5 flex items-center gap-3">
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        aria-label={ariaLabel}
        onValueChange={(v) => onChange(v[0])}
        className="flex-1"
        style={{ "--primary": DIA.accent } as CSSProperties}
      />
      <span className="min-w-14 shrink-0 text-right font-math text-caption-1" style={{ color: UI.text }}>
        <MathText text={label} />
      </span>
    </div>
  );
}
