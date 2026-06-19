/**
 * `atlas graph <sub>` — the graph engine. Subcommands:
 *   show <id>   incoming/outgoing edges as a tree
 *   path a b    shortest connection between two concepts
 *   chain <id>  full prerequisite chain (dependency DAG)
 *   orphans     concepts with no edges
 *   cycles      dependency cycles (a real defect)
 *   rank        centrality ranking (--by degree|betweenness)
 *   topo        topological order of the dependency DAG
 */
import type { Command } from "../core/command";
import { loadMaps, CliError, type Ctx } from "../core/context";
import { findConcept, type CliMap } from "../core/model";
import { shortestPath, prerequisiteChain, orphans, detectCycles, topoSort, betweenness } from "../graph/algorithms";
import { edgeLabel } from "../../../src/data/relations";
import { renderTree, renderList } from "../reporters/tree";
import { table } from "../reporters/table";
import { bold, dim, cyan, gray, red, yellow, green } from "../utils/color";
import { MARK, kindGlyph } from "../utils/glyphs";
import { padStart } from "../utils/text";

function requireMap(maps: CliMap[]): CliMap {
  if (maps.length === 1) return maps[0];
  throw new CliError(`'graph' needs a single map (${maps.length} loaded)`, "pass --map <id>");
}

function label(map: CliMap, id: string): string {
  const n = map.nodeById.get(id);
  return n ? `${kindGlyph(n.kind)} ${cyan(id)} ${dim("— " + n.label)}` : cyan(id);
}

function cmdShow(map: CliMap, id: string): number {
  const node = map.nodeById.get(id);
  if (!node) throw new CliError(`concept '${id}' not found in ${map.id}`);
  const out = (map.outBy.get(id) ?? []).map((e) => ({
    label: `${dim(edgeLabel(e.relation, e.isDependency, "terse"))} ${MARK.arrow} ${label(map, e.to)}`,
  }));
  const inc = (map.inBy.get(id) ?? []).map((e) => ({
    label: `${label(map, e.from)} ${dim(edgeLabel(e.relation, e.isDependency, "terse"))} ${MARK.arrow}`,
  }));
  process.stdout.write(
    "\n" +
      renderTree({
        label: label(map, id),
        children: [
          { label: bold(`outgoing (${out.length})`), children: out },
          { label: bold(`incoming (${inc.length})`), children: inc },
        ],
      }) +
      "\n\n",
  );
  return 0;
}

function cmdPath(map: CliMap, a: string, b: string): number {
  const steps = shortestPath(map, a, b);
  if (!steps) {
    if (!map.nodeById.has(a)) throw new CliError(`concept '${a}' not found`);
    if (!map.nodeById.has(b)) throw new CliError(`concept '${b}' not found`);
    process.stdout.write("\n" + yellow(`${MARK.warning} no path between ${a} and ${b}`) + "\n\n");
    return 0;
  }
  process.stdout.write("\n" + bold(`Path ${a} → ${b}`) + dim(`  (${steps.length - 1} hops)`) + "\n\n");
  steps.forEach((s, i) => {
    if (i === 0) {
      process.stdout.write("  " + label(map, s.id) + "\n");
      return;
    }
    const rel = s.edge ? edgeLabel(s.edge.relation, s.edge.isDependency, "terse") : "";
    process.stdout.write(
      "  " + gray("  │ ") + dim(rel) + (s.forward ? " ↓" : " ↑") + "\n" + "  " + label(map, s.id) + "\n",
    );
  });
  process.stdout.write("\n");
  return 0;
}

function cmdChain(map: CliMap, id: string): number {
  if (!map.nodeById.has(id)) throw new CliError(`concept '${id}' not found in ${map.id}`);
  const chain = prerequisiteChain(map, id);
  process.stdout.write("\n" + bold(`Prerequisite chain for ${id}`) + dim(`  (${chain.length} prerequisites)`) + "\n");
  if (chain.length === 0) {
    process.stdout.write("\n  " + green(`${MARK.ok} foundational — depends on nothing`) + "\n\n");
    return 0;
  }
  // Group by depth so the layering is visible.
  process.stdout.write(
    "\n" +
      renderList(
        dim("foundations first:"),
        chain.map((c) => label(map, c)),
      ) +
      "\n\n",
  );
  return 0;
}

function cmdOrphans(map: CliMap): number {
  const list = orphans(map);
  process.stdout.write("\n" + bold(`Orphans in ${map.id}`) + dim(`  (${list.length})`) + "\n\n");
  if (!list.length) {
    process.stdout.write("  " + green(`${MARK.ok} none — every concept is connected`) + "\n\n");
    return 0;
  }
  for (const id of list) process.stdout.write("  " + label(map, id) + "\n");
  process.stdout.write("\n");
  return 0;
}

function cmdCycles(map: CliMap): number {
  const cycles = detectCycles(map);
  process.stdout.write("\n" + bold(`Cycles in ${map.id}`) + dim(`  (${cycles.length})`) + "\n\n");
  if (!cycles.length) {
    process.stdout.write("  " + green(`${MARK.ok} acyclic — dependency DAG is sound`) + "\n\n");
    return 0;
  }
  for (const cyc of cycles) {
    process.stdout.write(
      "  " +
        red(MARK.error + " ") +
        cyc.nodes.map((n) => cyan(n)).join(dim(" → ")) +
        dim(" → ") +
        cyan(cyc.nodes[0]) +
        "\n",
    );
  }
  process.stdout.write("\n");
  return 1; // cycles are defects
}

function cmdRank(map: CliMap, by: string): number {
  const top = Number(map.nodes.length);
  let rows: [string, number][];
  if (by === "betweenness") {
    const bc = betweenness(map);
    rows = [...bc.entries()].sort((a, b) => b[1] - a[1]);
  } else {
    rows = map.nodes.map((n) => [n.id, n.degree] as [string, number]).sort((a, b) => b[1] - a[1]);
  }
  const display = rows
    .slice(0, 20)
    .map(([id, v], i) => [padStart(String(i + 1), 3), label(map, id), by === "betweenness" ? v.toFixed(3) : String(v)]);
  process.stdout.write(
    "\n" +
      bold(`Centrality (${by}) — top 20 of ${top}`) +
      "\n\n" +
      table([{ header: "#", align: "right" }, { header: "concept" }, { header: by, align: "right" }], display) +
      "\n\n",
  );
  return 0;
}

function cmdTopo(map: CliMap): number {
  const { order, hasCycle } = topoSort(map);
  process.stdout.write("\n" + bold(`Topological order — ${map.id}`) + "\n\n");
  if (hasCycle) process.stdout.write("  " + yellow(`${MARK.warning} graph has a cycle; order is partial`) + "\n\n");
  order.forEach((id, i) =>
    process.stdout.write("  " + gray(padStart(String(i + 1), 4)) + "  " + label(map, id) + "\n"),
  );
  process.stdout.write("\n");
  return 0;
}

function run(ctx: Ctx): number {
  const [sub, ...rest] = ctx.positionals;
  if (!sub) throw new CliError("usage: atlas graph <show|path|chain|orphans|cycles|rank|topo>");
  const maps = loadMaps(ctx);

  // Subcommands that take a concept may auto-pick the map containing it.
  const pickByConcept = (id: string): CliMap => {
    const f = findConcept(maps, id);
    if (f) return f.map;
    return requireMap(maps);
  };

  switch (sub) {
    case "show":
      if (!rest[0]) throw new CliError("usage: atlas graph show <concept-id>");
      return cmdShow(pickByConcept(rest[0]), rest[0]);
    case "path":
      if (rest.length < 2) throw new CliError("usage: atlas graph path <a> <b>");
      return cmdPath(pickByConcept(rest[0]), rest[0], rest[1]);
    case "chain":
      if (!rest[0]) throw new CliError("usage: atlas graph chain <concept-id>");
      return cmdChain(pickByConcept(rest[0]), rest[0]);
    case "orphans":
      return cmdOrphans(requireMap(maps));
    case "cycles":
      return cmdCycles(requireMap(maps));
    case "rank":
      return cmdRank(requireMap(maps), String(ctx.flags.by ?? "degree"));
    case "topo":
      return cmdTopo(requireMap(maps));
    default:
      throw new CliError(`unknown graph subcommand '${sub}'`);
  }
}

const command: Command = {
  name: "graph",
  summary: "Inspect the graph: show, path, chain, orphans, cycles, rank, topo",
  group: "Graph",
  usage: "atlas graph <show|path|chain|orphans|cycles|rank|topo> [...] [--map <id>]",
  help: [
    dim("  show <id>     ") + "incoming/outgoing edges",
    dim("  path <a> <b>  ") + "shortest connection",
    dim("  chain <id>    ") + "prerequisite chain",
    dim("  orphans       ") + "unconnected concepts",
    dim("  cycles        ") + "dependency cycles (exit 1 if any)",
    dim("  rank --by …   ") + "degree | betweenness centrality",
    dim("  topo          ") + "topological order",
  ],
  run,
};
export default command;
