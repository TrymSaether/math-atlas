/**
 * `atlas diagram <check|missing|lint|attach>` — diagram asset tooling.
 *   check    broken refs + unreferenced assets (the diagrams validator)
 *   missing  concepts whose diagram file is absent, and concepts with none
 *   lint     SVG hygiene: viewBox, hardcoded colours, aria-label, text density
 *   attach   set a concept's diagram field to an SVG path, then re-validate
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { SourceGraphSchema } from "../../../shared/maps/source.ts";
import type { Command } from "../core/command.ts";
import { loadMaps, loadSourceFiles, CliError, type Ctx } from "../core/context.ts";
import { run as diagramLints, diagramFsPath } from "../validators/diagrams.ts";
import { reportDiagnostics } from "../diagnostics/reporter.ts";
import { type Diagnostic, warning, countBySeverity } from "../diagnostics/diagnostic.ts";
import { bold, dim, cyan, green, yellow } from "../utils/color.ts";
import { MARK } from "../utils/glyphs.ts";

function lintSvg(ws: Ctx["ws"], map: string, file: string, concept: string, ref: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  const fsPath = diagramFsPath(ws, ref);
  if (!existsSync(fsPath)) return out; // missing-file is reported by `check`
  const svg = readFileSync(fsPath, "utf8");
  const base = { code: "diagram/lint", map, file, conceptId: concept, path: ref };

  if (!/viewBox\s*=/.test(svg))
    out.push(
      warning({
        ...base,
        message: `${ref}: missing viewBox`,
        hint: "add viewBox for crisp scaling",
      }),
    );
  if (!/aria-label\s*=/.test(svg) && !/<title>/.test(svg))
    out.push(
      warning({
        ...base,
        message: `${ref}: no aria-label or <title>`,
        hint: "add an accessible label",
      }),
    );

  const hexes = svg.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  if (hexes.length > 0)
    out.push(
      warning({
        ...base,
        message: `${ref}: ${hexes.length} hardcoded colour(s) (e.g. ${hexes[0]})`,
        hint: "use currentColor or CSS vars so themes apply",
      }),
    );

  const textChars = [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].reduce(
    (n, m) => n + m[1].replace(/<[^>]+>/g, "").trim().length,
    0,
  );
  if (textChars > 240)
    out.push(
      warning({
        ...base,
        message: `${ref}: heavy text load (${textChars} chars)`,
        hint: "diagrams should show, not tell — move prose to the concept",
      }),
    );
  return out;
}

function run(ctx: Ctx): number {
  const sub = ctx.positionals[0] ?? "check";

  if (sub === "attach") {
    const [, conceptId, path] = ctx.positionals;
    if (!conceptId || !path) throw new CliError("usage: atlas diagram attach <concept-id> <svg-path>");
    const files = loadSourceFiles(ctx);
    for (const f of files) {
      const json = f.json as { concepts: { id: string; diagram?: string }[] };
      const c = json.concepts?.find((x) => x.id === conceptId);
      if (!c) continue;
      c.diagram = path;
      const parsed = SourceGraphSchema.safeParse(json);
      if (!parsed.success) throw new CliError("resulting source fails schema", parsed.error.issues[0]?.message);
      if (!existsSync(diagramFsPath(ctx.ws, path)))
        process.stdout.write(yellow(`  ${MARK.warning} note: no file yet at public${path}`) + "\n");
      writeFileSync(f.path, JSON.stringify(json, null, 2) + "\n");
      process.stdout.write(green(`\n${MARK.ok} attached ${path} to ${conceptId}\n\n`));
      return 0;
    }
    throw new CliError(`concept '${conceptId}' not found in any map`);
  }

  const maps = loadMaps(ctx);

  if (sub === "missing") {
    process.stdout.write("\n" + bold("atlas diagram missing") + "\n");
    for (const m of maps) {
      const broken = m.source.concepts.filter((c) => c.diagram && !existsSync(diagramFsPath(ctx.ws, c.diagram)));
      const none = m.source.concepts.filter((c) => !c.diagram);
      process.stdout.write(
        "\n  " +
          cyan(m.id) +
          dim(`  ·  ${broken.length} broken, ${none.length}/${m.nodes.length} without a diagram`) +
          "\n",
      );
      for (const c of broken) process.stdout.write(`    ${yellow(MARK.warning)} ${c.id} ${dim("→ " + c.diagram)}\n`);
    }
    process.stdout.write("\n");
    return 0;
  }

  if (sub === "lint") {
    const all = maps.flatMap((m) =>
      m.source.concepts.filter((c) => c.diagram).flatMap((c) => lintSvg(ctx.ws, m.id, m.fileName, c.id, c.diagram!)),
    );
    if (ctx.json) {
      process.stdout.write(JSON.stringify(all, null, 2) + "\n");
      return 0;
    }
    process.stdout.write("\n" + bold("atlas diagram lint") + "\n");
    if (!all.length) {
      process.stdout.write("\n" + green(`${MARK.ok} all referenced SVGs look healthy`) + "\n\n");
      return 0;
    }
    reportDiagnostics(all, { frames: false });
    process.stdout.write("\n");
    return 0;
  }

  if (sub === "check") {
    const all = maps.flatMap((m) => diagramLints(m, ctx.ws));
    if (ctx.json) {
      process.stdout.write(JSON.stringify(all, null, 2) + "\n");
      return countBySeverity(all).error > 0 ? 1 : 0;
    }
    process.stdout.write("\n" + bold("atlas diagram check") + "\n");
    if (!all.length) {
      process.stdout.write("\n" + green(`${MARK.ok} every diagram ref resolves`) + "\n\n");
      return 0;
    }
    reportDiagnostics(all, { frames: false });
    process.stdout.write("\n");
    return 0;
  }

  throw new CliError(`unknown diagram subcommand '${sub}'`);
}

const command: Command = {
  name: "diagram",
  summary: "Diagram assets: check, missing, lint, attach",
  group: "Quality",
  usage: "atlas diagram <check|missing|lint|attach> [...] [--map <id>]",
  help: [
    dim("  check                broken refs + unreferenced assets"),
    dim("  missing              concepts lacking a (valid) diagram"),
    dim("  lint                 SVG hygiene checks"),
    dim("  attach <id> <path>   set a concept's diagram"),
  ],
  run,
};
export default command;
