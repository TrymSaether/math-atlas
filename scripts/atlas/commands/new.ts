/**
 * `atlas new <kind>` — scaffold a concept (or domain) into a map's source file.
 * Interactive when run in a TTY: it prompts for map / domain / label, auto-derives
 * a unique snake_case id, suggests related concepts, builds a schema-valid
 * skeleton, inserts it, and re-validates. `--dry-run` prints without writing.
 */
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { SourceGraphSchema } from "@shared/maps/source";
import { slugify, uniqueSlug } from "@/authoring/model";
import type { Command } from "../core/command";
import { loadSourceFiles, CliError, stringFlag, type Ctx } from "../core/context";
import type { SourceFile } from "../core/loadSources";
import { conceptTemplate, domainTemplate } from "../schemas/templates";
import { fuzzySearch } from "../utils/fuzzy";
import { bold, dim, cyan, green, gray } from "../utils/color";
import { MARK, kindGlyph } from "../utils/glyphs";

const KINDS = ["theorem", "definition", "proof", "construction", "example", "exercise", "lemma", "corollary", "domain"];

async function prompt(question: string, fallback?: string): Promise<string> {
  if (!process.stdin.isTTY) {
    if (fallback !== undefined) return fallback;
    throw new CliError(`non-interactive: missing value for "${question}"`, "pass it as a flag");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = fallback ? dim(` (${fallback})`) : "";
  const answer = (await rl.question(`  ${cyan("?")} ${question}${hint} `)).trim();
  rl.close();
  return answer || fallback || "";
}

function writeSource(f: SourceFile, json: unknown, dryRun: boolean): void {
  const parsed = SourceGraphSchema.safeParse(json);
  if (!parsed.success) {
    throw new CliError(
      `the scaffolded source no longer validates (${parsed.error.issues.length} issue(s))`,
      parsed.error.issues[0]?.message,
    );
  }
  const text = JSON.stringify(json, null, 2) + "\n";
  if (dryRun) {
    process.stdout.write("\n" + dim("── dry run: would write ──") + "\n");
    process.stdout.write(text.slice(0, 1200) + (text.length > 1200 ? dim("\n… (truncated)\n") : "\n"));
  } else {
    writeFileSync(f.path, text);
    process.stdout.write("\n" + green(`${MARK.ok} wrote ${f.fileName}`) + "\n");
  }
}

async function run(ctx: Ctx): Promise<number> {
  const kind = ctx.positionals[0];
  if (!kind || !KINDS.includes(kind)) {
    throw new CliError(`usage: atlas new <${KINDS.join("|")}>`, kind ? `unknown kind '${kind}'` : undefined);
  }
  const dryRun = ctx.flags["dry-run"] === true;
  const files = loadSourceFiles(ctx);

  // Pick the target map.
  const mapId =
    ctx.mapFilter ??
    (files.length === 1
      ? files[0].mapId
      : await prompt(`map? [${files.map((f) => f.mapId).join(", ")}]`, files[0]?.mapId));
  const f = files.find((x) => x.mapId === mapId);
  if (!f) throw new CliError(`unknown map '${mapId}'`);
  if (f.jsonError) throw new CliError(`${f.fileName}: malformed JSON`);
  const json = f.json as {
    domains: { id: string; label: string; order: number }[];
    concepts: { id: string; label: string }[];
    updated?: string;
  };

  process.stdout.write("\n" + bold(`atlas new ${kind}`) + dim(`  →  ${mapId}`) + "\n\n");

  if (kind === "domain") {
    const label = stringFlag(ctx, "label") ?? (await prompt("domain label?"));
    if (!label) throw new CliError("a label is required");
    const id = uniqueSlug(slugify(label), new Set(json.domains.map((d) => d.id)));
    const order = json.domains.reduce((m, d) => Math.max(m, d.order), -1) + 1;
    const palette = stringFlag(ctx, "palette") ?? "blue";
    json.domains.push(domainTemplate(id, label, order, palette));
    process.stdout.write(`  ${green(MARK.ok)} domain ${cyan(id)} ${dim(`(order ${order})`)}\n`);
    writeSource(f, json, dryRun);
    return 0;
  }

  // Concept flow.
  const label = stringFlag(ctx, "label") ?? (await prompt("label?"));
  if (!label) throw new CliError("a label is required");

  const domain =
    stringFlag(ctx, "domain") ??
    (json.domains.length === 1
      ? json.domains[0].id
      : await prompt(`domain? [${json.domains.map((d) => d.id).join(", ")}]`, json.domains[0]?.id));
  if (!json.domains.some((d) => d.id === domain)) throw new CliError(`unknown domain '${domain}' in ${mapId}`);

  const id = uniqueSlug(slugify(label), new Set(json.concepts.map((c) => c.id)));

  // Suggest related concepts by fuzzy label/id match.
  const related = fuzzySearch(label, json.concepts, (c) => [c.id, c.label])
    .slice(0, 5)
    .map((h) => h.item.id)
    .filter((cid) => cid !== id);
  if (related.length)
    process.stdout.write("  " + dim("related: ") + related.map((r) => cyan(r)).join(dim(", ")) + "\n");

  const concept = conceptTemplate(kind, id, domain, label);
  json.concepts.push(concept);
  json.updated = new Date().toISOString().slice(0, 10);

  process.stdout.write(`  ${green(MARK.ok)} ${kindGlyph(kind)} ${cyan(id)} ${gray(`(${kind} in ${domain})`)}\n`);
  writeSource(f, json, dryRun);
  process.stdout.write(dim(`  next: fill in the TODO content, then `) + cyan(`atlas validate --map ${mapId}`) + "\n\n");
  return 0;
}

const command: Command = {
  name: "new",
  summary: "Scaffold a concept or domain into a map (interactive)",
  group: "Author",
  usage: "atlas new <kind> [--map <id>] [--domain <id>] [--label <text>] [--dry-run]",
  help: [dim("  kinds: ") + KINDS.join(", "), dim("  --dry-run   print the scaffolded JSON without writing")],
  run,
};
export default command;
