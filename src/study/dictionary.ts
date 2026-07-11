import type { AtlasMap } from "@/atlas/model";
import type { GraphNode } from "@/maps/types";
import { nodeAnswerText, nodeFormalStatement, nodeSearchText, nodeStatement } from "./concept/content";

/**
 * The dictionary is a field-agnostic projection of the active atlas map: every
 * node that carries curated dictionary content (a gloss or a diagram) is an
 * entry. Entries are grouped by chapter when the source provides chapter
 * numbering (e.g. topology), and otherwise fall back to the map's domains, so
 * the same view works for any mathematical field.
 */

/** Human labels for the topology chapter ids; other fields fall back to "Chapter N". */
const TOPOLOGY_CHAPTERS: Record<string, string> = {
  "2": "Continuous maps & metric spaces",
  "3": "Topological spaces",
  "4": "Generating topologies",
  "5": "Subspaces, products & quotients",
  "6": "Connectedness, Hausdorff & compactness",
  "7": "The fundamental group",
  "8": "Covering spaces & π₁(S¹)",
  A: "Appendix A — Set theory",
  B: "Appendix B — Elementary algebra",
};

export const KIND_ORDER: Record<string, number> = {
  definition: 0,
  theorem: 1,
  proposition: 2,
  lemma: 3,
  corollary: 4,
  concept: 5,
};

export type DictSortMode = "alpha" | "section" | "kind";

export function isDictionaryEntry(node: GraphNode): boolean {
  return Boolean(nodeAnswerText(node) || node.diagram);
}

export function dictionaryEntries(map: AtlasMap): GraphNode[] {
  return map.data.nodes.filter(isDictionaryEntry);
}

/** The reading-view statement, falling back through the available text fields. */
export function entryStatement(node: GraphNode): string {
  return nodeStatement(node);
}

export function entryFormalStatement(node: GraphNode): string {
  return nodeFormalStatement(node);
}

/**
 * Normalize text for dictionary search so queries hit through LaTeX markup:
 * commands lose their backslash (`\ell` matches "ell"), grouping/markup
 * characters become spaces, and whitespace collapses. Applied to both the
 * query and the haystack.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\\([a-z]+)/gi, "$1")
    .replace(/[${}()[\]^_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type SearchHit = "label" | "text";

/**
 * Full-text index over the entries: id → normalized haystack of every content
 * field (statement, formal, gloss, examples, …). Built once per entry set.
 */
export function buildSearchIndex(entries: GraphNode[]): Map<string, string> {
  return new Map(entries.map((node) => [node.id, normalizeSearchText(nodeSearchText(node))]));
}

/** Where (if anywhere) the normalized query matches this entry. */
export function searchHit(node: GraphNode, normQuery: string, index: Map<string, string>): SearchHit | null {
  if (!normQuery) return "label";
  if (normalizeSearchText(node.label).includes(normQuery)) return "label";
  if ((node.source?.ref ?? "").toLowerCase().includes(normQuery)) return "label";
  if ((index.get(node.id) ?? "").includes(normQuery)) return "text";
  return null;
}

export function chapterLabel(chapter: string): string {
  return TOPOLOGY_CHAPTERS[chapter] ?? `Chapter ${chapter}`;
}

export function chapterShortLabel(chapter: string): string {
  const title = chapterLabel(chapter).replace(/^Appendix . — /, "");
  const prefix = /^[A-Z]/.test(chapter) ? chapter : `Ch ${chapter}`;
  return `${prefix} · ${title}`;
}

/**
 * Section facet for the entry set: chapters if any entry carries a chapter,
 * otherwise the map's domains. Returns the value/label/order accessors the
 * view uses for filtering, grouping, and sorting.
 */
export interface SectionFacet {
  mode: "chapter" | "domain";
  /** Distinct section values present, in display order. */
  values: string[];
  valueOf: (node: GraphNode) => string;
  labelOf: (value: string) => string;
  /** Compact label for a filter chip. */
  chipLabelOf: (value: string) => string;
}

export function sectionFacet(map: AtlasMap, entries: GraphNode[]): SectionFacet {
  const hasChapters = entries.some((e) => e.dictChapter);

  if (hasChapters) {
    const order = ["2", "3", "4", "5", "6", "7", "8", "A", "B"];
    const present = order.filter((c) => entries.some((e) => e.dictChapter === c));
    // Append any chapter ids the source uses that aren't in the known order.
    for (const e of entries) {
      if (e.dictChapter && !present.includes(e.dictChapter)) present.push(e.dictChapter);
    }
    return {
      mode: "chapter",
      values: present,
      valueOf: (n) => n.dictChapter,
      labelOf: (v) => `Ch. ${v} · ${chapterLabel(v).replace(/^Appendix . — /, "")}`,
      chipLabelOf: chapterShortLabel,
    };
  }

  const domainOrder = map.data.domains.map((d) => d.id);
  const present = domainOrder.filter((d) => entries.some((e) => e.domain === d));
  const labelOf = (v: string) => map.domainById.get(v)?.label ?? v;
  return {
    mode: "domain",
    values: present,
    valueOf: (n) => n.domain,
    labelOf,
    chipLabelOf: labelOf,
  };
}
