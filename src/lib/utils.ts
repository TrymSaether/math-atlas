import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge configured with our custom font-size tokens. Without this it
 * doesn't recognise `text-ui-*` / `text-atlas-*` etc. as sizes, so combining a
 * size class with a color class (e.g. `cn("text-ui-control", "text-accent")`)
 * makes it treat both as `text-*` conflicts and silently drop the size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "edge-label",
            "ui-tiny",
            "ui-2xs",
            "ui-caption",
            "ui-hint",
            "ui-meta",
            "ui-xs",
            "ui-control",
            "ui-sm",
            "ui-copy",
            "ui-body",
            "ui-lead",
            "atlas-brand",
            "atlas-card",
            "node-panel-title",
            "atlas-panel",
            "atlas-summary",
            "atlas-display",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True when the user has requested reduced motion (guards optional animations). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
