/**
 * Walk every TeX-bearing field of a map and yield it for checking. Content is
 * authored as prose with inline `$…$` math, so we surface the whole field (for
 * delimiter balance) plus the extracted math segments (for KaTeX parsing).
 */
import type { CliMap } from "../core/model.ts";

export interface TexField {
  conceptId: string;
  field: string; // e.g. "content.statement", "notation[0]", "proof.steps[2]"
  tex: string;
}

const CONTENT_KEYS = ["statement", "definition", "formal", "formula", "intuition", "gloss"] as const;

export function scanTex(map: CliMap): TexField[] {
  const out: TexField[] = [];
  for (const c of map.source.concepts) {
    const content = c.content ?? { notation: [] };
    for (const k of CONTENT_KEYS) {
      const v = (content as Record<string, unknown>)[k];
      if (typeof v === "string" && v.includes("$")) out.push({ conceptId: c.id, field: `content.${k}`, tex: v });
    }
    (content.notation ?? []).forEach((n, i) => {
      if (typeof n === "string") out.push({ conceptId: c.id, field: `notation[${i}]`, tex: n });
    });
    (c.examples ?? []).forEach((e, i) => {
      if (e.content.includes("$")) out.push({ conceptId: c.id, field: `examples[${i}]`, tex: e.content });
    });
    c.proof?.steps.forEach((s, i) => {
      if (s.content.includes("$"))
        out.push({
          conceptId: c.id,
          field: `proof.steps[${i}]`,
          tex: s.content,
        });
    });
  }
  return out;
}

export interface MathSegment {
  math: string;
  display: boolean;
}

/** Extract `$…$`, `$$…$$`, `\(…\)`, `\[…\]` math segments from a field. */
export function extractMath(text: string): MathSegment[] {
  const segs: MathSegment[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[1] !== undefined) segs.push({ math: m[1], display: true });
    else if (m[2] !== undefined) segs.push({ math: m[2], display: false });
    else if (m[3] !== undefined) segs.push({ math: m[3], display: true });
    else if (m[4] !== undefined) segs.push({ math: m[4], display: false });
  }
  return segs;
}
