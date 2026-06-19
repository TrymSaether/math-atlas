/**
 * `atlas build` — compile every `<id>.source.json` to its `<id>.json` artifact.
 *
 * Wraps the shared, pure `buildArtifact` (the same transform scripts/build-maps
 * uses) so output is byte-identical: `JSON.stringify(artifact) + "\n"`. Build is
 * incremental — a content-hash cache skips unchanged maps unless `--force`.
 *   --check   validate + report, write nothing (CI gate)
 *   --watch   rebuild on source change
 */
import { writeFileSync, existsSync, watch } from "node:fs";
import { join } from "node:path";
import { SourceGraphSchema } from "../../../src/data/sourceSchema";
import { buildArtifact } from "../../../src/data/buildArtifact";
import type { Command } from "../core/command";
import { type Ctx } from "../core/context";
import { listSourceFiles, filterByMap, type SourceFile } from "../core/loadSources";
import { loadCache, saveCache, hashSource, type CacheState } from "../core/cache";
import { bold, dim, cyan, green, red, yellow, gray } from "../utils/color";
import { MARK } from "../utils/glyphs";

interface BuildResult {
  mapId: string;
  status: "built" | "cached" | "checked" | "failed";
  nodes: number;
  edges: number;
  ms: number;
  issues?: number;
}

function buildOne(
  f: SourceFile,
  ws: Ctx["ws"],
  cache: CacheState,
  opts: { check: boolean; force: boolean },
): BuildResult {
  const start = performance.now();
  const outPath = join(ws.mapsDir, `${f.mapId}.json`);

  if (f.jsonError) {
    return {
      mapId: f.mapId,
      status: "failed",
      nodes: 0,
      edges: 0,
      ms: 0,
      issues: 1,
    };
  }
  const parsed = SourceGraphSchema.safeParse(f.json);
  if (!parsed.success) {
    return {
      mapId: f.mapId,
      status: "failed",
      nodes: 0,
      edges: 0,
      ms: performance.now() - start,
      issues: parsed.error.issues.length,
    };
  }

  const hash = hashSource(f.raw);
  const unchanged = cache[f.mapId] === hash && existsSync(outPath);
  if (!opts.check && unchanged && !opts.force) {
    const { artifact } = buildArtifact(parsed.data);
    return {
      mapId: f.mapId,
      status: "cached",
      nodes: artifact.nodes.length,
      edges: artifact.edges.length,
      ms: performance.now() - start,
    };
  }

  const { artifact } = buildArtifact(parsed.data);
  if (!opts.check) {
    writeFileSync(outPath, JSON.stringify(artifact) + "\n");
    cache[f.mapId] = hash;
  }
  return {
    mapId: f.mapId,
    status: opts.check ? "checked" : "built",
    nodes: artifact.nodes.length,
    edges: artifact.edges.length,
    ms: performance.now() - start,
  };
}

function printResult(r: BuildResult): void {
  const badge =
    r.status === "failed"
      ? red(`${MARK.error} failed`)
      : r.status === "cached"
        ? gray(`${MARK.ok} cached`)
        : green(`${MARK.ok} ${r.status}`);
  const detail =
    r.status === "failed"
      ? red(`${r.issues} issue(s) — run atlas validate`)
      : dim(`${r.nodes} nodes, ${r.edges} edges`);
  process.stdout.write(`  ${badge}  ${cyan(r.mapId.padEnd(22))} ${detail} ${gray(`${r.ms.toFixed(0)}ms`)}\n`);
}

function buildAll(ctx: Ctx, label = "atlas build"): number {
  const check = ctx.flags.check === true;
  const force = ctx.flags.force === true;
  const files = filterByMap(listSourceFiles(ctx.ws), ctx.mapFilter);
  const cache = loadCache(ctx.ws);

  process.stdout.write("\n" + bold(label) + dim(check ? "  ·  check only" : "") + "\n");
  const results = files.map((f) => {
    const r = buildOne(f, ctx.ws, cache, { check, force });
    printResult(r);
    return r;
  });
  if (!check) saveCache(ctx.ws, cache);

  const failed = results.filter((r) => r.status === "failed").length;
  process.stdout.write(
    "\n" +
      (failed ? red(`${MARK.error} ${failed} map(s) failed`) : green(`${MARK.ok} ${results.length} map(s) ok`)) +
      "\n\n",
  );
  return failed > 0 ? 1 : 0;
}

function run(ctx: Ctx): Promise<number> | number {
  if (ctx.flags.watch !== true) return buildAll(ctx);

  // Watch mode: initial build, then rebuild on any source change (debounced).
  buildAll(ctx, "atlas build --watch");
  process.stdout.write(yellow(`${MARK.info} watching ${ctx.ws.mapsDir} …`) + "\n");
  let timer: NodeJS.Timeout | undefined;
  watch(ctx.ws.mapsDir, (_event, filename) => {
    if (!filename || !filename.endsWith(".source.json")) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      process.stdout.write(dim(`\n↻ change in ${filename}\n`));
      buildAll(ctx, "rebuild");
      process.stdout.write(yellow(`${MARK.info} watching …`) + "\n");
    }, 120);
  });
  return new Promise<number>(() => {}); // run until killed
}

const command: Command = {
  name: "build",
  summary: "Compile sources to artifacts (incremental, --watch, --check)",
  group: "Build",
  usage: "atlas build [--check] [--watch] [--force] [--map <id>]",
  help: [
    dim("  --check   validate and report, write nothing"),
    dim("  --watch   rebuild on source change"),
    dim("  --force   ignore the incremental cache"),
  ],
  run,
};
export default command;
