/**
 * `atlas doctor` — deep health dashboard. Coverage meters (definition / statement
 * / proof / intuition / diagram), graph density and connectivity, the most
 * central concepts, thin domains, oversized concepts, and foundational roots.
 * Pure read-only; reuses the graph algorithms for components and centrality.
 */
import type { Command } from "../core/command";
import { loadMaps, type Ctx } from "../core/context";
import type { CliMap } from "../core/model";
import {
  components,
  betweenness,
  roots,
  detectCycles,
} from "../graph/algorithms";
import { categoryOf } from "../../../src/lib/nodeCategory";
import { meter } from "../reporters/bars";
import { table } from "../reporters/table";
import { bold, dim, cyan, gray, green, yellow, red } from "../utils/color";
import { MARK, kindGlyph } from "../utils/glyphs";
import { pct, padStart } from "../utils/text";

function has(node: CliMap["nodes"][number], key: string): boolean {
  const v = (node.content as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim().length > 0;
}

function diagnose(map: CliMap) {
  const nodes = map.nodes;
  const theorems = nodes.filter((n) => categoryOf(n.kind) === "theorem");
  const definitions = nodes.filter((n) => categoryOf(n.kind) === "definition");

  const comps = components(map);
  const cycles = detectCycles(map);
  const avgDeg = nodes.length
    ? nodes.reduce((s, n) => s + n.degree, 0) / nodes.length
    : 0;

  const oversized = [...nodes]
    .map((n) => ({ id: n.id, p: map.prereqsOf.get(n.id)?.length ?? 0 }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 5);

  const bc = betweenness(map);
  const central = [...bc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const domainSizes = map.domainsByOrder.map((d) => ({
    id: d.id,
    label: d.label,
    n: nodes.filter((x) => x.domain === d.id).length,
  }));

  return {
    nodes,
    theorems,
    definitions,
    comps,
    cycles,
    avgDeg,
    oversized,
    central,
    domainSizes,
    rootCount: roots(map).length,
  };
}

function renderMap(map: CliMap): void {
  const dx = diagnose(map);
  const n = dx.nodes.length;
  process.stdout.write(
    "\n" + bold(cyan(map.label)) + dim(`  ${map.id}`) + "\n\n",
  );

  // Coverage meters.
  const meterRow = (label: string, num: number, den: number) =>
    process.stdout.write("  " + dim(label.padEnd(18)) + meter(num, den) + "\n");
  process.stdout.write("  " + bold("Coverage") + "\n");
  meterRow(
    "definitions",
    dx.definitions.filter((d) => has(d, "definition") || has(d, "statement"))
      .length,
    dx.definitions.length,
  );
  meterRow(
    "theorem stmts",
    dx.theorems.filter((t) => has(t, "statement") || has(t, "formal")).length,
    dx.theorems.length,
  );
  meterRow(
    "theorem proofs",
    dx.theorems.filter((t) => !!t.proof).length,
    dx.theorems.length,
  );
  meterRow("intuition", dx.nodes.filter((x) => has(x, "intuition")).length, n);
  meterRow("diagrams", dx.nodes.filter((x) => !!x.diagram).length, n);

  // Graph health.
  process.stdout.write("\n  " + bold("Graph") + "\n");
  const connected = dx.comps.length === 1;
  process.stdout.write(
    "  " +
      dim("density".padEnd(18)) +
      `${dx.avgDeg.toFixed(2)} ` +
      dim("avg degree") +
      "\n" +
      "  " +
      dim("components".padEnd(18)) +
      (connected
        ? green(`${MARK.ok} connected`)
        : yellow(`${MARK.warning} ${dx.comps.length} components`)) +
      "\n" +
      "  " +
      dim("cycles".padEnd(18)) +
      (dx.cycles.length
        ? red(`${MARK.error} ${dx.cycles.length}`)
        : green(`${MARK.ok} none`)) +
      "\n" +
      "  " +
      dim("foundations".padEnd(18)) +
      `${dx.rootCount} ` +
      dim("roots (no prereqs)") +
      "\n",
  );

  // Central + oversized.
  process.stdout.write("\n  " + bold("Most central") + "\n");
  process.stdout.write(
    indent(
      table(
        [{ header: "concept" }, { header: "betweenness", align: "right" }],
        dx.central.map(([id, v]) => [
          `${kindGlyph(map.nodeById.get(id)!.kind)} ${id}`,
          v.toFixed(3),
        ]),
      ),
    ) + "\n",
  );

  process.stdout.write("\n  " + bold("Heaviest (most prerequisites)") + "\n");
  process.stdout.write(
    indent(
      table(
        [{ header: "concept" }, { header: "prereqs", align: "right" }],
        dx.oversized.map((o) => [
          `${kindGlyph(map.nodeById.get(o.id)!.kind)} ${o.id}`,
          String(o.p),
        ]),
      ),
    ) + "\n",
  );

  // Thin domains.
  const thin = [...dx.domainSizes].sort((a, b) => a.n - b.n).slice(0, 3);
  process.stdout.write("\n  " + bold("Thinnest domains") + "\n");
  for (const d of thin)
    process.stdout.write(
      "  " + gray(padStart(String(d.n), 4)) + "  " + dim(d.label) + "\n",
    );
}

function indent(s: string, pad = "  "): string {
  return s
    .split("\n")
    .map((l) => pad + l)
    .join("\n");
}

function run(ctx: Ctx): number {
  const maps = loadMaps(ctx);
  if (ctx.json) {
    process.stdout.write(
      JSON.stringify(
        maps.map((m) => {
          const dx = diagnose(m);
          return {
            id: m.id,
            concepts: dx.nodes.length,
            components: dx.comps.length,
            cycles: dx.cycles.length,
            avgDegree: Number(dx.avgDeg.toFixed(2)),
            diagramCoverage: pct(
              dx.nodes.filter((x) => !!x.diagram).length,
              dx.nodes.length,
            ),
          };
        }),
        null,
        2,
      ) + "\n",
    );
    return 0;
  }
  process.stdout.write(
    "\n" + bold("atlas doctor") + gray(`  ·  ${maps.length} map(s)`) + "\n",
  );
  for (const m of maps) renderMap(m);
  process.stdout.write("\n");
  return 0;
}

const command: Command = {
  name: "doctor",
  summary: "Deep health dashboard: coverage, connectivity, centrality",
  group: "Quality",
  usage: "atlas doctor [--map <id>] [--json]",
  run,
};
export default command;
