import {
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../../lib/utils";
import { Glass, type GlassMaterial } from "./Glass";

export interface ShellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  primary?: boolean;
  shape?: "default" | "pill" | "circle";
  ref?: Ref<HTMLButtonElement>;
}

export function ShellButton({
  active,
  primary,
  shape = "default",
  className,
  type = "button",
  ...rest
}: ShellButtonProps) {
  return (
    <button
      type={type}
      data-active={active ? "true" : undefined}
      className={cn(
        "shell-btn",
        active && "is-active",
        primary && "shell-btn-primary",
        shape === "pill" && "shell-btn-pill",
        shape === "circle" && "shell-btn-circle",
        className,
      )}
      {...rest}
    />
  );
}

export function ShellIconButton({ className, shape = "circle", ...rest }: ShellButtonProps) {
  return <ShellButton shape={shape} className={cn("shell-btn-icon", className)} {...rest} />;
}

export function GlassControlGroup({
  children,
  material = "regular",
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  material?: GlassMaterial;
}) {
  return (
    <Glass material={material} className={cn("shell-control-group", className)} {...rest}>
      {children}
    </Glass>
  );
}

export function ShellSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  hideLabels = false,
  selectionRole = "tab",
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string; icon?: ReactNode; ariaLabel?: string; title?: string }[];
  onChange: (id: T) => void;
  className?: string;
  hideLabels?: boolean | "responsive";
  selectionRole?: "tab" | "button";
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  const focusIndexRef = useRef(selectedIndex);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusOption = (index: number) => {
    focusIndexRef.current = index;
    optionRefs.current[index]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (options.length === 0) return;

    const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);

    const fromIndex = currentIndex >= 0 ? currentIndex : selectedIndex;

    let nextIndex: number;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (fromIndex + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (fromIndex - 1 + options.length) % options.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = options.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    focusOption(nextIndex);
  };

  return (
    <div
      className={cn("shell-seg", className)}
      role={selectionRole === "tab" ? "tablist" : "group"}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const active = option.id === value;

        return (
          <button
            key={option.id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role={selectionRole === "tab" ? "tab" : undefined}
            aria-selected={selectionRole === "tab" ? active : undefined}
            aria-pressed={selectionRole === "button" ? active : undefined}
            aria-label={hideLabels ? (option.ariaLabel ?? option.label) : option.ariaLabel}
            title={option.title ?? option.label}
            tabIndex={active ? 0 : -1}
            data-active={active ? "true" : undefined}
            className={cn("shell-seg-opt", active && "is-active")}
            onClick={() => onChange(option.id)}
            onFocus={() => {
              focusIndexRef.current = index;
            }}
          >
            {option.icon && <span className="shell-control-icon" aria-hidden>{option.icon}</span>}
            <span
              className={cn(
                hideLabels === true && "sr-only",
                hideLabels === "responsive" && "shell-seg-label-responsive",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
export function ShellSwitch({
  label,
  on,
  onToggle,
  className,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn("shell-switch-btn", className)}
    >
      <span className="font-medium">{label}</span>
      <span className={cn("shell-switch", on && "is-on")} aria-hidden />
    </button>
  );
}

export interface ShellChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  dotColor?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ShellChip({ active, dotColor, className, type = "button", children, ...rest }: ShellChipProps) {
  const ariaPressed = rest["aria-pressed"] ?? active;

  return (
    <button
      type={type}
      aria-pressed={ariaPressed}
      data-active={active ? "true" : undefined}
      className={cn("shell-chip", active && "is-active", className)}
      {...rest}
    >
      {dotColor && <span className="shell-chip-dot" style={{ background: dotColor }} aria-hidden />}
      {children}
    </button>
  );
}

export function ShellPanelHeader({
  title,
  children,
  className,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={cn("shell-panel-header", className)} {...rest}>
      <span className="shell-panel-title">{title}</span>
      {children && <div className="shell-panel-actions">{children}</div>}
    </header>
  );
}
