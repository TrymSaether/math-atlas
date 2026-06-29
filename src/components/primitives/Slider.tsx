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
  showValue?: "hover" | "always" | false;
  formatValue?: (value: number) => ReactNode;
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
  showValue = "hover",
  formatValue = (currentValue) => currentValue,
  className,
  style,
  id,
  ...rest
}: ShellSliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
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
      <span className={cn("shell-slider-control", showValue === "always" && "shows-value")} style={sliderStyle}>
        <input
          {...rest}
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          list={listId}
          className="shell-slider"
        />
        {showValue && (
          <output className="shell-slider-value" htmlFor={inputId}>
            {formatValue(value)}
          </output>
        )}
        {ticks?.length ? (
          <>
            <datalist id={listId}>
              {ticks.map((tick) => (
                <option key={tick.value} value={tick.value} label={tick.label} />
              ))}
            </datalist>
            <span className="shell-slider-ticks" aria-hidden="true">
              {ticks.map((tick) => {
                const tickProgress = range > 0 ? ((tick.value - min) / range) * 100 : 0;
                return (
                  <span
                    key={tick.value}
                    className="shell-slider-tick"
                    style={{ "--slider-tick": `${tickProgress}%` } as CSSProperties}
                  >
                    {tick.label && <span className="shell-slider-tick-label">{tick.label}</span>}
                  </span>
                );
              })}
            </span>
          </>
        ) : null}
      </span>
      {trailingAccessory && <span className="shell-slider-accessory">{trailingAccessory}</span>}
    </div>
  );
}
