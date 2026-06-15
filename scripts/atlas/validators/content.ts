/**
 * Content completeness lints — "a definition with no definition", "a theorem
 * with no statement". Tuned per kind so we nudge where it matters and stay quiet
 * where a field is genuinely optional. Missing intuition on a core concept is a
 * suggestion, not a warning.
 */
import type { CliMap } from "../core/model";
import { type Diagnostic, warning, suggestion } from "../diagnostics/diagnostic";
import { categoryOf } from "../../../src/lib/nodeCategory";

export function run(map: CliMap): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const c of map.source.concepts) {
    const cat = categoryOf(c.kind);
    const content = c.content ?? { notation: [] };
    const has = (k: string): boolean => {
      const v = (content as Record<string, unknown>)[k];
      return typeof v === "string" && v.trim().length > 0;
    };

    const base = {
      map: map.id,
      file: map.fileName,
      conceptId: c.id,
      path: `concepts.${c.id}`,
    };

    if (cat === "theorem" && !has("statement") && !has("formal")) {
      out.push(
        warning({
          ...base,
          code: "content/missing-statement",
          message: `${c.kind} '${c.id}' has no statement or formal — readers see only a label`,
          hint: "add content.statement (informal) or content.formal",
        }),
      );
    }

    if (cat === "definition" && !has("definition") && !has("statement") && !has("formal")) {
      out.push(
        warning({
          ...base,
          code: "content/missing-definition",
          message: `definition '${c.id}' has no definition/statement body`,
          hint: "add content.definition",
        }),
      );
    }

    if (cat === "theorem" && !c.proof && c.priority !== "peripheral") {
      out.push(
        suggestion({
          ...base,
          code: "content/missing-proof",
          message: `${c.kind} '${c.id}' has no proof`,
          hint: "add a proof block, or mark priority 'peripheral' if a proof is out of scope",
        }),
      );
    }

    if (c.priority === "core" && !has("intuition")) {
      out.push(
        suggestion({
          ...base,
          code: "content/missing-intuition",
          message: `core concept '${c.id}' has no intuition`,
          hint: "core concepts carry the load — an intuition gloss helps a lot",
        }),
      );
    }
  }

  return out;
}
