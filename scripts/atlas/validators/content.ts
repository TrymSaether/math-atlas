/**
 * Editorial content lints layered on top of the strict schema. The schema
 * requires the canonical statement and enforces mechanical formatting; these
 * checks cover useful-but-optional pedagogy.
 */
import type { CliMap } from "../core/model.ts";
import { type Diagnostic, suggestion } from "../diagnostics/diagnostic.ts";
import { categoryOf } from "../../../shared/maps/nodeCategory.ts";

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
