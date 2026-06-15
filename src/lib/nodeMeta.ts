import type { GraphNode } from "../types";

const LONG_REF_PATTERNS = [/^Stein(?:-|\u2013)Shakarchi\b/i, /^.+:\s*Ch\./i, /;\s*/];

export function isCompactNodeRef(ref: string): boolean {
  const value = ref.trim();
  if (!value) return false;
  if (value.length > 36) return false;
  return !LONG_REF_PATTERNS.some((pattern) => pattern.test(value));
}

export function compactNodeRef(node: GraphNode): string {
  const ref = (node.source?.ref ?? "").trim();
  return isCompactNodeRef(ref) ? ref : "";
}

export function nodeSourceCitation(node: GraphNode): string {
  const citation = (node.source?.citation ?? "").trim();
  if (citation) return citation;

  const ref = (node.source?.ref ?? "").trim();
  return ref && !isCompactNodeRef(ref) ? ref : "";
}
