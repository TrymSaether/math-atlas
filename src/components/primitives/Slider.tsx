import {
  useId,
  useRef,
  type CSSProperties,
  type InputHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
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
 * macOS 27 "Liquid Glass" linear slider. The thumb is a translucent glass
 * lozenge that the accent fill refracts through; while dragging it stretches
 * toward the direction of travel and settles with a spring. Fill progress is
 * pushed straight to a CSS custom property on each input so it tracks the
 * pointer with zero React latency. Consumers own the visible label.
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
  onInput,
  ...rest
}: ShellSliderProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = ticks?.length ? `${generatedId}-ticks` : undefined;
  const range = max - min;
  const clampProgress = (current: number) =>
    range > 0 ? Math.min(100, Math.max(0, ((current - min) / range) * 100)) : 0;
  const progress = clampProgress(value);

  const controlRef = useRef<HTMLSpanElement>(null);
  const lastValueRef = useRef(value);
  const stretchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const control = controlRef.current;
    const current = Number((event.target as HTMLInputElement).value);
    if (control) {
      control.style.setProperty("--slider-progress", `${clampProgress(current)}%`);
      const direction = current > lastValueRef.current ? 1 : current < lastValueRef.current ? -1 : 0;
      if (direction !== 0) {
        // Stretch the leading edge toward travel: scaling from the trailing
        // edge makes the lozenge reach ahead of the value, as AppKit does.
        control.style.setProperty("--thumb-origin", direction > 0 ? "left center" : "right center");
        control.classList.add("is-sliding");
        clearTimeout(stretchTimer.current);
        stretchTimer.current = setTimeout(() => control.classList.remove("is-sliding"), 130);
      }
    }
    lastValueRef.current = current;
    onInput?.(event as Parameters<NonNullable<typeof onInput>>[0]);
  };

  const endStretch = (event: ReactPointerEvent<HTMLInputElement>) => {
    controlRef.current?.classList.remove("is-sliding");
    rest.onPointerUp?.(event);
  };

  const sliderStyle = {
    "--slider-accent": accent,
    "--slider-progress": `${progress}%`,
    ...style,
  } as CSSProperties;

  return (
    <div className={cn("shell-slider-field", `shell-slider-field-${size}`, className)}>
      {leadingAccessory && <span className="shell-slider-accessory">{leadingAccessory}</span>}
      <span
        ref={controlRef}
        className={cn("shell-slider-control", showValue === "always" && "shows-value")}
        style={sliderStyle}
      >
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
          onInput={handleInput}
          onPointerUp={endStretch}
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
