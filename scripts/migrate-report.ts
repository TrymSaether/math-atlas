/**
 * migrate-maps — convert the legacy FieldJson maps to the new source schema.
 *
 * Default is a dry-run report (writes nothing): which `kind`s/relations remap,
 * which authored fields are dropped, and whether the result passes the strict
 * SourceGraphSchema. Pass --write to emit <id>.source.json next to each map.
 *
 *   npx tsx scripts/migrate-report.ts            report only
 *   npx tsx scripts/migrate-report.ts --write    write *.source.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SourceGraphSchema } from "../src/data/sourceSchema";
import type { AuthorableRelation } from "../src/data/relations";

const MAPS_DIR = fileURLToPath(new URL("../src/data/maps", import.meta.url));
const FILES = ["topology.json", "fourier_analysis.json", "functional_analysis.json"];
const write = process.argv.includes("--write");

// ── mapping tables (judgment calls; this is what the report surfaces) ──
// Kinds pass through unchanged (KIND_VALUES is the full observed set); only
// truly unknown kinds fall back to "object".
const KNOWN_KINDS = new Set([
  "object","definition","theorem","lemma","proposition","corollary","example",
  "counterexample","non_example","construction","property","proof","proof_method",
  "proof_step","exercise","axiom","structure","application","notation","conjecture",
  "assumption","method","operator",
]);
const mapKind = (k: string) => (KNOWN_KINDS.has(k) ? k : "object");

// relation → {to: authorable, swap: emit with source/target swapped}
const REL_MAP: Record<string, { to: AuthorableRelation; swap: boolean } | null> = {
  requires: { to: "uses", swap: false },
  uses: { to: "uses", swap: false },
  assumes: { to: "assumes", swap: false },
  constructed_from: { to: "constructed_from", swap: false },
  generalizes: { to: "generalizes", swap: false },
  see_also: { to: "related_to", swap: false },
  equivalent_to: { to: "related_to", swap: false },
  proves: { to: "proves", swap: false },
  has_property: { to: "satisfies", swap: false },
  violates_assumption: { to: "violates", swap: false },
  // swaps (current direction is the inverse of an authorable relation):
  prerequisite_for: { to: "uses", swap: true },
  subtype_of: { to: "generalizes", swap: true },
  instance_of: { to: "generalizes", swap: true },
  specializes: { to: "generalizes", swap: true },
  motivates: { to: "motivated_by", swap: true },
  defines: { to: "defined_in_terms_of", swap: true },
  introduces: { to: "motivated_by", swap: true },
  // fuzzy relations — decided mappings:
  induces: { to: "constructed_from", swap: true },
  has_example: { to: "generalizes", swap: false },
  implies: { to: "uses", swap: true },
  applied_to: { to: "uses", swap: false },
  has_counterexample: { to: "related_to", swap: false },
  shows_necessity_of: { to: "related_to", swap: false },
};
const FUZZY_RELS = new Set(["induces","has_example","has_counterexample","implies","applied_to","shows_necessity_of"]);
const DEP_MAP: Record<string, AuthorableRelation> = {
  logical_dependency: "uses", definitional_dependency: "defined_in_terms_of",
  pedagogical_dependency: "motivated_by", assumption_dependency: "assumes",
  construction_dependency: "constructed_from", notation_dependency: "uses",
};
// Item-level relation arrays (lists of concept ids) → edges from this item.
const ITEM_REL_MAP: Record<string, AuthorableRelation> = {
  related: "related_to", related_concepts: "related_to", related_theorems: "related_to",
  demonstrates: "related_to", satisfies: "satisfies", violates: "violates",
  proves: "proves",
};
const PALETTE = ["blue","green","purple","red","teal","orange","pink","gold"] as const;
// Fields the source schema carries; everything else on an item is dropped.
const CARRIED = new Set([
  "id","kind","domain","label","statement","definition","formal_statement","intuition","gloss",
  "notation","examples","example","diagram_path","assumptions","proof","proof_steps","solution",
  "solution_steps","book_refs","ref","chapter","metadata","dependencies","outgoing_relations","proof_dependencies",
  "related","related_concepts","related_theorems","demonstrates","satisfies","violates","proves","formula",
]);

function bump(m: Map<string, number>, k: string, n = 1) { m.set(k, (m.get(k) ?? 0) + n); }

function priority(p: string | undefined): "core" | "standard" | "peripheral" {
  if (p === "core") return "core";
  if (p === "support" || p === "low") return "peripheral";
  return "standard";
}

interface Tally {
  kindRemap: Map<string, number>;
  droppedFields: Map<string, number>;
  cleanRel: number; swapRel: number; fuzzyRel: number; depEdges: number; itemRelEdges: number;
}

function convert(raw: any, t: Tally) {
  const g = raw.graph;
  const domains = [...g.domains]
    .sort((a: any, b: any) => a.order - b.order)
    .map((d: any, i: number) => ({
      id: d.id, label: d.label, order: i,
      palette: PALETTE.includes(d.palette) ? d.palette : PALETTE[i % PALETTE.length],
    }));

  const conceptIds = new Set(g.items.map((it: any) => it.id));
  const concepts = g.items.map((it: any) => {
    for (const k of Object.keys(it)) if (!CARRIED.has(k)) bump(t.droppedFields, k);
    if (!KNOWN_KINDS.has(it.kind)) bump(t.kindRemap, `${it.kind} → object`);
    const notation = it.notation == null ? [] : Array.isArray(it.notation) ? it.notation : [it.notation];
    const content: Record<string, unknown> = { notation: notation.filter(Boolean) };
    if (it.statement) content.statement = it.statement;
    if (it.definition) content.definition = it.definition;
    if (it.formal_statement) content.formal = it.formal_statement;
    if (it.formula) content.formula = it.formula;
    if (it.intuition) content.intuition = it.intuition;
    if (it.gloss) content.gloss = it.gloss;
    const toSteps = (arr: any[], fallback?: string) => {
      const steps = (arr ?? [])
        .map((s: any) => ({
          role: ["setup","claim","calculation","case","argument","conclusion","remark"].includes(s.role) ? s.role : "argument",
          content: (s.content ?? "").trim(),
          uses: (s.depends_on ?? []).filter((u: string) => conceptIds.has(u)),
        }))
        .filter((s: any) => s.content);
      if (steps.length === 0 && fallback?.trim())
        return [{ role: "argument", content: fallback.trim(), uses: [] }];
      return steps;
    };
    const proofSteps = toSteps(it.proof_steps, it.proof);
    const solutionSteps = toSteps(it.solution_steps, it.solution);
    const assumptions = (it.assumptions ?? []).map((a: string) => (a ?? "").trim()).filter(Boolean);
    const references = (it.book_refs ?? []).map((r: string) => (r ?? "").trim()).filter(Boolean);
    const source: Record<string, unknown> = {};
    if (it.metadata?.source) source.citation = it.metadata.source;
    if (it.chapter) source.chapter = String(it.chapter);
    if (it.ref) source.ref = it.ref;
    if (references.length) source.references = references;
    return {
      id: it.id, kind: mapKind(it.kind), domain: it.domain, label: it.label,
      content,
      examples: it.example ? [{ tex: it.example }] : [],
      ...(it.diagram_path ? { diagram: it.diagram_path } : {}),
      assumptions,
      ...(proofSteps.length ? { proof: { steps: proofSteps } } : {}),
      ...(solutionSteps.length ? { solution: { steps: solutionSteps } } : {}),
      ...(Object.keys(source).length ? { source } : {}),
      tags: it.metadata?.tags ?? [],
      priority: priority(it.metadata?.syllabus_priority),
    };
  });

  // edges: explicit edges + expand item.dependencies, then dedupe semantically.
  const seen = new Set<string>();
  const edges: any[] = [];
  const push = (source: string, target: string, relation: AuthorableRelation) => {
    if (!conceptIds.has(source) || !conceptIds.has(target) || source === target) return;
    const key = `${source} ${target} ${relation}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target, relation });
  };
  for (const e of g.edges ?? []) {
    const m = REL_MAP[e.type];
    if (!m) continue;
    if (FUZZY_RELS.has(e.type)) t.fuzzyRel++; else if (m.swap) t.swapRel++; else t.cleanRel++;
    if (m.swap) push(e.target, e.source, m.to); else push(e.source, e.target, m.to);
  }
  for (const it of g.items) {
    for (const [cls, ids] of Object.entries(it.dependencies ?? {})) {
      const rel = DEP_MAP[cls];
      if (!rel) continue;
      for (const dep of ids as string[]) { t.depEdges++; push(it.id, dep, rel); }
    }
    for (const [field, rel] of Object.entries(ITEM_REL_MAP)) {
      const raw = it[field];
      const targets = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
      for (const target of targets as string[]) { t.itemRelEdges++; push(it.id, target, rel); }
    }
  }

  return {
    id: g.id, label: g.label, field: g.field || g.id, version: 1, updated: "2026-06-09",
    domains, concepts, edges,
  };
}

function top(m: Map<string, number>, n = 12): string {
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([k, v]) => `      ${String(v).padStart(4)}  ${k}`).join("\n");
}

for (const file of FILES) {
  const raw = JSON.parse(readFileSync(join(MAPS_DIR, file), "utf8"));
  const t: Tally = { kindRemap: new Map(), droppedFields: new Map(), cleanRel: 0, swapRel: 0, fuzzyRel: 0, depEdges: 0, itemRelEdges: 0 };
  const src = convert(raw, t);
  const parsed = SourceGraphSchema.safeParse(src);

  console.log(`\n══════════ ${file} ══════════`);
  console.log(`  concepts: ${src.concepts.length} (from ${raw.graph.items.length} items)`);
  console.log(`  edges:    ${src.edges.length} after dedupe  ` +
    `(explicit: clean ${t.cleanRel}, swapped ${t.swapRel}, fuzzy ${t.fuzzyRel}; ` +
    `dependency-expanded ${t.depEdges}; item-relation-expanded ${t.itemRelEdges})`);
  console.log(`  kind remaps needed (kind not in enum):\n${top(t.kindRemap)}`);
  console.log(`  authored fields DROPPED (count = items carrying them):\n${top(t.droppedFields)}`);
  console.log(`  strict schema: ${parsed.success ? "✓ PASSES" : `✗ FAILS — ${parsed.error.issues.length} issues`}`);
  if (!parsed.success) {
    const byMsg = new Map<string, number>();
    for (const i of parsed.error.issues) bump(byMsg, i.message.replace(/: .*/, ""));
    console.log(top(byMsg, 8));
  }
  if (write && parsed.success) {
    const out = join(MAPS_DIR, file.replace(/\.json$/, ".source.json"));
    writeFileSync(out, JSON.stringify(parsed.data, null, 2) + "\n");
    console.log(`  → wrote ${file.replace(/\.json$/, ".source.json")}`);
  }
}
console.log(write ? "\n(*.source.json written)" : "\n(report only — no files written)");
