import { data } from "./data";
import type { NodeKind, Relation, TopoEdge } from "./types";
import { dependencyLayout, type Lane } from "./lib/layout";
import { buildLearningPath, cmpNum, orientEdge } from "./lib/graph";

export type AtlasKind = NodeKind;
export type RouteKind = Relation;

export interface AtlasLink {
  id: string;
  nodeId: string;
  relation: Relation;
  semanticRelation?: string;
  label?: string;
  confidence: number;
  source: TopoEdge["source"];
  rationale?: string;
  needsHumanReview: boolean;
  reviewFlags: string[];
}

export interface AtlasNode {
  id: string;
  shortLabel: string;
  kind: AtlasKind;
  title: string;
  cluster: string;
  x: number;
  y: number;
  dependencies: AtlasLink[];
  dependents: AtlasLink[];
  illustratedBy: AtlasLink[];
  description: string;
  formalStatement: string;
  proofSketch: string;
  notes: string[];
  semanticLayer?: string;
  semanticRole?: string;
  conceptMapPriority?: number;
}

export interface AtlasRoute {
  id: string;
  from: string;
  to: string;
  kind: RouteKind;
  path: string;
  active?: boolean;
}

export const NODE_KIND_META: Record<
  AtlasKind,
  { label: string; color: string; short: string }
> = {
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
const rawNodeById = new Map(data.nodes.map((n) => [n.id, n]));

const dependencyLinks = new Map<string, AtlasLink[]>();
const usedByLinks = new Map<string, AtlasLink[]>();
const illustratedByLinks = new Map<string, AtlasLink[]>();

for (const e of data.edges) {
  if (!posById.has(e.from) || !posById.has(e.to)) continue;

  const sourceLink = edgeToLink(e, e.from);
  const dependentLink = edgeToLink(e, e.to);

  if (e.relation === "statement" || e.relation === "proof") {
    // Provenance graph direction is source/prerequisite -> dependent.
    pushLink(dependencyLinks, e.to, sourceLink);
    pushLink(usedByLinks, e.from, dependentLink);
  } else if (e.relation === "illustration") {
    pushLink(illustratedByLinks, e.to, sourceLink);
    pushLink(usedByLinks, e.from, dependentLink);
  }
}

sortLinks(dependencyLinks);
sortLinks(usedByLinks);
sortLinks(illustratedByLinks);

function pushLink(map: Map<string, AtlasLink[]>, id: string, link: AtlasLink) {
  if (!map.has(id)) map.set(id, []);
  map.get(id)!.push(link);
}

function edgeToLink(edge: TopoEdge, nodeId: string): AtlasLink {
  return {
    id: edge.id,
    nodeId,
    relation: edge.relation,
    semanticRelation: edge.semanticRelation,
    label: edge.label,
    confidence: edge.confidence,
    source: edge.source,
    rationale: edge.rationale,
    needsHumanReview: edge.review?.needsHumanReview ?? false,
    reviewFlags: edge.review?.flags ?? [],
  };
}

function sortLinks(map: Map<string, AtlasLink[]>) {
  for (const links of map.values()) {
    links.sort((a, b) => {
      const an = rawNodeById.get(a.nodeId);
      const bn = rawNodeById.get(b.nodeId);
      if (!an || !bn) return a.nodeId.localeCompare(b.nodeId);
      return cmpNum(an, bn);
    });
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
      dependencies: dependencyLinks.get(n.id) ?? [],
      dependents: usedByLinks.get(n.id) ?? [],
      illustratedBy: illustratedByLinks.get(n.id) ?? [],
      description: n.explanation || n.cleanText || "",
      formalStatement: n.formalStatement || n.statementText || "",
      proofSketch: "",
      notes: n.qualityFlags ?? [],
      semanticLayer: n.semantic?.layerName ?? n.semantic?.layer,
      semanticRole: n.semantic?.role,
      conceptMapPriority: n.graph?.conceptMapPriorityV2 ?? n.graph?.conceptMapPriority,
    };
  });

export const atlasNodesById = new Map(atlasNodes.map((n) => [n.id, n]));

function pickDefaultTarget(): string {
  const brouwer = atlasNodes.find((n) => /brouwer/i.test(n.title));
  if (brouwer) return brouwer.id;
  const lastTheorem = [...atlasNodes]
    .reverse()
    .find((n) => n.kind === "theorem");
  return lastTheorem?.id ?? atlasNodes[0]?.id ?? "";
}

export const DEFAULT_SELECTED_ID = pickDefaultTarget();

const ALL_RELATIONS = new Set<Relation>(["statement", "proof", "illustration"]);

// Edges are stored as mathematical source/prerequisite -> dependent concept.
// A learning path toward a target follows incoming prerequisite/provenance edges,
// then returns the result in study order: prerequisites first, target last.
export function computeLearningPath(
  targetId: string,
  allowed: Set<Relation> = ALL_RELATIONS,
): string[] {
  if (!targetId) return [];
  return buildLearningPath(targetId, data.edges, allowed, data.nodes).map(
    (n) => n.id,
  );
}

export const activePathIds: string[] = computeLearningPath(DEFAULT_SELECTED_ID);
const activePathSet = new Set(activePathIds);

function curvePath(
  a: { x: number; y: number },
  b: { x: number; y: number },
): string {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.abs(x2 - x1);
  const c = Math.min(140, Math.max(50, dx / 2));
  return `M${x1} ${y1} C${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
}

export const atlasRoutes: AtlasRoute[] = data.edges
  .filter((e) => posById.has(e.from) && posById.has(e.to))
  .map((e) => {
    const route = orientEdge(e, "route");
    return {
      id: e.id,
      from: route.from,
      to: route.to,
      kind: e.relation,
      path: curvePath(posById.get(route.from)!, posById.get(route.to)!),
      active: activePathSet.has(e.from) && activePathSet.has(e.to),
    };
  });

export const atlasLanes: Lane[] = layoutResult.lanes;

const maxX = layoutResult.nodes.reduce(
  (m, n) => Math.max(m, n.position.x + NODE_W),
  0,
);
const maxY = layoutResult.nodes.reduce(
  (m, n) => Math.max(m, n.position.y + NODE_H),
  0,
);
export const CANVAS_W = maxX + PAD;
export const CANVAS_H = maxY + PAD;
export const ATLAS_NODE_W = NODE_W;
export const ATLAS_NODE_H = NODE_H;
