/**
 * build-maps — the validation + normalization gate.
 *
 *   src/data/maps/<id>.source.json   ──►   src/data/maps/<id>.json (artifact)
 *
 * Validation lives HERE, not in the browser. Any schema or integrity failure
 * exits non-zero so CI / the prebuild blocks a broken map from shipping.
 *
 * Pipeline per file:
 *   1. parse with the strict SourceGraphSchema (FK + dup + contiguity checks)
 *   2. orient edges into from→to (prereq→dependent) via the relation registry
 *   3. dedupe semantically identical edges (symmetric pairs canonicalized)
 *   4. compute degree (undirected) and depth (longest prerequisite chain)
 *   5. emit the artifact
 *
 * Usage:
 *   npm run build:maps           build every *.source.json
 *   npm run build:maps -- --check   validate only, write nothing (for CI)
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceGraphSchema, type SourceGraph } from "../src/data/sourceSchema";
import { orientEdge, RELATIONS } from "../src/data/relations";
import {
  ARTIFACT_VERSION,
  type Artifact,
  type ArtifactEdge,
} from "../src/data/artifactSchema";

const MAPS_DIR =
  process.env.MAPS_DIR ??
  fileURLToPath(new URL("../src/data/maps", import.meta.url));
const checkOnly = process.argv.includes("--check");

function deterministicEdgeId(
  from: string,
  to: string,
  relation: string,
): string {
  return `e_${from}__${relation}__${to}`;
}

/** Longest prerequisite chain ending at each node, over dependency edges. */
function computeDepths(
  nodeIds: string[],
  depEdges: { from: string; to: string }[],
): Map<string, number> {
  const prereqs = new Map<string, string[]>(nodeIds.map((id) => [id, []]));
  for (const e of depEdges) prereqs.get(e.to)?.push(e.from); // to depends on from
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const walk = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle guard; cycles are a separate lint
    visiting.add(id);
    let best = 0;
    for (const p of prereqs.get(id) ?? []) best = Math.max(best, walk(p) + 1);
    visiting.delete(id);
    depth.set(id, best);
    return best;
  };
  for (const id of nodeIds) walk(id);
  return depth;
}

function buildArtifact(src: SourceGraph): {
  artifact: Artifact;
  warnings: string[];
} {
  const warnings: string[] = [];
  const domains = [...src.domains].sort((a, b) => a.order - b.order);

  // 2 + 3: orient and dedupe edges.
  const seen = new Set<string>();
  const edges: ArtifactEdge[] = [];
  for (const e of src.edges) {
    const { from, to, isDependency } = orientEdge(
      e.source,
      e.target,
      e.relation,
    );
    const id = e.id ?? deterministicEdgeId(from, to, e.relation);
    // Symmetric relations read the same either way, so canonicalize the pair
    // before deduping — A→B and B→A collapse to one edge.
    const [ka, kb] = RELATIONS[e.relation].symmetric
      ? [from, to].sort()
      : [from, to];
    const key = `${ka} ${kb} ${e.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      id,
      from,
      to,
      relation: e.relation,
      isDependency,
    });
  }

  // 4: degree + depth.
  const nodeIds = src.concepts.map((c) => c.id);
  const degree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  const depth = computeDepths(
    nodeIds,
    edges.filter((e) => e.isDependency),
  );

  for (const c of src.concepts) {
    if ((degree.get(c.id) ?? 0) === 0)
      warnings.push(`orphan concept (no edges): ${c.id}`);
  }

  const nodes = src.concepts.map((c) => ({
    id: c.id,
    kind: c.kind,
    domain: c.domain,
    label: c.label,
    content: c.content,
    examples: c.examples,
    diagram: c.diagram,
    assumptions: c.assumptions,
    proof: c.proof,
    source: c.source,
    tags: c.tags,
    priority: c.priority,
    degree: degree.get(c.id) ?? 0,
    depth: depth.get(c.id) ?? 0,
  }));

  return {
    artifact: {
      artifactVersion: ARTIFACT_VERSION,
      id: src.id,
      label: src.label,
      field: src.field,
      version: src.version,
      domains: domains.map((d) => ({
        id: d.id,
        label: d.label,
        order: d.order,
        palette: d.palette,
      })),
      nodes,
      edges,
    },
    warnings,
  };
}

function formatIssues(file: string, error: import("zod").ZodError): string {
  const lines = error.issues.map(
    (i) => `  ✗ ${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  return `${file}: ${error.issues.length} issue(s)\n${lines.join("\n")}`;
}

function main(): void {
  const sources = readdirSync(MAPS_DIR).filter((f) =>
    f.endsWith(".source.json"),
  );
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
    const outName = file.replace(/\.source\.json$/, ".json");
    if (!checkOnly) {
      writeFileSync(join(MAPS_DIR, outName), JSON.stringify(artifact) + "\n");
    }
    console.log(
      `  ✓ ${basename(file)} → ${checkOnly ? "(check only)" : outName}  ` +
        `[${artifact.nodes.length} nodes, ${artifact.edges.length} edges]`,
    );
  }

  if (failed > 0) {
    console.error(`\n${failed} map(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\n${sources.length} map(s) OK.`);
}

main();
