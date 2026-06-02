import type { GraphNode } from "../types";

function clean(value: string): string {
  return value.trim();
}

function distinct(value: string, seen: string[]): string {
  const normalized = clean(value);
  return normalized && !seen.includes(normalized) ? normalized : "";
}

/** Readable lead text for cards, panels, dictionary entries, and search. */
export function nodeStatement(node: GraphNode): string {
  return clean(node.originalText) || clean(node.definitionText) || clean(node.formalStatement) || clean(node.explanation);
}

/** Formal prose statement from the raw `formal_statement` field. */
export function nodeFormalStatement(node: GraphNode): string {
  return clean(node.formalStatement);
}

/** Symbolic definition block from the raw `definition` field, when available. */
export function nodeDefinition(node: GraphNode, seen: string[] = []): string {
  return distinct(node.definitionText, seen);
}

export function nodeFormula(node: GraphNode, seen: string[] = []): string {
  return distinct(node.formulaText, seen);
}

export function nodeAnswerText(node: GraphNode): string {
  return (
    nodeStatement(node) ||
    clean(node.gloss) ||
    nodeFormalStatement(node) ||
    clean(node.formulaText) ||
    clean(node.solution) ||
    clean(node.proof) ||
    clean(node.example)
  );
}

export function nodeSearchText(node: GraphNode): string {
  return [
    node.title,
    node.kind,
    node.tags.join(" "),
    nodeStatement(node),
    nodeFormalStatement(node),
    nodeDefinition(node),
    nodeFormula(node),
    node.gloss,
    node.example,
    node.explanation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
