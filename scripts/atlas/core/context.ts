/**
 * Command context + the shared map-loading path. Every command receives a Ctx
 * (resolved workspace, parsed flags, positionals) and most call `loadMaps` to get
 * validated CliMaps. `loadMaps` is strict: a schema failure throws CliError
 * pointing at `atlas validate`, so individual commands never operate on a map
 * the schema would reject.
 */
import { SourceGraphSchema } from "../../../src/data/sourceSchema";
import { resolveWorkspace, type Workspace } from "./workspace";
import { listSourceFiles, filterByMap, type SourceFile } from "./loadSources";
import { buildCliMap, type CliMap } from "./model";

export type FlagValue = string | boolean;

export interface Ctx {
  ws: Workspace;
  /** Args after the command (and subcommand, if the command consumes one). */
  positionals: string[];
  flags: Record<string, FlagValue>;
  json: boolean;
  mapFilter?: string;
  verbose: boolean;
  quiet: boolean;
}

/** A user-facing error: printed cleanly, no stack trace. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function createContext(positionals: string[], flags: Record<string, FlagValue>): Ctx {
  return {
    ws: resolveWorkspace(),
    positionals,
    flags,
    json: flags.json === true,
    mapFilter: typeof flags.map === "string" ? flags.map : undefined,
    verbose: flags.verbose === true || flags.v === true,
    quiet: flags.quiet === true || flags.q === true,
  };
}

export function flag(ctx: Ctx, name: string, short?: string): FlagValue | undefined {
  if (name in ctx.flags) return ctx.flags[name];
  if (short && short in ctx.flags) return ctx.flags[short];
  return undefined;
}

export function stringFlag(ctx: Ctx, name: string, short?: string): string | undefined {
  const v = flag(ctx, name, short);
  return typeof v === "string" ? v : undefined;
}

/** Raw source files (filtered by --map), for validate/format which need text. */
export function loadSourceFiles(ctx: Ctx): SourceFile[] {
  return filterByMap(listSourceFiles(ctx.ws), ctx.mapFilter);
}

/** Validated CliMaps (filtered by --map). Throws CliError on schema failure. */
export function loadMaps(ctx: Ctx): CliMap[] {
  const files = loadSourceFiles(ctx);
  const maps: CliMap[] = [];
  for (const f of files) {
    if (f.jsonError) {
      throw new CliError(`${f.fileName}: malformed JSON — ${f.jsonError.message}`, "run `atlas validate` for details");
    }
    const parsed = SourceGraphSchema.safeParse(f.json);
    if (!parsed.success) {
      throw new CliError(
        `${f.fileName}: failed schema validation (${parsed.error.issues.length} issue(s))`,
        "run `atlas validate` to see the diagnostics",
      );
    }
    maps.push(buildCliMap(parsed.data, f.raw, f.fileName));
  }
  return maps;
}
