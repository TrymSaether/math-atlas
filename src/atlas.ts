import { data } from "./data";
import type { NodeKind, Relation } from "./types";
import { dependencyLayout, type Lane } from "./lib/layout";
import { buildAdjacency, descendants, topoSort } from "./lib/graph";

export type AtlasKind = NodeKind;
export type RouteKind = Relation;

export interface AtlasNode {
  id: string;
  shortLabel: string;
  kind: AtlasKind;
  title: string;
  cluster: string;
  x: number;
  y: number;
  dependencies: string[];
  illustratedBy: string[];
  description: string;
  formalStatement: string;
  proofSketch: string;
  notes: string[];
}

export interface AtlasRoute {
  id: string;
  from: string;
  to: string;
  kind: RouteKind;
  path: string;
  active?: boolean;
}

export const NODE_KIND_META: Record<AtlasKind, { label: string; color: string; short: string }> = {
  definition: { label: "Definition", color: "#2F5D8C", short: "D" },
  theorem: { label: "Theorem", color: "#8A3B3B", short: "T" },
  lemma: { label: "Lemma", color: "#47715D", short: "L" },
  example: { label: "Example", color: "#9A6B16", short: "E" },
  proposition: { label: "Proposition", color: "#7A4E7A", short: "P" },
  corollary: { label: "Corollary", color: "#A05A2C", short: "C" },
};

export const ROUTE_META: Record<RouteKind, { label: string; color: string }> = {
  statement: { label: "Statement depends on", color: "#006BA6" },
  proof: { label: "Used in proof", color: "#7A4D98" },
  illustration: { label: "Illustrates / Example of", color: "#D97904" },
};

const NODE_W = 240;
const NODE_H = 92;
const PAD = 60;

const layoutResult = dependencyLayout({
  nodes: data.nodes,
  edges: data.edges,
  showOrphans: false,
});

const posById = new Map<string, { x: number; y: number }>(
  layoutResult.nodes.map((n) => [n.id, n.position]),
);

const statementDeps = new Map<string, string[]>();
const illustratedBy = new Map<string, string[]>();
for (const e of data.edges) {
  if (!posById.has(e.from) || !posById.has(e.to)) continue;
  if (e.relation === "statement" || e.relation === "proof") {
    if (!statementDeps.has(e.from)) statementDeps.set(e.from, []);
    statementDeps.get(e.from)!.push(e.to);
  } else if (e.relation === "illustration") {
    if (!illustratedBy.has(e.to)) illustratedBy.set(e.to, []);
    illustratedBy.get(e.to)!.push(e.from);
  }
}

function shortLabel(kind: NodeKind, number: string): string {
  return `${NODE_KIND_META[kind].short}${number}`;
}

export const atlasNodes: AtlasNode[] = data.nodes
  .filter((n) => posById.has(n.id))
  .map((n) => {
    const p = posById.get(n.id)!;
    return {
      id: n.id,
      shortLabel: shortLabel(n.kind, n.number),
      kind: n.kind,
      title: n.title,
      cluster: n.topicCluster,
      x: p.x,
      y: p.y,
      dependencies: statementDeps.get(n.id) ?? [],
      illustratedBy: illustratedBy.get(n.id) ?? [],
      description: n.explanation || n.cleanText || "",
      formalStatement: n.formalStatement || n.statementText || "",
      proofSketch: "",
      notes: n.qualityFlags ?? [],
    };
  });

export const atlasNodesById = new Map(atlasNodes.map((n) => [n.id, n]));

function pickDefaultTarget(): string {
  const brouwer = atlasNodes.find((n) => /brouwer/i.test(n.title));
  if (brouwer) return brouwer.id;
  const lastTheorem = [...atlasNodes].reverse().find((n) => n.kind === "theorem");
  return lastTheorem?.id ?? atlasNodes[0]?.id ?? "";
}

export const DEFAULT_SELECTED_ID = pickDefaultTarget();

const ALL_RELATIONS = new Set<Relation>(["statement", "proof", "illustration"]);

// Edges are stored as dependent.from -> prerequisite.to.
// A learning path "toward" a target = the target + its transitive prerequisites,
// ordered prereqs-first so the user reads it as a study sequence.
export function computeLearningPath(targetId: string, allowed: Set<Relation> = ALL_RELATIONS): string[] {
  if (!targetId) return [];
  const adj = buildAdjacency(data.edges, allowed);
  const reach = descendants(adj, targetId);
  reach.add(targetId);
  const sorted = topoSort(reach, adj, data.nodes);
  return sorted.reverse().map((n) => n.id);
}

export const activePathIds: string[] = computeLearningPath(DEFAULT_SELECTED_ID);
const activePathSet = new Set(activePathIds);

function curvePath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const x1 = a.x + NODE_W / 2;
  const y1 = a.y + NODE_H;
  const x2 = b.x + NODE_W / 2;
  const y2 = b.y;
  const dy = Math.abs(y2 - y1);
  const c = Math.min(120, Math.max(40, dy / 2));
  return `M${x1} ${y1} C${x1} ${y1 + c}, ${x2} ${y2 - c}, ${x2} ${y2}`;
}

export const atlasRoutes: AtlasRoute[] = data.edges
  .filter((e) => posById.has(e.from) && posById.has(e.to))
  .map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.relation,
    path: curvePath(posById.get(e.from)!, posById.get(e.to)!),
    active: activePathSet.has(e.from) && activePathSet.has(e.to),
  }));

export const atlasLanes: Lane[] = layoutResult.lanes;

const maxX = layoutResult.nodes.reduce((m, n) => Math.max(m, n.position.x + NODE_W), 0);
const maxY = layoutResult.nodes.reduce((m, n) => Math.max(m, n.position.y + NODE_H), 0);
export const CANVAS_W = maxX + PAD;
export const CANVAS_H = maxY + PAD;
export const ATLAS_NODE_W = NODE_W;
export const ATLAS_NODE_H = NODE_H;
