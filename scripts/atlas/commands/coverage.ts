/**
 * `atlas coverage` — per-domain completeness matrix. Each domain is scored on the
 * facets that make a concept useful: a body (definition/statement), a proof where
 * one is expected, examples, diagrams, intuition, and notation. Percentages are
 * colour-banded so gaps jump out.
 */
import type { Command } from "../core/command";
import { loadMaps, type Ctx } from "../core/context";
import type { CliMap } from "../core/model";
import { categoryOf } from "../../../src/lib/nodeCategory";
import { table } from "../reporters/table";
import { bold, dim, cyan, gray, green, yellow, red } from "../utils/color";
import { pct, padStart } from "../utils/text";

const FACETS = ["body", "proof", "examples", "diagram", "intuition", "notation"] as const;
type Facet = (typeof FACETS)[number];

function has(node: CliMap["nodes"][number], key: string): boolean {
  const v = (node.content as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim().length > 0;
}

/** Numerator/denominator for a facet over a set of nodes. */
function score(nodes: CliMap["nodes"], facet: Facet): [number, number] {
  switch (facet) {
    case "body": {
      const den = nodes.filter((n) =>
        ["definition", "theorem", "structure", "construction"].includes(categoryOf(n.kind)),
      );
      return [
        den.filter((n) => has(n, "definition") || has(n, "statement") || has(n, "formal")).length,
        den.length,
      ];
    }
    case "proof": {
      const den = nodes.filter((n) => categoryOf(n.kind) === "theorem");
      return [den.filter((n) => !!n.proof).length, den.length];
    }
    case "examples":
      return [nodes.filter((n) => n.examples.length > 0).length, nodes.length];
    case "diagram":
      return [nodes.filter((n) => !!n.diagram).length, nodes.length];
    case "intuition":
      return [nodes.filter((n) => has(n, "intuition")).length, nodes.length];
    case "notation":
      return [nodes.filter((n) => (n.content.notation ?? []).length > 0).length, nodes.length];
  }
}

function band(p: number): (s: string) => string {
  return p >= 75 ? green : p >= 40 ? yellow : red;
}

function cell([num, den]: [number, number]): string {
  if (den === 0) return gray("  —");
  const p = pct(num, den);
  return band(p)(padStart(`${p}%`, 4));
}

function renderMap(map: CliMap): void {
  process.stdout.write("\n" + bold(cyan(map.label)) + dim(`  ${map.id}`) + "\n\n");

  const rows = map.domainsByOrder.map((d) => {
    const nodes = map.nodes.filter((n) => n.domain === d.id);
    return [
      d.label,
      padStart(String(nodes.length), 4),
      ...FACETS.map((f) => cell(score(nodes, f))),
    ];
  });
  // Overall row across the whole map.
  rows.push([
    bold("ALL"),
    bold(padStart(String(map.nodes.length), 4)),
    ...FACETS.map((f) => cell(score(map.nodes, f))),
  ]);

  process.stdout.write(
    indent(
      table(
        [
          { header: "domain" },
          { header: "n", align: "right" },
          ...FACETS.map((f) => ({ header: f, align: "right" as const })),
        ],
        rows,
      ),
    ) + "\n",
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
        maps.map((m) => ({
          id: m.id,
          domains: m.domainsByOrder.map((d) => {
            const nodes = m.nodes.filter((n) => n.domain === d.id);
            return {
              domain: d.id,
              n: nodes.length,
              ...Object.fromEntries(FACETS.map((f) => [f, pct(...score(nodes, f))])),
            };
          }),
        })),
        null,
        2,
      ) + "\n",
    );
    return 0;
  }
  process.stdout.write("\n" + bold("atlas coverage") + gray(`  ·  ${maps.length} map(s)`) + "\n");
  for (const m of maps) renderMap(m);
  process.stdout.write("\n");
  return 0;
}

const command: Command = {
  name: "coverage",
  summary: "Per-domain completeness matrix across content facets",
  group: "Quality",
  usage: "atlas coverage [--map <id>] [--json]",
  run,
};
export default command;
