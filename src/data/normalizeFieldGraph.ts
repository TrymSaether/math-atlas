import type { FieldJson, FieldItem, GraphData, GraphEdge, GraphNode } from "../types";

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

const TOPIC_ALIASES: Record<string, string> = {
  topology: "Foundations",
  sets: "Foundations",
  basis: "Foundations",
  "open-sets": "Foundations",
  "closed-sets": "Foundations",
  metric: "Foundations",
  maps: "Continuity",
  continuity: "Continuity",
  connectedness: "Connectedness",
  paths: "Connectedness",
  compactness: "Compactness",
  homotopy: "Homotopy",
  groups: "Fundamental Group",
  "fundamental-group": "Fundamental Group",
  covering: "Covering Spaces",
  "covering-spaces": "Covering Spaces",
  example: "Examples",
  examples: "Examples",
};

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function topicFor(item: FieldItem): string {
  const tags = item.metadata?.tags ?? [];
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase());
  for (const tag of normalizedTags) {
    if (TOPIC_ALIASES[tag]) return TOPIC_ALIASES[tag];
  }
  const first = tags[0];
  if (first) return titleCase(first);
  return titleCase(item.metadata?.syllabus_priority ?? item.kind);
}

function formulaFromNotation(item: FieldItem): string {
  const notation = item.notation;
  if (!notation) return "";
  return Array.isArray(notation) ? notation.join(", ") : notation;
}

export function normalizeFieldGraph(input: FieldJson): GraphData {
  const nodeIds = new Set(input.graph.items.map((item) => item.id));

  const nodes: GraphNode[] = input.graph.items.map((item, index) => {
    const deps = flattenDependencies(item.dependencies ?? {}).filter((id) => nodeIds.has(id));
    const source = item.metadata?.source ?? "";

    return {
      id: item.id,
      kind: item.kind,
      number: String(index + 1),
      title: item.label,
      chapter: input.graph.label,
      section: item.metadata?.syllabus_priority ?? "",
      sectionTitle: source || input.graph.label,
      topicCluster: topicFor(item),
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
    nodes,
    edges,
  };
}
