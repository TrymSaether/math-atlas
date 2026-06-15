/**
 * Senior-reviewer nudges. The flagship heuristic: a concept whose prose mentions
 * another concept by name, yet no edge connects them — exactly the
 * "fejer_kernel should relate to cesaro_mean" case. Suggestions are advisory and
 * hidden from `validate` unless `--suggest` is passed.
 */
import type { CliMap } from "../core/model";
import { type Diagnostic, suggestion } from "../diagnostics/diagnostic";
import { texToPlain } from "../utils/text";

/** Labels this short or this generic produce noise, so we skip them as needles. */
const STOPWORDS = new Set([
  "set",
  "map",
  "function",
  "space",
  "point",
  "number",
  "group",
  "field",
  "norm",
  "limit",
  "open",
  "closed",
]);

function conceptText(concept: {
  content?: Record<string, unknown>;
  proof?: { steps: { content: string }[] };
}): string {
  const c = concept.content ?? {};
  const parts: string[] = [];
  for (const k of ["statement", "definition", "formal", "intuition", "gloss"]) {
    const v = c[k];
    if (typeof v === "string") parts.push(v);
  }
  for (const step of concept.proof?.steps ?? []) parts.push(step.content);
  return texToPlain(parts.join("  ")).toLowerCase();
}

export function run(map: CliMap): Diagnostic[] {
  const out: Diagnostic[] = [];

  // Build a needle list of (label → id) for non-trivial labels.
  const needles = map.source.concepts
    .filter((c) => c.label.length >= 5 && !STOPWORDS.has(c.label.toLowerCase()))
    .map((c) => ({
      id: c.id,
      label: c.label.toLowerCase(),
      re: new RegExp(`\\b${c.label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
    }));

  for (const c of map.source.concepts) {
    const text = conceptText(c);
    if (!text) continue;
    const connected = map.neighbors.get(c.id) ?? new Set<string>();
    const mentions: string[] = [];
    for (const n of needles) {
      if (n.id === c.id || connected.has(n.id)) continue;
      if (n.re.test(text)) mentions.push(n.id);
      if (mentions.length >= 3) break;
    }
    for (const target of mentions) {
      out.push(
        suggestion({
          code: "suggest/likely-related",
          map: map.id,
          file: map.fileName,
          conceptId: c.id,
          path: `concepts.${c.id}`,
          message: `'${c.id}' mentions '${target}' but no edge connects them`,
          hint: `consider 'uses' or 'related_to' between ${c.id} and ${target}`,
        }),
      );
    }
  }

  return out;
}
