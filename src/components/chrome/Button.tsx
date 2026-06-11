import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type ButtonKind = "icon" | "text" | "field";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Chrome treatment: square `icon`, inline `text`, or inset-ringed `field`. */
  kind?: ButtonKind;
  /**
   * Selected / open state — renders the accent-tinted treatment. Visual only;
   * set `aria-pressed` / `aria-expanded` yourself so semantics match the role.
   */
  active?: boolean;
  /** Solid accent fill, for the single primary action in a group (e.g. "New"). */
  accent?: boolean;
}

const KIND_CLASS: Record<ButtonKind, string> = {
  icon: "map-icon-button",
  text: "map-text-button",
  field: "map-field-button",
};

/**
 * The one floating-chrome button. Wraps the themeable `.map-*-button` CSS layer
 * so every toolbar button shares the same hover / active / press treatment and
 * accent states instead of re-implementing them inline.
 *
 * Layout that legitimately varies per use — padding, radius, gap, text size — is
 * left to the caller via `className`. The primitive owns only the interactive
 * treatment, the `type="button"` default, and the state classes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { kind = "text", active, accent, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "pointer-events-auto",
        KIND_CLASS[kind],
        active && "is-active",
        accent && "is-accent",
        className,
      )}
      {...rest}
    />
  );
});
