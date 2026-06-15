/**
 * Minimal ANSI colour layer. Dependency-free on purpose: the whole CLI ships
 * with the repo's existing toolchain (tsx/zod/katex) and adds nothing to install.
 *
 * Colour is globally toggleable — `setColor(false)` (driven by `--no-color`,
 * `NO_COLOR`, or a non-TTY stdout) makes every helper a passthrough so piped /
 * `--json` output stays clean.
 */
const ESC = "";

let enabled =
  process.stdout.isTTY === true && process.env.NO_COLOR === undefined;

export function setColor(on: boolean): void {
  enabled = on;
}
export function colorEnabled(): boolean {
  return enabled;
}

const wrap =
  (open: number, close: number) =>
  (s: string | number): string =>
    enabled ? `${ESC}[${open}m${s}${ESC}[${close}m` : String(s);

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const underline = wrap(4, 24);

export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const magenta = wrap(35, 39);
export const cyan = wrap(36, 39);
export const gray = wrap(90, 39);
export const white = wrap(37, 39);

/** 256-colour foreground, used for the domain palette swatches. */
export function fg256(code: number): (s: string | number) => string {
  return (s) => (enabled ? `${ESC}[38;5;${code}m${s}${ESC}[39m` : String(s));
}

/** Map a domain palette key to an approximate 256-colour code for swatches. */
export const PALETTE_256: Record<string, number> = {
  blue: 33,
  green: 35,
  purple: 99,
  red: 167,
  teal: 37,
  orange: 173,
  pink: 168,
  gold: 178,
  slate: 103,
  cyan: 44,
  indigo: 61,
  violet: 134,
  amber: 214,
  lime: 106,
  emerald: 36,
  rose: 204,
  sky: 74,
  fuchsia: 170,
  stone: 144,
  zinc: 246,
};

export function swatch(palette: string): string {
  const code = PALETTE_256[palette] ?? 246;
  return fg256(code)("●");
}

/** Visible length of a string, ignoring ANSI escape sequences. */
export function visibleLength(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replace(new RegExp(`${ESC}\\[[0-9;]*m`, "g"), "").length;
}
