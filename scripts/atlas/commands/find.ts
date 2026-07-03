/**
 * `atlas find <query>` — fuzzy search across concept ids, labels, and gloss.
 * Shows the best matches with kind glyph, domain swatch, degree, and a one-line
 * gloss; `--related` expands the top hit with its graph neighbours.
 */
import type { Command } from "../core/command";
import { loadMaps, type Ctx } from "../core/context";
import type { CliMap } from "../core/model";
import { fuzzySearch } from "../utils/fuzzy";
import { kindGlyph } from "../utils/glyphs";
import { swatch, bold, dim, cyan, gray } from "../utils/color";
import { truncate, padEnd, texToPlain } from "../utils/text";
import { CliError } from "../core/context";
import type { ArtifactNode } from "@shared/maps/artifact";

interface Hit {
  map: CliMap;
  node: ArtifactNode;
}

function gloss(node: ArtifactNode): string {
  const c = node.content;
  const text = c.gloss ?? c.statement ?? c.definition ?? c.intuition ?? "";
  return text ? truncate(texToPlain(text), 60) : "";
}

function run(ctx: Ctx): number {
  const query = ctx.positionals.join(" ").trim();
  if (!query) throw new CliError("usage: atlas find <query>");

  const maps = loadMaps(ctx);
  const items: Hit[] = maps.flatMap((map) => map.nodes.map((node) => ({ map, node })));
  const limit = Number(ctx.flags.limit ?? 15) || 15;
  const hits = fuzzySearch(query, items, (h) => [h.node.id, h.node.label, h.node.content.gloss ?? ""]).slice(0, limit);

  if (ctx.json) {
    process.stdout.write(
      JSON.stringify(
        hits.map((h) => ({
          id: h.item.node.id,
          map: h.item.map.id,
          label: h.item.node.label,
        })),
        null,
        2,
      ) + "\n",
    );
    return 0;
  }

  process.stdout.write("\n" + bold("atlas find") + dim(`  ·  "${query}"  ·  ${hits.length} match(es)`) + "\n\n");
  if (hits.length === 0) {
    process.stdout.write(dim("  no matches\n\n"));
    return 0;
  }

  for (const h of hits) {
    const { node, map } = h.item;
    const d = map.domainById.get(node.domain);
    process.stdout.write(
      "  " +
        kindGlyph(node.kind) +
        " " +
        cyan(padEnd(node.id, 28)) +
        " " +
        (d ? swatch(d.palette) + " " : "") +
        gray(padEnd(truncate(d?.label ?? node.domain, 22), 23)) +
        dim(`deg ${node.degree}`) +
        "\n" +
        (gloss(node) ? "    " + dim(gloss(node)) + "\n" : ""),
    );
  }

  if (ctx.flags.related === true && hits[0]) {
    const top = hits[0].item;
    const neigh = [...(top.map.neighbors.get(top.node.id) ?? [])];
    process.stdout.write(
      "\n  " +
        bold("Related to ") +
        cyan(top.node.id) +
        "\n  " +
        (neigh.length ? neigh.map((id) => cyan(id)).join(dim(", ")) : dim("none")) +
        "\n",
    );
  }

  process.stdout.write("\n");
  return 0;
}

const command: Command = {
  name: "find",
  summary: "Fuzzy search concepts by id, label, or gloss",
  group: "Inspect",
  usage: "atlas find <query> [--related] [--limit N] [--map <id>]",
  run,
};
export default command;
