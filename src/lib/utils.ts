import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge configured with our HIG text-style ladder font-size tokens.
 * Without this it doesn't recognise `text-body` / `text-caption-1` etc. as
 * sizes, so combining a size class with a color class (e.g.
 * `cn("text-footnote", "text-accent")`) makes it treat both as `text-*`
 * conflicts and silently drop the size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "large-title",
            "title-1",
            "title-2",
            "title-3",
            "headline",
            "body",
            "callout",
            "subhead",
            "footnote",
            "caption-1",
            "caption-2",
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
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
