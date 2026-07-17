/**
 * `atlas stats` — quantitative shape of each map: totals, per-domain and
 * per-kind breakdowns, edge/relation counts, density, average dependencies, and
 * the longest prerequisite chain. Rendered as tables + bar charts.
 */
import type { Command } from "../core/command.ts";
import { loadMaps, type Ctx } from "../core/context.ts";
import type { CliMap } from "../core/model.ts";
import { topoSort } from "../graph/algorithms.ts";
import { table } from "../reporters/table.ts";
import { barRow } from "../reporters/bars.ts";
import { swatch } from "../utils/color.ts";
import { bold, dim, cyan, gray } from "../utils/color.ts";
import { kindGlyph } from "../utils/glyphs.ts";
import { padStart } from "../utils/text.ts";

function mapStats(map: CliMap): Record<string, number | string> {
  const n = map.nodes.length;
  const e = map.edges.length;
  const totalDeg = map.nodes.reduce((s, x) => s + x.degree, 0);
  const avgDeg = n ? totalDeg / n / 1 : 0;
  const avgPrereq = n ? map.nodes.reduce((s, x) => s + (map.prereqsOf.get(x.id)?.length ?? 0), 0) / n : 0;
  const maxDepth = map.nodes.reduce((m, x) => Math.max(m, x.depth), 0);
  const { hasCycle } = topoSort(map);
  return {
    concepts: n,
    edges: e,
    density: Number(avgDeg.toFixed(2)),
    avgPrereq: Number(avgPrereq.toFixed(2)),
    maxDepth,
    acyclic: hasCycle ? "no" : "yes",
  };
}

function renderMap(map: CliMap): void {
  const s = mapStats(map);
  process.stdout.write("\n" + bold(cyan(map.label)) + dim(`  ${map.id}  v${map.version}`) + "\n");

  // Headline numbers.
  process.stdout.write(
    "  " +
      [
        `${bold(String(s.concepts))} concepts`,
        `${bold(String(s.edges))} edges`,
        `${bold(String(s.maxDepth))} max depth`,
        `${bold(String(s.avgPrereq))} avg prereqs`,
        `acyclic: ${s.acyclic === "yes" ? cyan("yes") : "no"}`,
      ].join(dim("  ·  ")) +
      "\n",
  );

  // Per-domain.
  const maxDomain = Math.max(...map.domainsByOrder.map((d) => map.nodes.filter((n) => n.domain === d.id).length));
  process.stdout.write("\n  " + bold("By domain") + "\n");
  for (const d of map.domainsByOrder) {
    const count = map.nodes.filter((n) => n.domain === d.id).length;
    process.stdout.write(
      "  " + swatch(d.palette) + " " + barRow(d.label, count, maxDomain, { labelWidth: 22, barWidth: 24 }) + "\n",
    );
  }

  // Per-kind.
  const kinds = new Map<string, number>();
  for (const n of map.nodes) kinds.set(n.kind, (kinds.get(n.kind) ?? 0) + 1);
  const kindRows = [...kinds.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => [`${kindGlyph(k)} ${k}`, padStart(String(c), 4)]);
  process.stdout.write("\n  " + bold("By kind") + "\n");
  process.stdout.write(indent(table([{ header: "kind" }, { header: "count", align: "right" }], kindRows)) + "\n");

  // Per-relation.
  const rels = new Map<string, number>();
  for (const e of map.edges) rels.set(e.relation, (rels.get(e.relation) ?? 0) + 1);
  const relRows = [...rels.entries()].sort((a, b) => b[1] - a[1]).map(([r, c]) => [r, padStart(String(c), 4)]);
  process.stdout.write("\n  " + bold("By relation") + "\n");
  process.stdout.write(indent(table([{ header: "relation" }, { header: "count", align: "right" }], relRows)) + "\n");
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
    const payload = maps.map((m) => ({ id: m.id, ...mapStats(m) }));
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return 0;
  }
  process.stdout.write("\n" + bold("atlas stats") + gray(`  ·  ${maps.length} map(s)`) + "\n");
  for (const m of maps) renderMap(m);
  process.stdout.write("\n");
  return 0;
}

const command: Command = {
  name: "stats",
  summary: "Totals, per-domain/kind/relation breakdowns, density, depth",
  group: "Inspect",
  usage: "atlas stats [--map <id>] [--json]",
  run,
};
export default command;
