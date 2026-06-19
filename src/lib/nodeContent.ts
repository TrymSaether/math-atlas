import type { GraphNode } from "../types";

export const KNOWN_CONTENT_KEYS = new Set([
  "statement",
  "definition",
  "formal",
  "formula",
  "intuition",
  "gloss",
  "notation",
]);

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function distinct(value: string | undefined, seen: string[]): string {
  const normalized = clean(value);
  return normalized && !seen.includes(normalized) ? normalized : "";
}

function examplesText(node: GraphNode): string {
  return node.examples
    .flatMap((example) => [example.role, example.label, example.content])
    .map((value) => clean(value))
    .filter(Boolean)
    .join(" ");
}

/** Lead text of a step list (proof / solution), joined for plain-text use. */
function stepsText(steps: { content: string }[] | undefined): string {
  return (steps ?? [])
    .map((s) => s.content)
    .join(" ")
    .trim();
}

export function contentValueText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(contentValueText).filter(Boolean).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(contentValueText).filter(Boolean).join(" ");
  return "";
}

function extraContentText(node: GraphNode): string {
  return Object.entries(node.content)
    .filter(([key]) => !KNOWN_CONTENT_KEYS.has(key))
    .map(([, value]) => contentValueText(value))
    .filter(Boolean)
    .join(" ");
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
    extraContentText(node) ||
    examplesText(node) ||
    stepsText(node.proof?.steps) ||
    ""
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
    examplesText(node),
    node.content.intuition,
    extraContentText(node),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
