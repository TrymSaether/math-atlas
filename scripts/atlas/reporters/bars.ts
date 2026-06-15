/**
 * Unicode bar charts and percent meters for stats/coverage/doctor dashboards.
 */
import { padEnd, padStart, pct } from "../utils/text";
import { green, yellow, red, dim, gray } from "../utils/color";

const BLOCKS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];

/** A fractional-width bar for a value relative to `max`, `width` columns wide. */
export function bar(value: number, max: number, width: number): string {
  if (max <= 0) return gray("·".repeat(width));
  const filled = (value / max) * width;
  const full = Math.floor(filled);
  const rem = filled - full;
  const partial = BLOCKS[Math.round(rem * 8)] ?? "";
  const body = "█".repeat(full) + partial;
  return padEnd(body, width);
}

/** A labelled horizontal bar row: `label ███▌  value`. */
export function barRow(
  label: string,
  value: number,
  max: number,
  opts: { labelWidth?: number; barWidth?: number; suffix?: string } = {},
): string {
  const lw = opts.labelWidth ?? 16;
  const bw = opts.barWidth ?? 28;
  const suffix = opts.suffix ?? String(value);
  return `${padEnd(label, lw)} ${gray(bar(value, max, bw))} ${dim(suffix)}`;
}

/** A 0..100 percent meter, coloured by band (red < 40 < yellow < 75 < green). */
export function meter(
  numerator: number,
  denominator: number,
  width = 20,
): string {
  const p = pct(numerator, denominator);
  const filled = Math.round((p / 100) * width);
  const paint = p >= 75 ? green : p >= 40 ? yellow : red;
  const body = paint("█".repeat(filled)) + gray("░".repeat(width - filled));
  return `${body} ${padStart(p + "%", 4)} ${dim(`(${numerator}/${denominator})`)}`;
}
