/**
 * LaTeX checker. Two independent layers:
 *   1. structural balance on the raw field — unescaped `$` parity, `{}` parity,
 *      `\begin{env}` ↔ `\end{env}` matching. These catch the most common slips
 *      without needing a TeX engine.
 *   2. KaTeX parse of each extracted math segment (throwOnError) — catches
 *      unsupported macros and malformed environments KaTeX understands.
 */
import katex from "katex";
import type { CliMap } from "../core/model";
import { type Diagnostic, error } from "../diagnostics/diagnostic";
import { scanTex, extractMath, type TexField } from "./scan";

function countUnescaped(s: string, ch: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ch && s[i - 1] !== "\\") n++;
  }
  return n;
}

function balanceIssues(f: TexField): string[] {
  const issues: string[] = [];
  if (countUnescaped(f.tex, "$") % 2 !== 0) issues.push("unbalanced `$` math delimiter");

  const open = (f.tex.match(/(?<!\\)\{/g) ?? []).length;
  const close = (f.tex.match(/(?<!\\)\}/g) ?? []).length;
  if (open !== close) issues.push(`unbalanced braces (${open} '{' vs ${close} '}')`);

  const begins = [...f.tex.matchAll(/\\begin\{([^}]*)\}/g)].map((m) => m[1]);
  const ends = [...f.tex.matchAll(/\\end\{([^}]*)\}/g)].map((m) => m[1]);
  if (begins.length !== ends.length)
    issues.push(`unbalanced environments (${begins.length} \\begin vs ${ends.length} \\end)`);
  else {
    for (let i = 0; i < begins.length; i++)
      if (begins[i] !== ends[i])
        issues.push(`environment mismatch: \\begin{${begins[i]}} … \\end{${ends[i]}}`);
  }
  return issues;
}

export function checkLatex(map: CliMap): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const f of scanTex(map)) {
    const base = {
      map: map.id,
      file: map.fileName,
      conceptId: f.conceptId,
      path: `concepts.${f.conceptId}.${f.field}`,
    };

    for (const msg of balanceIssues(f)) {
      out.push(
        error({
          ...base,
          code: "latex/balance",
          message: `${f.field}: ${msg}`,
        }),
      );
    }

    for (const seg of extractMath(f.tex)) {
      try {
        katex.renderToString(seg.math, {
          throwOnError: true,
          strict: "ignore",
          displayMode: seg.display,
        });
      } catch (err) {
        const reason = (err as Error).message.replace(/^KaTeX parse error:\s*/, "").split("\n")[0];
        out.push(
          error({
            ...base,
            code: "latex/parse",
            message: `${f.field}: ${reason}`,
            hint: `in: ${seg.math.slice(0, 60)}`,
          }),
        );
      }
    }
  }
  return out;
}
