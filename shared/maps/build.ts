/**
 * buildArtifact — the source→artifact transform, shared by the CLI build
 * (scripts/build-maps.ts) and the in-browser authoring loop (authoring/model.ts).
 *
 * It is intentionally pure (no fs, no process): given a validated SourceGraph it
 * orients edges into the dependency DAG convention, dedupes, and computes the
 * derived `degree`/`depth` fields. Validation itself stays in the strict
 * SourceGraphSchema; this module assumes its input already parsed.
 */
import type { SourceGraph } from "./source.ts";
import { orientEdge, RELATIONS } from "./relations.ts";
import { ARTIFACT_VERSION, type Artifact, type ArtifactEdge } from "./artifact.ts";

export function deterministicEdgeId(from: string, to: string, relation: string): string {
  return `e_${from}__${relation}__${to}`;
}

/** Proof-overlay edge id — namespaced so it can never collide with an `edges` id. */
export function proofEdgeId(from: string, to: string): string {
  return `ep_${from}__uses__${to}`;
}

/** Longest prerequisite chain ending at each node, over dependency edges. */
function computeDepths(nodeIds: string[], depEdges: { from: string; to: string }[]): Map<string, number> {
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

export function buildArtifact(src: SourceGraph): {
  artifact: Artifact;
  warnings: string[];
} {
  const warnings: string[] = [];
  const domains = [...src.domains].sort((a, b) => a.order - b.order);

  // Orient + dedupe edges.
  const seen = new Set<string>();
  const edges: ArtifactEdge[] = [];
  for (const e of src.edges) {
    const { from, to, isDependency } = orientEdge(e.source, e.target, e.relation);
    const id = e.id ?? deterministicEdgeId(from, to, e.relation);
    // Symmetric relations read the same either way, so canonicalize the pair
    // before deduping — A→B and B→A collapse to one edge.
    const [ka, kb] = RELATIONS[e.relation].symmetric ? [from, to].sort() : [from, to];
    const key = `${ka} ${kb} ${e.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ id, from, to, relation: e.relation, isDependency, scope: "statement" });
  }

  // Proof-dependency overlay: each concept's proof.steps[].uses becomes a
  // scope-`proof` dependency edge `use → concept` (the used concept is a
  // prerequisite of being able to prove this one). Skip a pair that a statement
  // dependency already covers — needing Y to understand X subsumes needing Y to
  // prove X — so the overlay holds exactly the *extra* machinery a proof requires.
  const statementDepPairs = new Set<string>();
  for (const e of edges) if (e.isDependency) statementDepPairs.add(`${e.from}|${e.to}`);
  const proofEdges: ArtifactEdge[] = [];
  const seenProof = new Set<string>();
  for (const c of src.concepts) {
    const uses = new Set((c.proof?.steps ?? []).flatMap((s) => s.uses));
    for (const used of uses) {
      if (used === c.id) continue; // a proof using its own result is not a prereq
      const pairKey = `${used}|${c.id}`;
      if (statementDepPairs.has(pairKey) || seenProof.has(pairKey)) continue;
      seenProof.add(pairKey);
      proofEdges.push({
        id: proofEdgeId(used, c.id),
        from: used,
        to: c.id,
        relation: "uses",
        isDependency: true,
        scope: "proof",
      });
    }
  }

  // degree + depth.
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
    if ((degree.get(c.id) ?? 0) === 0) warnings.push(`orphan concept (no edges): ${c.id}`);
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
    properties: c.properties,
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
      proofEdges,
    },
    warnings,
  };
}
