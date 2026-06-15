/**
 * Structural lints over the dependency DAG: orphans, cycles, and disconnected
 * islands. The strict SourceGraphSchema already blocks self-loops and dup edges;
 * this layer adds the graph-shaped findings it cannot see.
 */
import type { CliMap } from "../core/model";
import { type Diagnostic, warning } from "../diagnostics/diagnostic";
import { detectCycles, components, orphans } from "../graph/algorithms";

export function run(map: CliMap): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const id of orphans(map)) {
    out.push(
      warning({
        code: "structure/orphan",
        map: map.id,
        file: map.fileName,
        conceptId: id,
        path: `concepts.${id}`,
        message: `orphan concept '${id}' — no edges connect it to the graph`,
        hint: "add a defining/using edge, or drop the concept",
      }),
    );
  }

  // Cycles are a real smell but, in this corpus, a tolerated one: the app's
  // metrics layer is deliberately cycle-safe and `build:maps` ships maps that
  // contain them. So validate WARNS (not errors) here — `atlas graph cycles` is
  // the dedicated, exit-1 view. Dedupe overlapping rings to the smallest set.
  const seenRings = new Set<string>();
  for (const cycle of detectCycles(map)) {
    const key = [...cycle.nodes].sort().join("|");
    if (seenRings.has(key)) continue;
    seenRings.add(key);
    const ring = cycle.nodes.join(" → ") + " → " + cycle.nodes[0];
    out.push(
      warning({
        code: "structure/cycle",
        map: map.id,
        file: map.fileName,
        conceptId: cycle.nodes[0],
        path: `concepts.${cycle.nodes[0]}`,
        message: `dependency cycle: ${ring}`,
        hint: "a prerequisite chain should be acyclic; consider breaking one edge",
      }),
    );
  }

  const comps = components(map);
  // Everything beyond the largest component is a disconnected island.
  for (const island of comps.slice(1)) {
    if (island.length === 1) continue; // singletons are reported as orphans
    out.push(
      warning({
        code: "structure/island",
        map: map.id,
        file: map.fileName,
        conceptId: island[0],
        path: `concepts.${island[0]}`,
        message: `disconnected component of ${island.length} concepts (e.g. ${island
          .slice(0, 4)
          .join(", ")}${island.length > 4 ? "…" : ""})`,
        hint: "link this cluster to the main graph or confirm it is intentionally separate",
      }),
    );
  }

  return out;
}
