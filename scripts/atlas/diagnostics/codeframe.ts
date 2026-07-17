/**
 * Codeframe rendering. Mapping a Zod issue path to an exact byte offset in a
 * 12k-line minified-ish JSON is brittle, so we anchor on something robust and
 * human-meaningful instead: the concept's `"id": "<id>"` line. The frame shows a
 * few lines of context with the offending line marked, TypeScript-compiler style.
 */
import { gray, red, dim, bold } from "../utils/color.ts";

export interface Located {
  line: number; // 1-based
  column: number; // 1-based
  text: string;
}

/** Find the 1-based line of the first occurrence of any anchor string. */
export function locate(raw: string, anchors: string[]): Located | undefined {
  const lines = raw.split("\n");
  for (const anchor of anchors) {
    for (let i = 0; i < lines.length; i++) {
      const col = lines[i].indexOf(anchor);
      if (col >= 0) {
        return { line: i + 1, column: col + 1, text: lines[i] };
      }
    }
  }
  return undefined;
}

/** Anchor strings to try for a concept, most specific first. */
export function conceptAnchors(conceptId: string): string[] {
  return [`"id": "${conceptId}"`, `"id":"${conceptId}"`, `"${conceptId}"`];
}

export function renderFrame(raw: string, loc: Located, context = 1): string {
  const lines = raw.split("\n");
  const start = Math.max(1, loc.line - context);
  const end = Math.min(lines.length, loc.line + context);
  const gutter = String(end).length;
  const out: string[] = [];
  for (let n = start; n <= end; n++) {
    const isHit = n === loc.line;
    const num = String(n).padStart(gutter, " ");
    const bar = isHit ? red("›") : " ";
    const lineText = lines[n - 1].slice(0, 116);
    out.push(`  ${bar} ${gray(num)} ${dim("│")} ${lineText}`);
    if (isHit) {
      const caret = " ".repeat(loc.column - 1) + red("^");
      out.push(`  ${" "} ${" ".repeat(gutter)} ${dim("│")} ${dim(caret)}`);
    }
  }
  return out.join("\n");
}

/** Convenience: locate by concept id and render, or return undefined. */
export function frameForConcept(raw: string, conceptId: string): string | undefined {
  const loc = locate(raw, conceptAnchors(conceptId));
  return loc ? renderFrame(raw, loc) : undefined;
}

export { bold };
