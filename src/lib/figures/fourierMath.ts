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

// ---------------------------------------------------------------------------
// Classic periodic waveforms and their Fourier series.
//
// Each waveform is 2π-periodic on [−π, π]. `target` is the ideal function,
// `partialSum` is the truncated Fourier series keeping `terms` non-zero
// harmonics, and `coeff` is the magnitude of the n-th harmonic (n ≥ 1) for the
// coefficient-spectrum figure.
// ---------------------------------------------------------------------------

export type WaveKind = "square" | "sawtooth" | "triangle";

/** Fold an arbitrary x into the principal period (−π, π]. */
function wrap(x: number): number {
  const t = (((x + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return t - Math.PI;
}

/** Sawtooth f(x) = x on (−π, π), extended 2π-periodically. */
export function sawtoothWave(x: number): number {
  return wrap(x);
}

/** Triangle wave f(x) = |x| on (−π, π), extended 2π-periodically. */
export function triangleWave(x: number): number {
  return Math.abs(wrap(x));
}

/** The ideal waveform of a given kind, evaluated at x. */
export function waveTarget(kind: WaveKind, x: number): number {
  if (kind === "square") return squareWave(x);
  if (kind === "sawtooth") return sawtoothWave(x);
  return triangleWave(x);
}

/**
 * Truncated Fourier series of the given waveform, keeping `terms` non-zero
 * harmonics:
 *  - square    S = (4/π) Σ sin((2j+1)x)/(2j+1)            (odd sines)
 *  - sawtooth  S = 2 Σ (−1)^{k+1} sin(kx)/k               (all sines)
 *  - triangle  S = π/2 − (4/π) Σ cos((2j+1)x)/(2j+1)²     (odd cosines)
 */
export function wavePartialSum(kind: WaveKind, x: number, terms: number): number {
  if (kind === "square") return squareWavePartialSum(x, terms);
  if (kind === "sawtooth") {
    let s = 0;
    for (let k = 1; k <= terms; k++) s += ((k % 2 === 1 ? 1 : -1) * Math.sin(k * x)) / k;
    return 2 * s;
  }
  // triangle
  let s = 0;
  for (let j = 0; j < terms; j++) {
    const k = 2 * j + 1;
    s += Math.cos(k * x) / (k * k);
  }
  return Math.PI / 2 - (4 / Math.PI) * s;
}

/** Magnitude of the n-th harmonic (n ≥ 1) of a waveform, for the spectrum bars. */
export function waveCoeff(kind: WaveKind, n: number): number {
  if (kind === "square") return n % 2 === 1 ? 4 / (Math.PI * n) : 0;
  if (kind === "sawtooth") return 2 / n;
  return n % 2 === 1 ? 4 / (Math.PI * n * n) : 0; // triangle
}

/**
 * Heat flow u(x, t) of the square-wave initial profile on the circle. Each
 * harmonic decays like e^{−k²t}, so high frequencies vanish first and the
 * profile relaxes to its mean: u = (4/π) Σ_{odd k} e^{−k²t} sin(kx)/k.
 */
export function heatProfile(x: number, t: number, terms: number): number {
  let s = 0;
  for (let j = 0; j < terms; j++) {
    const k = 2 * j + 1;
    s += (Math.exp(-k * k * t) * Math.sin(k * x)) / k;
  }
  return (4 / Math.PI) * s;
}

/** Unit-area-ish Gaussian e^{−x²/(2σ²)} (peak 1, before normalization). */
export function gaussian(x: number, sigma: number): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma));
}

/** Rectangular pulse of half-width `half`, centered at `c`: 1 inside, 0 outside. */
export function boxPulse(x: number, c: number, half: number): number {
  return Math.abs(x - c) <= half ? 1 : 0;
}

/**
 * Convolution of two unit boxes (half-width 1) as a function of the shift s:
 * a triangle of half-width 2 and peak 2. (box * box)(s) = max(0, 2 − |s|).
 */
export function boxConvolution(s: number): number {
  return Math.max(0, 2 - Math.abs(s));
}

/** sinc(x) = sin(πx)/(πx), with sinc(0) = 1. */
export function sinc(x: number): number {
  if (Math.abs(x) < EPS) return 1;
  const t = Math.PI * x;
  return Math.sin(t) / t;
}

/**
 * The frequency a pure tone of frequency `f` masquerades as when sampled at
 * rate `fs` — the folded value in [0, fs/2]. Equal to f when fs ≥ 2f
 * (Nyquist satisfied); otherwise a lower alias.
 */
export function aliasFrequency(f: number, fs: number): number {
  if (fs <= 0) return f;
  let a = f % fs;
  if (a < 0) a += fs;
  return a > fs / 2 ? fs - a : a;
}

/** The n-th roots of unity as (x, y) points on the unit circle. */
export function rootsOfUnity(n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, k) => {
    const theta = (2 * Math.PI * k) / n;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  });
}

/**
 * Weierstrass-type function W(x) = Σ_{k=0}^{terms−1} a^k cos(b^k π x).
 * With 0 < a < 1 < b and ab > 1 the limit is continuous but nowhere
 * differentiable; each added term injects finer, steeper oscillation.
 */
export function weierstrass(x: number, terms: number, a = 0.5, b = 3): number {
  let s = 0;
  for (let k = 0; k < terms; k++) s += Math.pow(a, k) * Math.cos(Math.pow(b, k) * Math.PI * x);
  return s;
}
