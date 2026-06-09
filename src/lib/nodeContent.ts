import type { GraphNode } from "../types";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function distinct(value: string | undefined, seen: string[]): string {
  const normalized = clean(value);
  return normalized && !seen.includes(normalized) ? normalized : "";
}

/** First example's TeX, if any. */
function exampleText(node: GraphNode): string {
  return clean(node.examples[0]?.tex);
}

/** Lead text of a step list (proof / solution), joined for plain-text use. */
function stepsText(steps: { content: string }[] | undefined): string {
  return (steps ?? []).map((s) => s.content).join(" ").trim();
}

/**
 * Heading for a node's derivation block. Exercises carry their worked
 * answer in the same `proof` field, but read better labelled "Solution".
 */
export function proofBlockLabel(kind: string): "Proof" | "Solution" {
  return kind === "exercise" ? "Solution" : "Proof";
}

/** Readable lead text for cards, panels, dictionary entries, and search. */
export function nodeStatement(node: GraphNode): string {
  return (
    clean(node.content.statement) ||
    clean(node.content.definition) ||
    clean(node.content.formal) ||
    clean(node.content.intuition)
  );
}

/** Formal prose statement from the `formal` content field. */
export function nodeFormalStatement(node: GraphNode): string {
  return clean(node.content.formal);
}

/** Symbolic definition block from the `definition` content field. */
export function nodeDefinition(node: GraphNode, seen: string[] = []): string {
  return distinct(node.content.definition, seen);
}

export function nodeFormula(node: GraphNode, seen: string[] = []): string {
  return distinct(node.content.formula, seen);
}

export function nodeAnswerText(node: GraphNode): string {
  return (
    nodeStatement(node) ||
    clean(node.content.gloss) ||
    nodeFormalStatement(node) ||
    clean(node.content.formula) ||
    stepsText(node.proof?.steps) ||
    exampleText(node)
  );
}

export function nodeSearchText(node: GraphNode): string {
  return [
    node.label,
    node.kind,
    node.tags.join(" "),
    nodeStatement(node),
    nodeFormalStatement(node),
    nodeDefinition(node),
    nodeFormula(node),
    node.content.gloss,
    exampleText(node),
    node.content.intuition,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
