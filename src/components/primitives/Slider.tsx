import { type CSSProperties, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface ShellSliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "min" | "max" | "step" | "value" | "size"
> {
  min: number;
  max: number;
  step?: number;
  value: number;
  accent?: string;
  size?: "small" | "regular";
}

/**
 * macOS-style linear slider with a tinted filled track and elevated white
 * thumb. Progress is exposed as a CSS custom property so every consumer gets
 * identical WebKit and Gecko rendering without duplicating slider math.
 */
export function ShellSlider({
  min,
  max,
  step = 1,
  value,
  accent = "var(--accent)",
  size = "regular",
  className,
  style,
  ...rest
}: ShellSliderProps) {
  const range = max - min;
  const progress = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;
  const sliderStyle = {
    "--slider-accent": accent,
    "--slider-progress": `${progress}%`,
    ...style,
  } as CSSProperties;

  return (
    <input
      {...rest}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      className={cn("shell-slider", `shell-slider-${size}`, className)}
      style={sliderStyle}
    />
  );
}
