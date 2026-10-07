/**
 * Pure, framework-agnostic plotting helpers for interactive figures.
 *
 * The figure layer is split deliberately:
 *   - this file: math-free geometry (sampling, scales, SVG path strings)
 *   - fourierMath.ts: the pure mathematics (kernels, partial sums)
 *   - components/figures/*: React state + theming, rendered into the side panel
 *
 * Nothing here imports React, so it is trivially testable and reusable.
 */

/** Shared viewBox for every figure — matches the static diagram house style. */
export const VIEW = { w: 320, h: 180, padX: 14, padY: 14 } as const;

export type Scale = (value: number) => number;

/** `n` evenly spaced samples across [a, b] inclusive. */
export function linspace(a: number, b: number, n: number): number[] {
  if (n < 2) return [a];
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}

/** Affine map from a data interval to a pixel interval. */
export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/**
 * Build an SVG path from sampled `(x, y)` data using the given scales.
 * Non-finite samples (e.g. removable singularities) break the line into
 * separate sub-paths rather than drawing a spurious vertical jump.
 */
export function buildPath(xs: number[], ys: number[], sx: Scale, sy: Scale): string {
  let out = "";
  let pen = false;
  for (let i = 0; i < xs.length; i++) {
    const y = ys[i];
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    const cmd = pen ? "L" : "M";
    out += `${cmd}${sx(xs[i]).toFixed(2)} ${sy(y).toFixed(2)} `;
    pen = true;
  }
  return out.trim();
}

/** Largest finite magnitude in an array (for auto y-domains). */
export function peakMagnitude(ys: number[]): number {
  let m = 0;
  for (const y of ys) if (Number.isFinite(y) && Math.abs(y) > m) m = Math.abs(y);
  return m || 1;
}
