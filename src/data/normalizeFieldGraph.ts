import type { FieldJson, FieldItem, GraphData, GraphDomain, GraphEdge, GraphNode } from "../types";

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

  const nodes: GraphNode[] = input.graph.items.map((item, index) => {
    const deps = flattenDependencies(item.dependencies ?? {}).filter((id) => nodeIds.has(id));
    const source = item.metadata?.source ?? "";
    const domain = domainById.get(item.domain);
    if (!domain) throw new Error(`Item ${item.id} references missing domain ${item.domain}`);

    return {
      id: item.id,
      kind: item.kind,
      domainId: item.domain,
      number: String(index + 1),
      title: item.label,
      chapter: input.graph.label,
      section: item.metadata?.syllabus_priority ?? "",
      sectionTitle: source || input.graph.label,
      topicCluster: domain.label,
      originalText: sourceText(item),
      formalStatement: formalText(item),
      mathematicalFormula: formulaFromNotation(item),
      explanation: item.intuition ?? "",
      statementDependencies: deps,
      proofDependencies: [],
      tags: item.metadata?.tags ?? [],
      qualityFlags: [],
    };
  });

  const edges: GraphEdge[] = input.graph.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      relation: edge.type,
      source: "verified",
      confidence: confidenceToNumber(edge.confidence),
      label: edge.label ?? edge.type,
      dependencyClass: edge.dependency_class ?? "",
      notes: edge.notes ?? "",
    }));

  return {
    id: input.graph.id,
    label: input.graph.label,
    field: input.graph.field,
    domains,
    nodes,
    edges,
  };
}
