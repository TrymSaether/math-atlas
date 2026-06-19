/**
 * `atlas latex <check|render>` — TeX quality tooling.
 *   check    parse every math segment with KaTeX + balance checks (codeframed)
 *   render   preview one concept's TeX as terminal-readable plain text
 * (`fix`/`normalize` are intentionally conservative and currently alias `check`
 * in report-only mode; auto-rewrites land behind an explicit --write later.)
 */
import type { Command } from "../core/command";
import { loadMaps, CliError, type Ctx } from "../core/context";
import { findConcept } from "../core/model";
import { checkLatex } from "../latex/check";
import { scanTex } from "../latex/scan";
import { reportDiagnostics } from "../diagnostics/reporter";
import { countBySeverity } from "../diagnostics/diagnostic";
import { texToPlain } from "../utils/text";
import { bold, dim, green } from "../utils/color";
import { MARK } from "../utils/glyphs";

function run(ctx: Ctx): number {
  const sub = ctx.positionals[0] ?? "check";
  const maps = loadMaps(ctx);

  if (sub === "render") {
    const id = ctx.positionals[1];
    if (!id) throw new CliError("usage: atlas latex render <concept-id>");
    const found = findConcept(maps, id);
    if (!found) throw new CliError(`concept '${id}' not found`);
    process.stdout.write("\n" + bold(`TeX preview — ${id}`) + "\n\n");
    for (const tf of scanTex(found.map).filter((t) => t.conceptId === id)) {
      process.stdout.write("  " + dim(tf.field.padEnd(18)) + texToPlain(tf.tex) + "\n");
    }
    process.stdout.write("\n");
    return 0;
  }

  if (sub !== "check" && sub !== "fix" && sub !== "normalize") {
    throw new CliError(`unknown latex subcommand '${sub}'`);
  }

  const all = maps.flatMap((m) => checkLatex(m));
  const rawByMap = new Map(maps.map((m) => [m.id, m.raw]));

  if (ctx.json) {
    process.stdout.write(JSON.stringify(all, null, 2) + "\n");
    return all.length ? 1 : 0;
  }

  process.stdout.write("\n" + bold("atlas latex check") + dim(`  ·  ${maps.length} map(s)`) + "\n");
  if (all.length === 0) {
    process.stdout.write("\n" + green(`${MARK.ok} all TeX parses cleanly`) + "\n\n");
    return 0;
  }
  reportDiagnostics(all, { rawByMap });
  if (sub !== "check")
    process.stdout.write("\n" + dim("note: auto-fix is report-only for now; edit the flagged fields by hand") + "\n");
  process.stdout.write("\n");
  return countBySeverity(all).error > 0 ? 1 : 0;
}

const command: Command = {
  name: "latex",
  summary: "Check TeX (KaTeX + balance) or render a concept's math",
  group: "Quality",
  usage: "atlas latex <check|render> [concept-id] [--map <id>] [--json]",
  help: [
    dim("  check          parse every math segment, report errors"),
    dim("  render <id>    preview a concept's TeX as plain text"),
  ],
  run,
};
export default command;
