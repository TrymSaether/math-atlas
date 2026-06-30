/*
 * Motion presets — the spring + easing vocabulary for the whole UI.
 *
 * Pair with Motion (`motion/react`). Keep these the *only* source of spring
 * config so timing stays consistent across surfaces. Values match the ratified
 * visual bar.
 */
import type { Transition } from "motion/react";

/** Spring presets, by feel. Use `spring.snappy` etc. as a Motion `transition`. */
export const spring = {
  /** Quick settle, no overshoot — toggles, hovers, control presses. */
  snappy: { type: "spring", stiffness: 380, damping: 32, mass: 1 },
  /** Calm open/close — panels, sidebars. */
  smooth: { type: "spring", stiffness: 240, damping: 30, mass: 1 },
  /** Slight overshoot — command palette, sheets presenting. */
  gentle: { type: "spring", stiffness: 200, damping: 26, mass: 1 },
} satisfies Record<string, Transition>;

export type SpringPreset = keyof typeof spring;

/** Bézier easings for non-spring transitions (color, opacity). */
export const easing = {
  /** Apple's signature curve. */
  apple: [0.32, 0.72, 0, 1],
  out: [0.16, 1, 0.3, 1],
} as const;

/** Durations in seconds (Motion) — mirror the CSS `--duration-*` tokens. */
export const duration = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;
