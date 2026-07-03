/**
 * build-maps — the source-map validation gate.
 *
 * Validation lives HERE, not in the browser. Any schema or integrity failure
 * exits non-zero so CI / `npm run build` blocks a broken source map from
 * shipping. Runtime maps are API/database-backed; `npm run seed:maps` copies
 * validated `*.source.json` files into the database used by the app.
 *
 * Pipeline per file:
 *   1. parse with the strict SourceGraphSchema (FK + dup + contiguity checks)
 *   2. orient edges into from→to (prereq→dependent) via the relation registry
 *   3. dedupe semantically identical edges (symmetric pairs canonicalized)
 *   4. compute degree (undirected) and depth (longest prerequisite chain)
 *   5. report the normalized graph size
 *
 * Usage:
 *   npm run check:maps           validate every *.source.json
 *   npm run seed:maps            validate + seed the API database copy
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceGraphSchema } from "@shared/maps/source";
import { buildArtifact } from "@shared/maps/build";

const MAPS_DIR = process.env.MAPS_DIR ?? fileURLToPath(new URL("../src/maps/sources", import.meta.url));

function formatIssues(file: string, error: import("zod").ZodError): string {
  const lines = error.issues.map((i) => `  ✗ ${i.path.join(".") || "(root)"}: ${i.message}`);
  return `${file}: ${error.issues.length} issue(s)\n${lines.join("\n")}`;
}

function main(): void {
  const sources = readdirSync(MAPS_DIR).filter((f) => f.endsWith(".source.json"));
  if (sources.length === 0) {
    console.error("No *.source.json files found in", MAPS_DIR);
    process.exit(1);
  }

  let failed = 0;
  for (const file of sources) {
    const raw = JSON.parse(readFileSync(join(MAPS_DIR, file), "utf8"));
    const parsed = SourceGraphSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(formatIssues(file, parsed.error));
      failed += 1;
      continue;
    }
    const { artifact, warnings } = buildArtifact(parsed.data);
    for (const w of warnings) console.warn(`  ⚠ ${file}: ${w}`);
    console.log(`  ✓ ${basename(file)}  [${artifact.nodes.length} nodes, ${artifact.edges.length} edges]`);
  }

  if (failed > 0) {
    console.error(`\n${failed} map(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\n${sources.length} map(s) OK.`);
}

main();
