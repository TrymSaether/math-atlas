/**
 * `atlas route <goal>` — build a study path. Walks the dependency DAG to produce
 * a foundations-first ordering of everything the target rests on, ending at the
 * target itself. `--from <id>` prunes what you already know (its prereqs);
 * `--to <id>` overrides the destination so `route a --to b` plans a→…→b.
 */
import type { Command } from "../core/command";
import { loadMaps, CliError, stringFlag, type Ctx } from "../core/context";
import { findConcept, type CliMap } from "../core/model";
import { prerequisiteChain } from "../graph/algorithms";
import { bold, dim, cyan, gray, green } from "../utils/color";
import { kindGlyph, MARK } from "../utils/glyphs";
import { padStart } from "../utils/text";

function step(map: CliMap, id: string, i: number): string {
  const n = map.nodeById.get(id)!;
  return (
    "  " +
    gray(padStart(String(i), 3)) +
    "  " +
    kindGlyph(n.kind) +
    " " +
    cyan(n.id) +
    dim(`  — ${n.label}`) +
    gray(`  d${n.depth}`)
  );
}

function run(ctx: Ctx): number {
  const goal = ctx.positionals[0];
  if (!goal) throw new CliError("usage: atlas route <goal> [--from <id>] [--to <id>]");

  const maps = loadMaps(ctx);
  const target = stringFlag(ctx, "to") ?? goal;
  const found = findConcept(maps, target);
  if (!found) throw new CliError(`concept '${target}' not found`);
  const { map } = found;

  // Foundations-first prerequisites, then the target last.
  let path = [...prerequisiteChain(map, target), target];

  // Prune what `--from` (and its prerequisites) already covers.
  const from = stringFlag(ctx, "from");
  if (from) {
    if (!map.nodeById.has(from)) throw new CliError(`concept '${from}' not found in ${map.id}`);
    const known = new Set([from, ...prerequisiteChain(map, from)]);
    path = path.filter((id) => !known.has(id) || id === target);
  }

  if (ctx.json) {
    process.stdout.write(JSON.stringify({ target, map: map.id, path }, null, 2) + "\n");
    return 0;
  }

  process.stdout.write(
    "\n" +
      bold("Study path") +
      dim(`  →  ${target}`) +
      (from ? dim(`   (from ${from})`) : "") +
      "\n" +
      gray(`  ${map.label}  ·  ${path.length} step(s)`) +
      "\n\n",
  );
  if (path.length === 1) {
    process.stdout.write(green(`  ${MARK.ok} ${target} is foundational — nothing to learn first`) + "\n\n");
    return 0;
  }
  path.forEach((id, i) => process.stdout.write(step(map, id, i + 1) + "\n"));
  process.stdout.write("\n" + dim("  tip: ") + cyan(`atlas explain ${target}`) + dim(" for the full card") + "\n\n");
  return 0;
}

const command: Command = {
  name: "route",
  summary: "Build a foundations-first study path to a concept",
  group: "Graph",
  usage: "atlas route <goal> [--from <id>] [--to <id>] [--map <id>]",
  help: [
    dim("  --from <id>   prune concepts you already know"),
    dim("  --to <id>     destination concept (defaults to <goal>)"),
  ],
  run,
};
export default command;
