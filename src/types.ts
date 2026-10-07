import type { ArtifactNode, ArtifactEdge } from "./data/artifactSchema";

export type NodeKind = string;
export type Relation = string;

/** A single proof / solution step (the artifact's step shape). */
export type ProofStep = ArtifactNode extends { proof?: { steps: infer S } }
  ? S extends (infer Step)[]
    ? Step
    : never
  : never;

export interface GraphDomain {
  id: string;
  label: string;
  order: number;
  /** Palette key (blue/green/purple/red/teal/orange/pink/gold). */
  palette: string;
}

/**
 * Runtime node = the built artifact node plus a few fields *derived at load*
 * (see data/loadMap). These are computed indices/labels, not stored data:
 *
 * - `topicCluster` — the node's domain label.
 * - `number` — a stable per-domain index (source has no chapter numbering).
 * - `dictChapter` — `source.chapter`, surfaced for the Dictionary view's grouping.
 * - `statementDependencies` — prerequisite ids via the dependency edges.
 * - `proofDependencies` — concept ids referenced by the proof's steps.
 */
export interface GraphNode extends ArtifactNode {
  topicCluster: string;
  number: string;
  dictChapter: string;
  statementDependencies: string[];
  proofDependencies: string[];
}

export type GraphEdge = ArtifactEdge;

/** Back-compat aliases for the React-Flow node/edge components. */
export type TopoNode = GraphNode;
export type TopoEdge = GraphEdge;

export interface GraphData {
  id: string;
  label: string;
  field: string;
  version: number;
  domains: GraphDomain[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const kindLabels = {
  definition: "Definition",
  theorem: "Theorem",
  lemma: "Lemma",
  example: "Example",
  proposition: "Proposition",
  corollary: "Corollary",
} as Record<string, string>;

export const KIND_LABEL = new Proxy(kindLabels, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    return target[prop] ?? titleCase(prop);
  },
}) as Record<string, string>;

const relationLabelBase = {
  statement: "Statement",
  proof: "Proof",
  illustration: "Illustration",
} as Record<string, string>;

export const RELATION_LABEL = new Proxy(relationLabelBase, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    return target[prop] ?? titleCase(prop);
  },
}) as Record<string, string>;
