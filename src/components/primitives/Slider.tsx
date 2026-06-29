import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SliderTick {
  value: number;
  label?: string;
}

export interface ShellSliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "min" | "max" | "step" | "value" | "size" | "list"
> {
  min: number;
  max: number;
  step?: number;
  value: number;
  accent?: string;
  size?: "small" | "regular";
  ticks?: readonly SliderTick[];
  leadingAccessory?: ReactNode;
  trailingAccessory?: ReactNode;
}

/**
 * macOS linear slider: leading fill, narrow lozenge thumb, optional endpoint
 * accessories, and native datalist tick marks. Consumers remain responsible for
 * a visible label and live value feedback appropriate to the setting.
 */
export function ShellSlider({
  min,
  max,
  step = 1,
  value,
  accent = "var(--mac27-accent)",
  size = "regular",
  ticks,
  leadingAccessory,
  trailingAccessory,
  className,
  style,
  ...rest
}: ShellSliderProps) {
  const generatedId = useId();
  const listId = ticks?.length ? `${generatedId}-ticks` : undefined;
  const range = max - min;
  const progress = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;
  const sliderStyle = {
    "--slider-accent": accent,
    "--slider-progress": `${progress}%`,
    ...style,
  } as CSSProperties;

  return (
    <div className={cn("shell-slider-field", `shell-slider-field-${size}`, className)}>
      {leadingAccessory && <span className="shell-slider-accessory">{leadingAccessory}</span>}
      <input
        {...rest}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        list={listId}
        className="shell-slider"
        style={sliderStyle}
      />
      {ticks?.length ? (
        <datalist id={listId}>
          {ticks.map((tick) => (
            <option key={tick.value} value={tick.value} label={tick.label} />
          ))}
        </datalist>
      ) : null}
      {trailingAccessory && <span className="shell-slider-accessory">{trailingAccessory}</span>}
    </div>
  );
}
