/**
 * Pure Fourier-analysis functions used by the interactive figures.
 * No React, no SVG — just numbers in, numbers out.
 */

const EPS = 1e-9;

/** Dirichlet kernel D_N(x) = sin((N+½)x) / sin(x/2); D_N(0) = 2N+1. */
export function dirichletKernel(x: number, N: number): number {
  const denom = Math.sin(x / 2);
  if (Math.abs(denom) < EPS) return 2 * N + 1;
  return Math.sin((N + 0.5) * x) / denom;
}

/** Fejér kernel F_N(x) = (1/(N+1)) (sin((N+1)x/2)/sin(x/2))²; F_N(0) = N+1; ≥ 0. */
export function fejerKernel(x: number, N: number): number {
  const denom = Math.sin(x / 2);
  if (Math.abs(denom) < EPS) return N + 1;
  const r = Math.sin(((N + 1) * x) / 2) / denom;
  return (r * r) / (N + 1);
}

/** Poisson kernel P_r(θ) = (1−r²)/(1−2r cosθ + r²), 0 ≤ r < 1; P_r(0) = (1+r)/(1−r). */
export function poissonKernel(theta: number, r: number): number {
  return (1 - r * r) / (1 - 2 * r * Math.cos(theta) + r * r);
}

/** Peak value of a kernel at the origin, for normalization. */
export function kernelPeak(kind: "dirichlet" | "fejer" | "poisson", param: number): number {
  if (kind === "dirichlet") return 2 * param + 1;
  if (kind === "fejer") return param + 1;
  return (1 + param) / (1 - param); // poisson, param = r
}

/** Ideal ±1 square wave on [−π, π]. */
export function squareWave(x: number): number {
  return Math.sin(x) >= 0 ? 1 : -1;
}

/**
 * Partial sum of the square wave's Fourier series, keeping `terms` odd harmonics:
 * S_M(x) = (4/π) Σ_{j=0}^{M−1} sin((2j+1)x)/(2j+1).
 */
export function squareWavePartialSum(x: number, terms: number): number {
  let s = 0;
  for (let j = 0; j < terms; j++) {
    const k = 2 * j + 1;
    s += Math.sin(k * x) / k;
  }
  return (4 / Math.PI) * s;
}
