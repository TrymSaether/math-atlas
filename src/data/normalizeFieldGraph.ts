import {
  SOURCE_DEPENDS_ON_TARGET,
  type FieldJson,
  type FieldItem,
  type GraphData,
  type GraphDomain,
  type GraphEdge,
  type GraphNode,
  type ProofStep,
} from "../types";

/** Map a source step array (proof_steps / solution_steps) to internal steps. */
function toSteps(steps: FieldItem["proof_steps"]): ProofStep[] {
  return (steps ?? []).map((step) => ({
    id: step.id ?? "",
    label: step.label ?? "",
    role: step.role ?? "",
    content: step.content ?? "",
    dependsOn: step.depends_on ?? [],
  }));
}

/** Notation may be a single string or a list; normalize to a string array. */
function notationList(item: FieldItem): string[] {
  const notation = item.notation;
  if (!notation) return [];
  return (Array.isArray(notation) ? notation : [notation]).map((n) => n.trim()).filter(Boolean);
}

function confidenceToNumber(value: "high" | "medium" | "low"): number {
  if (value === "high") return 1;
  if (value === "medium") return 0.66;
  return 0.33;
}

function flattenDependencies(dependencies: Record<string, string[]>): string[] {
  return [...new Set(Object.values(dependencies).flat())];
}

function sourceText(item: FieldItem): string {
  return item.statement ?? item.definition ?? item.formal_statement ?? item.intuition ?? "";
}

function formalText(item: FieldItem): string {
  return item.formal_statement ?? "";
}

function definitionText(item: FieldItem): string {
  return item.definition ?? "";
}

function formulaText(item: FieldItem): string {
  return item.formula ?? "";
}

function formulaFromNotation(item: FieldItem): string {
  const notation = item.notation;
  if (!notation) return "";
  return Array.isArray(notation) ? notation.join(", ") : notation;
}

function hexToRgba(value: string, alpha: number): string | null {
  const match = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1];
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function normalizeDomain(domain: GraphDomain): GraphDomain {
  return {
    ...domain,
    tint: domain.tint || hexToRgba(domain.color, 0.08) || "rgba(var(--primary-rgb),0.05)",
    border: domain.border || hexToRgba(domain.color, 0.35) || "rgba(var(--primary-rgb),0.35)",
  };
}

export function normalizeFieldGraph(input: FieldJson): GraphData {
  const nodeIds = new Set(input.graph.items.map((item) => item.id));
  const domains = input.graph.domains
    .map(normalizeDomain)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));

  const dependencyIdsByItem = new Map<string, Set<string>>();
  for (const item of input.graph.items) {
    dependencyIdsByItem.set(
      item.id,
      new Set(flattenDependencies(item.dependencies ?? {}).filter((id) => nodeIds.has(id))),
    );
  }

  const normalizedEdges = input.graph.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => {
      const reverse = SOURCE_DEPENDS_ON_TARGET.has(edge.type);
      const from = reverse ? edge.target : edge.source;
      const to = reverse ? edge.source : edge.target;
      dependencyIdsByItem.get(to)?.add(from);

      return {
        id: edge.id,
        from,
        to,
        relation: edge.type,
        source: "verified" as const,
        confidence: confidenceToNumber(edge.confidence),
        label: edge.label ?? edge.type,
        dependencyClass: edge.dependency_class ?? "",
        notes: edge.notes ?? "",
      };
    });

  // Per-domain index — meaningful local ordering since source has no chapter numbering.
  const domainCounters = new Map<string, number>();
  const nodes: GraphNode[] = input.graph.items.map((item) => {
    const deps = [...(dependencyIdsByItem.get(item.id) ?? [])];
    const source = item.metadata?.source ?? "";
    const domain = domainById.get(item.domain);
    if (!domain) throw new Error(`Item ${item.id} references missing domain ${item.domain}`);

    const idx = (domainCounters.get(item.domain) ?? 0) + 1;
    domainCounters.set(item.domain, idx);

    return {
      id: item.id,
      kind: item.kind,
      domainId: item.domain,
      number: String(idx),
      title: item.label,
      chapter: item.domain,
      section: item.metadata?.syllabus_priority ?? "",
      sectionTitle: source || domain.label,
      sourceCitation: source,
      topicCluster: domain.label,
      originalText: sourceText(item),
      formalStatement: formalText(item),
      definitionText: definitionText(item),
      formulaText: formulaText(item),
      mathematicalFormula: formulaFromNotation(item),
      explanation: item.intuition ?? "",
      solution: item.solution ?? "",
      proof: item.proof ?? "",
      proofSteps: toSteps(item.proof_steps),
      solutionSteps: toSteps(item.solution_steps),
      assumptions: (item.assumptions ?? []).map((a) => a.trim()).filter(Boolean),
      notation: notationList(item),
      bookRefs: item.book_refs ?? [],
      statementDependencies: deps,
      proofDependencies: (item.proof_dependencies ?? []).filter((id) => nodeIds.has(id)),
      tags: item.metadata?.tags ?? [],
      qualityFlags: [],
      gloss: item.gloss ?? "",
      example: item.example ?? "",
      diagramPath: item.diagram_path ?? "",
      ref: item.ref ?? "",
      dictChapter: item.chapter ?? "",
      related: (item.related ?? []).filter((id) => nodeIds.has(id)),
    };
  });

  const edges: GraphEdge[] = normalizedEdges;

  return {
    id: input.graph.id,
    label: input.graph.label,
    field: input.graph.field,
    domains,
    nodes,
    edges,
  };
}
