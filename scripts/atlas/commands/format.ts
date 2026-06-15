/**
 * `atlas format` — deterministic source normaliser. Works on the *raw authored
 * JSON* (never the schema-defaulted parse) so it reorders and re-indents without
 * inventing fields the author left out. It still parses through SourceGraphSchema
 * first as a safety gate, so a malformed map is never rewritten.
 *
 * Canonical form: top-level key order, domains by `order`, concepts by
 * (domain order, label, id), edges by (relation, source, target), schema key
 * order within each object, 2-space indent. `--check` reports drift and exits 1.
 */
import { writeFileSync } from "node:fs";
import { SourceGraphSchema } from "../../../src/data/sourceSchema";
import type { Command } from "../core/command";
import { loadSourceFiles, CliError, type Ctx } from "../core/context";
import type { SourceFile } from "../core/loadSources";
import { bold, dim, cyan, green, yellow, red, gray } from "../utils/color";
import { MARK } from "../utils/glyphs";

type Obj = Record<string, unknown>;

const TOP_ORDER = ["id", "label", "field", "version", "updated", "domains", "concepts", "edges"];
const DOMAIN_ORDER = ["id", "label", "order", "palette"];
const CONCEPT_ORDER = [
  "id",
  "kind",
  "domain",
  "label",
  "content",
  "examples",
  "diagram",
  "assumptions",
  "properties",
  "proof",
  "source",
  "tags",
  "priority",
];
const CONTENT_ORDER = [
  "statement",
  "definition",
  "formal",
  "formula",
  "intuition",
  "gloss",
  "notation",
];
const EXAMPLE_ORDER = ["content", "label", "role"];
const STEP_ORDER = ["role", "content", "uses"];
const SOURCE_ORDER = ["citation", "chapter", "ref", "references"];
const EDGE_ORDER = ["id", "source", "target", "relation", "notes"];

/** Return a new object with `order` keys first (when present), then any extras. */
function orderKeys(obj: Obj, order: string[]): Obj {
  const out: Obj = {};
  for (const k of order) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}

function canonicalize(json: Obj): Obj {
  const top = orderKeys(json, TOP_ORDER);

  if (Array.isArray(top.domains)) {
    top.domains = (top.domains as Obj[])
      .map((d) => orderKeys(d, DOMAIN_ORDER))
      .sort((a, b) => Number(a.order) - Number(b.order));
  }

  const domainOrder = new Map<string, number>();
  for (const d of (top.domains as Obj[]) ?? []) domainOrder.set(String(d.id), Number(d.order));

  if (Array.isArray(top.concepts)) {
    top.concepts = (top.concepts as Obj[])
      .map((c) => {
        const out = orderKeys(c, CONCEPT_ORDER);
        if (out.content && typeof out.content === "object")
          out.content = orderKeys(out.content as Obj, CONTENT_ORDER);
        if (Array.isArray(out.examples))
          out.examples = (out.examples as Obj[]).map((e) => orderKeys(e, EXAMPLE_ORDER));
        if (out.proof && typeof out.proof === "object") {
          const proof = out.proof as Obj;
          if (Array.isArray(proof.steps))
            proof.steps = (proof.steps as Obj[]).map((s) => orderKeys(s, STEP_ORDER));
          out.proof = orderKeys(proof, ["steps"]);
        }
        if (out.source && typeof out.source === "object")
          out.source = orderKeys(out.source as Obj, SOURCE_ORDER);
        if (Array.isArray(out.tags)) out.tags = [...(out.tags as string[])].sort();
        return out;
      })
      .sort((a, b) => {
        const da = domainOrder.get(String(a.domain)) ?? 0;
        const db = domainOrder.get(String(b.domain)) ?? 0;
        if (da !== db) return da - db;
        const la = String(a.label).toLowerCase();
        const lb = String(b.label).toLowerCase();
        if (la !== lb) return la < lb ? -1 : 1;
        return String(a.id) < String(b.id) ? -1 : 1;
      });
  }

  if (Array.isArray(top.edges)) {
    top.edges = (top.edges as Obj[])
      .map((e) => orderKeys(e, EDGE_ORDER))
      .sort((a, b) => {
        const ka = `${a.relation}|${a.source}|${a.target}`;
        const kb = `${b.relation}|${b.source}|${b.target}`;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
  }

  return top;
}

function formatOne(f: SourceFile): { changed: boolean; next: string } {
  const next = JSON.stringify(canonicalize(f.json as Obj), null, 2) + "\n";
  return { changed: next !== f.raw, next };
}

function run(ctx: Ctx): number {
  const check = ctx.flags.check === true;
  const files = loadSourceFiles(ctx);
  let changed = 0;

  process.stdout.write("\n" + bold("atlas format") + dim(check ? "  ·  check only" : "") + "\n");

  for (const f of files) {
    if (f.jsonError) throw new CliError(`${f.fileName}: malformed JSON`);
    const parsed = SourceGraphSchema.safeParse(f.json);
    if (!parsed.success) {
      throw new CliError(
        `${f.fileName}: fails schema — refusing to format`,
        "run `atlas validate` first",
      );
    }
    const { changed: didChange, next } = formatOne(f);
    if (didChange) {
      changed++;
      if (!check) writeFileSync(f.path, next);
      process.stdout.write(
        `  ${(check ? yellow : green)(check ? MARK.warning : MARK.ok)} ${cyan(f.mapId)} ${dim(check ? "would reformat" : "formatted")}\n`,
      );
    } else {
      process.stdout.write(`  ${gray(MARK.ok)} ${cyan(f.mapId)} ${dim("already tidy")}\n`);
    }
  }

  if (check && changed > 0) {
    process.stdout.write("\n" + red(`${MARK.error} ${changed} file(s) need formatting`) + "\n\n");
    return 1;
  }
  process.stdout.write(
    "\n" + green(`${MARK.ok} ${changed ? `${changed} formatted` : "all tidy"}`) + "\n\n",
  );
  return 0;
}

const command: Command = {
  name: "format",
  summary: "Normalise source ordering and whitespace (deterministic)",
  group: "Author",
  usage: "atlas format [--check] [--map <id>]",
  help: [dim("  --check   report drift and exit 1, write nothing")],
  run,
};
export default command;
