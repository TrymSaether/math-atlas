/**
 * Reference coherence. The schema already enforces that every edge endpoint and
 * proof-step `uses` id exists. What it cannot see: a proof that *uses* a concept
 * the graph never records a dependency edge for. That gap means the dependency
 * DAG understates what the result actually rests on — a real authoring slip.
 */
import type { CliMap } from "../core/model";
import { type Diagnostic, suggestion } from "../diagnostics/diagnostic";

export function run(map: CliMap): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const c of map.source.concepts) {
    if (!c.proof) continue;
    const used = new Set<string>();
    for (const step of c.proof.steps) for (const u of step.uses) used.add(u);
    if (used.size === 0) continue;

    const connected = map.neighbors.get(c.id) ?? new Set<string>();
    const undeclared = [...used].filter((u) => u !== c.id && !connected.has(u));
    if (undeclared.length > 0) {
      out.push(
        suggestion({
          code: "ref/proof-uses-no-edge",
          map: map.id,
          file: map.fileName,
          conceptId: c.id,
          path: `concepts.${c.id}.proof`,
          message: `'${c.id}' proof uses ${undeclared
            .slice(0, 5)
            .map((u) => `'${u}'`)
            .join(", ")}${undeclared.length > 5 ? "…" : ""} but no edge records the dependency`,
          hint: "add a 'uses' edge so the prerequisite chain reflects the proof",
        }),
      );
    }
  }

  return out;
}
