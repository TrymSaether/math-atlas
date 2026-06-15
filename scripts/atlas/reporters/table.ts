/**
 * Aligned terminal tables. ANSI-aware width math (via visibleLength) so coloured
 * cells still line up. Intentionally tiny — no wrapping, no borders by default;
 * a light header rule keeps it readable without looking like a spreadsheet.
 */
import { dim, gray, bold } from "../utils/color";
import { visibleLength } from "../utils/color";
import { padEnd, padStart } from "../utils/text";

export interface Column {
  header: string;
  align?: "left" | "right";
  /** Hard cap on column width; cells are NOT truncated here (caller decides). */
  min?: number;
}

export function table(columns: Column[], rows: string[][]): string {
  const widths = columns.map((c, i) => {
    const cellMax = Math.max(
      visibleLength(c.header),
      ...rows.map((r) => visibleLength(r[i] ?? "")),
    );
    return Math.max(cellMax, c.min ?? 0);
  });

  const fmt = (cell: string, i: number): string =>
    columns[i].align === "right" ? padStart(cell, widths[i]) : padEnd(cell, widths[i]);

  const head = columns.map((c, i) => bold(fmt(c.header, i))).join(gray("  "));
  const rule = gray(widths.map((w) => "─".repeat(w)).join("  "));
  const body = rows.map((r) => r.map((cell, i) => fmt(cell ?? "", i)).join(gray("  "))).join("\n");

  return `${head}\n${rule}\n${body}`;
}

/** A labelled "key: value" definition block, right-aligning keys. */
export function keyValues(pairs: [string, string][], pad = 0): string {
  const keyW = Math.max(pad, ...pairs.map(([k]) => visibleLength(k)));
  return pairs.map(([k, v]) => `${dim(padStart(k, keyW))}  ${v}`).join("\n");
}
