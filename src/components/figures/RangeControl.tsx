import { type ReactNode } from "react";

import { MathText } from "../../lib/katex";
import { ShellSlider } from "../primitives";
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
      <ShellSlider
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        accent={DIA.accent}
        className="flex-1"
      />
      <span className="min-w-14 shrink-0 text-right font-math text-caption-1" style={{ color: UI.text }}>
        <MathText text={label} />
      </span>
    </div>
  );
}
