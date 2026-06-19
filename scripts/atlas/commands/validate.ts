/**
 * `atlas validate` — the full diagnostic gate. Runs the strict SourceGraphSchema
 * (FK / dup / contiguity / subsumption) and, for maps that parse, the extra
 * lint passes (structure, content, diagrams, references, +suggestions). Emits
 * codeframed ERROR/WARNING/SUGGESTION and a summary; non-zero exit on any error.
 */
import { z } from "zod";
import { SourceGraphSchema } from "../../../src/data/sourceSchema";
import type { Command } from "../core/command";
import { loadSourceFiles, type Ctx } from "../core/context";
import { buildCliMap } from "../core/model";
import { runLints } from "../validators/index";
import { type Diagnostic, error, countBySeverity } from "../diagnostics/diagnostic";
import { reportDiagnostics } from "../diagnostics/reporter";
import { bold, dim, cyan } from "../utils/color";

/** Resolve the anchor concept id for a Zod issue path, when there is one. */
function anchorFor(json: unknown, path: readonly PropertyKey[]): string | undefined {
  if (path[0] === "concepts" && typeof path[1] === "number") {
    const c = (json as { concepts?: { id?: string }[] })?.concepts?.[path[1]];
    return c?.id;
  }
  if (path[0] === "edges" && typeof path[1] === "number") {
    const e = (json as { edges?: { source?: string }[] })?.edges?.[path[1]];
    return e?.source;
  }
  return undefined;
}

function issuesToDiagnostics(mapId: string, fileName: string, json: unknown, err: z.ZodError): Diagnostic[] {
  return err.issues.map((i) =>
    error({
      code: `schema/${String(i.path[0] ?? "root")}`,
      map: mapId,
      file: fileName,
      conceptId: anchorFor(json, i.path),
      path: i.path.join("."),
      message: `${i.path.join(".") || "(root)"}: ${i.message}`,
    }),
  );
}

function run(ctx: Ctx): number {
  const files = loadSourceFiles(ctx);
  const suggest = ctx.flags.suggest === true;
  const all: Diagnostic[] = [];
  const rawByMap = new Map<string, string>();

  for (const f of files) {
    rawByMap.set(f.mapId, f.raw);
    if (f.jsonError) {
      all.push(
        error({
          code: "json/parse",
          map: f.mapId,
          file: f.fileName,
          message: `malformed JSON: ${f.jsonError.message}`,
        }),
      );
      continue;
    }
    const parsed = SourceGraphSchema.safeParse(f.json);
    if (!parsed.success) {
      all.push(...issuesToDiagnostics(f.mapId, f.fileName, f.json, parsed.error));
      continue;
    }
    const map = buildCliMap(parsed.data, f.raw, f.fileName);
    all.push(...runLints(map, ctx.ws, { suggest }));
  }

  if (ctx.json) {
    process.stdout.write(JSON.stringify(all, null, 2) + "\n");
    return all.some((d) => d.severity === "error") ? 1 : 0;
  }

  process.stdout.write("\n" + bold("atlas validate") + dim(`  ·  ${files.length} map(s)`) + "\n");
  reportDiagnostics(all, { rawByMap, showSuggestions: suggest });

  const c = countBySeverity(all);
  if (!suggest && c.suggestion > 0) {
    process.stdout.write(
      dim(`\n${c.suggestion} suggestion(s) hidden — run `) +
        cyan("atlas validate --suggest") +
        dim(" to see them") +
        "\n",
    );
  }
  return c.error > 0 ? 1 : 0;
}

const command: Command = {
  name: "validate",
  summary: "Validate every map: schema, references, structure, content, diagrams",
  group: "Quality",
  usage: "atlas validate [--map <id>] [--suggest] [--json]",
  help: [
    dim("Runs the strict source schema then extra lint passes."),
    dim("Exits non-zero when any ERROR is found (CI-friendly)."),
    "",
    "  --suggest   " + dim("include senior-reviewer suggestions"),
    "  --map <id>  " + dim("validate a single map"),
    "  --json      " + dim("emit diagnostics as JSON"),
  ],
  run,
};
export default command;
