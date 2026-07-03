/**
 * `atlas explain <concept>` — a terminal study card for one concept: its
 * statement/definition, intuition, notation, what it builds on (prerequisites),
 * what depends on it, related concepts, its proof chain, and examples. TeX is
 * rendered to readable plain text.
 */
import type { Command } from "../core/command";
import { loadMaps, CliError, type Ctx } from "../core/context";
import { findConcept, type CliMap } from "../core/model";
import { kindGlyph } from "../utils/glyphs";
import { swatch, bold, dim, cyan, gray, italic } from "../utils/color";
import { texToPlain, wrap } from "../utils/text";
import { fuzzySearch } from "../utils/fuzzy";
import type { ArtifactNode } from "@/maps/artifact";

function section(title: string, body: string): void {
  process.stdout.write("\n  " + bold(title) + "\n");
  for (const line of body.split("\n")) process.stdout.write("    " + line + "\n");
}

function paragraph(tex: string, width = 86): string {
  return wrap(texToPlain(tex), width).join("\n");
}

function nameOf(map: CliMap, id: string): string {
  return map.nodeById.get(id)?.label ?? id;
}

function run(ctx: Ctx): number {
  const id = ctx.positionals[0];
  if (!id) throw new CliError("usage: atlas explain <concept-id>");

  const maps = loadMaps(ctx);
  const found = findConcept(maps, id);
  if (!found) {
    const near = fuzzySearch(
      id,
      maps.flatMap((m) => m.nodes),
      (n) => [n.id, n.label],
    )
      .slice(0, 3)
      .map((h) => h.item.id);
    throw new CliError(`concept '${id}' not found`, near.length ? `did you mean: ${near.join(", ")}` : undefined);
  }
  const { map, node } = found;
  const c = node.content;

  if (ctx.json) {
    process.stdout.write(JSON.stringify(node, null, 2) + "\n");
    return 0;
  }

  const d = map.domainById.get(node.domain);
  process.stdout.write(
    "\n  " +
      kindGlyph(node.kind) +
      " " +
      bold(cyan(node.label)) +
      "  " +
      gray(`${node.kind}`) +
      "\n  " +
      (d ? swatch(d.palette) + " " + dim(d.label) + dim("  ·  ") : "") +
      dim(`${map.id}  ·  depth ${node.depth}  ·  degree ${node.degree}  ·  ${node.priority}`) +
      "\n",
  );

  if (c.statement) section("Statement", paragraph(c.statement));
  if (c.formal) section("Formal", paragraph(c.formal));
  if (c.definition) section("Definition", paragraph(c.definition));
  if (c.formula) section("Formula", paragraph(c.formula));
  if (c.intuition) section("Intuition", italic(paragraph(c.intuition)));
  if (c.notation?.length) section("Notation", c.notation.map((n) => texToPlain(n)).join("   "));

  const prereqs = map.prereqsOf.get(node.id) ?? [];
  if (prereqs.length) section("Builds on", prereqs.map((p) => `${cyan(p)} ${dim("— " + nameOf(map, p))}`).join("\n"));

  const deps = map.dependentsOf.get(node.id) ?? [];
  if (deps.length)
    section(
      "Used by",
      deps
        .slice(0, 12)
        .map((p) => `${cyan(p)} ${dim("— " + nameOf(map, p))}`)
        .join("\n") + (deps.length > 12 ? dim(`\n… +${deps.length - 12} more`) : ""),
    );

  const related = [...(map.neighbors.get(node.id) ?? [])].filter((n) => !prereqs.includes(n) && !deps.includes(n));
  if (related.length) section("Related", related.map((r) => cyan(r)).join(dim(", ")));

  if (node.proof?.steps.length) {
    process.stdout.write("\n  " + bold("Proof") + "\n");
    node.proof.steps.forEach((s, i) => {
      process.stdout.write(
        "    " +
          gray(`${i + 1}.`) +
          " " +
          dim(`[${s.role}]`) +
          " " +
          paragraph(s.content, 80).split("\n").join("\n       ") +
          "\n",
      );
    });
  }

  if (node.examples?.length) {
    process.stdout.write("\n  " + bold("Examples") + "\n");
    for (const ex of node.examples as ArtifactNode["examples"]) {
      process.stdout.write("    " + (ex.label ? cyan(ex.label) + ": " : "") + dim(texToPlain(ex.content)) + "\n");
    }
  }

  process.stdout.write("\n");
  return 0;
}

const command: Command = {
  name: "explain",
  summary: "Terminal study card for one concept",
  group: "Inspect",
  usage: "atlas explain <concept-id> [--map <id>]",
  run,
};
export default command;
