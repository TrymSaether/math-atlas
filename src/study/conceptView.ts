/**
 * conceptView — the single source of truth for "what a concept shows".
 *
 * Every concept surface (the NodePanel sheet, the Dictionary detail, the
 * Flashcard back) renders the same `GraphNode`. Before this module each surface
 * re-derived its own content fields and re-walked the edge graph for relations,
 * and the three drifted. `buildConceptView` does that derivation once; the
 * surfaces become presentation only.
 *
 * Companion to lib/nodeContent (raw field extractors) and the concept/*
 * components (the renderers). Change *what* a concept exposes here; change *how*
 * it looks in the components.
 */
import { useMemo } from "react";
import type { LoadedMap, MapId } from "@/maps";
import type { GraphNode, ProofStep } from "@/maps/types";
import { KIND_LABEL } from "@/maps/types";
import { getDomainTone, type DomainTone } from "@/atlas/colors";
import {
  nodeStatement,
  nodeFormalStatement,
  nodeDefinition,
  nodeFormula,
  proofBlockLabel,
  KNOWN_CONTENT_KEYS,
} from "./nodeContent";
import { compactNodeRef, nodeSourceCitation } from "./nodeMeta";
import { getDomainGlyphId, type DomainGlyphKey } from "@/atlas/domainGlyphs";
import { RELATIONS, RELATION_KEYS, RELATION_TERSE, orientedRelation, type RelationType } from "@shared/maps/relations";

/** Instance kinds that read as "related cases" rather than downstream results. */
export const RELATED_CASE_KINDS = new Set(["example", "non_example", "counterexample"]);

/** A single neighbour, carrying the faithful relation phrasing from N's side. */
export interface RelationLink {
  id: string;
  /** Terse relation verb read from this concept's perspective, e.g. "defined from". */
  caption: string;
}

export interface RelationGroup {
  /** Relation key, or "__none__" for the unlabelled (relation-less) group. */
  key: string;
  /** Full relation label, or "" when the link carries no relation. */
  label: string;
  links: RelationLink[];
}

export interface ConceptRelations {
  /** One group per relation, in canonical relation order; unlabelled group last. */
  groups: RelationGroup[];
  /** Total linked neighbours (drives the panel's Links badge). */
  count: number;
}

export interface ExtraContentEntry {
  key: string;
  label: string;
  value: unknown;
}

export interface ExampleEntry {
  content: string;
  label: string;
  role: string;
}

const NONE_KEY = "__none__";
const RELATION_RANK = new Map<string, number>(RELATION_KEYS.map((key, index) => [key, index]));

/** Full relation label, read from this concept's perspective. */
function relationLabel(rel: RelationType | null): string {
  return rel ? RELATION_TERSE[rel] : "";
}

/**
 * The relation as read FROM this concept TO the neighbour. Edges are stored
 * `from → to` (prerequisite → dependent for dependency edges); this re-orients
 * the authored relation to the node's own viewpoint so the caption is correct on
 * both ends of the arrow.
 */
function perspectiveRelation(edgeRelation: string, nodeIsFrom: boolean): RelationType | null {
  if (!(edgeRelation in RELATIONS)) return null;
  const isDependency = RELATIONS[edgeRelation as RelationType].isDependency;
  const arrow = orientedRelation(edgeRelation, isDependency);
  if (!arrow) return null;
  return nodeIsFrom ? arrow : RELATIONS[arrow].inverse;
}

export interface ConceptView {
  node: GraphNode;
  tone: DomainTone;
  domainLabel: string;
  glyphId: DomainGlyphKey | null;
  kindLabel: string;
  compactRef: string;
  sourceCitation: string;

  /** The load-bearing lead statement — the one emphasized block. */
  statement: string;
  /** Formal restatement, blank when identical to `statement`. */
  formalStatement: string;
  definition: string;
  formula: string;
  notation: string[];
  intuition: string;
  /** Plain-language gloss, blank when it duplicates `intuition`/`statement`. */
  gloss: string;
  extraContent: ExtraContentEntry[];
  examples: ExampleEntry[];
  assumptions: string[];
  properties: string[];

  proof: {
    steps: ProofStep[];
    /** Joined step prose, for surfaces that show proofs as flat text. */
    text: string;
    label: "Proof" | "Solution";
    hasProof: boolean;
  };

  relations: ConceptRelations;
  /** Any prose/visual content at all (drives the panel's empty state). */
  hasContent: boolean;
}

function buildRelations(node: GraphNode, map: LoadedMap): ConceptRelations {
  const outgoing = map.outgoingEdgesByNodeId.get(node.id) ?? [];
  const incoming = map.incomingEdgesByNodeId.get(node.id) ?? [];

  // One bucket per relation (read from this node's viewpoint). A neighbour
  // reached by several edges keeps its strongest (first-seen) relation.
  const byRelation = new Map<string, RelationLink[]>();
  const seen = new Set<string>();
  const add = (id: string, rel: RelationType | null) => {
    if (!map.nodeById.has(id) || id === node.id || seen.has(id)) return;
    seen.add(id);
    const key = rel ?? NONE_KEY;
    const link: RelationLink = { id, caption: relationLabel(rel) };
    const bucket = byRelation.get(key);
    if (bucket) bucket.push(link);
    else byRelation.set(key, [link]);
  };

  for (const e of outgoing) add(e.to, perspectiveRelation(e.relation, true));
  for (const e of incoming) add(e.from, perspectiveRelation(e.relation, false));
  // Proof-step references are dependencies that may carry no edge of their own.
  for (const id of [...node.statementDependencies, ...node.proofDependencies]) add(id, null);

  const groups: RelationGroup[] = [...byRelation.keys()]
    .sort((a, b) => {
      if (a === NONE_KEY) return 1;
      if (b === NONE_KEY) return -1;
      return (RELATION_RANK.get(a) ?? 99) - (RELATION_RANK.get(b) ?? 99);
    })
    .map((key) => ({
      key,
      label: key === NONE_KEY ? "" : relationLabel(key as RelationType),
      links: byRelation.get(key)!,
    }));

  const count = groups.reduce((sum, g) => sum + g.links.length, 0);
  return { groups, count };
}

function titleCaseKey(key: string): string {
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasVisibleExtraValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasVisibleExtraValue);
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function extraContent(node: GraphNode): ExtraContentEntry[] {
  return Object.entries(node.content)
    .filter(([key, value]) => !KNOWN_CONTENT_KEYS.has(key) && hasVisibleExtraValue(value))
    .map(([key, value]) => ({
      key,
      label: titleCaseKey(key) || key,
      value,
    }));
}

function examples(node: GraphNode): ExampleEntry[] {
  return node.examples
    .map((example) => ({
      content: example.content.trim(),
      label: (example.label ?? "").trim(),
      role: (example.role ?? "").trim(),
    }))
    .filter((example) => example.content.length > 0);
}

export function buildConceptView(node: GraphNode, map: LoadedMap, mapId: MapId): ConceptView {
  const statement = nodeStatement(node);
  const formal = nodeFormalStatement(node);
  const formalStatement = formal && formal !== statement ? formal : "";
  const definition = nodeDefinition(node, [statement, formal]);
  const formula = nodeFormula(node, [statement, formal, definition]);
  const intuition = (node.content.intuition ?? "").trim();
  const rawGloss = (node.content.gloss ?? "").trim();
  const gloss = rawGloss && rawGloss !== intuition && rawGloss !== statement ? rawGloss : "";
  const extras = extraContent(node);
  const exampleEntries = examples(node);
  const notation = node.content.notation ?? [];
  const assumptions = node.assumptions;
  const properties = node.properties;

  const steps = node.proof?.steps ?? [];
  const proofText = steps
    .map((s) => s.content)
    .join("\n\n")
    .trim();

  const relations = buildRelations(node, map);

  const hasContent = Boolean(
    statement ||
    formalStatement ||
    definition ||
    formula ||
    intuition ||
    gloss ||
    extras.length ||
    exampleEntries.length ||
    assumptions.length ||
    properties.length ||
    notation.length ||
    steps.length ||
    relations.count,
  );

  return {
    node,
    tone: getDomainTone(node.domain),
    domainLabel: map.domainById.get(node.domain)?.label ?? node.topicCluster,
    glyphId: getDomainGlyphId({ mapId, domainId: node.domain }),
    kindLabel: KIND_LABEL[node.kind],
    compactRef: compactNodeRef(node),
    sourceCitation: nodeSourceCitation(node),
    statement,
    formalStatement,
    definition,
    formula,
    notation,
    intuition,
    gloss,
    extraContent: extras,
    examples: exampleEntries,
    assumptions,
    properties,
    proof: {
      steps,
      text: proofText,
      label: proofBlockLabel(node.kind),
      hasProof: steps.length > 0,
    },
    relations,
    hasContent,
  };
}

export function useConceptView(node: GraphNode, map: LoadedMap, mapId: MapId): ConceptView {
  return useMemo(() => buildConceptView(node, map, mapId), [node, map, mapId]);
}
