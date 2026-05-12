import { RELATION_LABEL, type Relation, type TopoData, type TopoEdge, type TopoNode } from "../types";

const FRAGMENT_NODE_ID = "thm-3-16-tells-us-that-the-composition-of-two-homeomorphisms-f-x-y-an";
const FRAGMENT_TEXT_TARGET_ID = "thm-3-23-let-x-y-and-z-be-topological-spaces";
const FRAGMENT_EDGE_TARGET_ID = "thm-3-16-composition-of-continuous-maps";

const SEMANTIC_LAYERS: Record<
  string,
  { layer: string; layerOrder: number; layerName: string }
> = {
  "1": { layer: "applications", layerOrder: 95, layerName: "Applications" },
  "2": { layer: "metric-foundations", layerOrder: 10, layerName: "Metric foundations" },
  "3": { layer: "topological-core", layerOrder: 20, layerName: "Topological core" },
  "4": { layer: "generated-topologies", layerOrder: 30, layerName: "Generated topologies" },
  "5": { layer: "space-constructions", layerOrder: 40, layerName: "Space constructions" },
  "6": { layer: "topological-properties", layerOrder: 50, layerName: "Topological properties" },
  "7": { layer: "homotopy-fundamental-group", layerOrder: 60, layerName: "Homotopy and fundamental group" },
  "8": { layer: "coverings-circle-applications", layerOrder: 70, layerName: "Coverings, circle, and applications" },
  A: { layer: "set-theory", layerOrder: 0, layerName: "Set theory" },
  B: { layer: "algebra", layerOrder: 5, layerName: "Algebra" },
};

const CORE_TITLE_PATTERNS = [
  /metric spaces/i,
  /open and closed balls/i,
  /open and closed sets/i,
  /topological spaces/i,
  /continuous maps/i,
  /homeomorphisms/i,
  /closed subsets/i,
  /closure/i,
  /dense/i,
  /topology generated/i,
  /basis/i,
  /subbasis/i,
  /subspace topology/i,
  /product topology/i,
  /quotient space/i,
  /connected space/i,
  /path-connected/i,
  /hausdorff/i,
  /cover of a space/i,
  /compact spaces/i,
  /homotopy/i,
  /path homotopy/i,
  /fundamental group/i,
  /simply connected/i,
  /based maps/i,
  /retractions/i,
  /covering spaces/i,
  /local homeomorphisms/i,
  /liftings/i,
];

export function cleanTopologyData(input: TopoData): TopoData {
  const fragment = input.nodes.find((node) => node.id === FRAGMENT_NODE_ID);

  const nodes = input.nodes
    .filter((node) => node.id !== FRAGMENT_NODE_ID)
    .map((node) => enrichNode(node, fragment));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = dedupeEdges(input.edges)
    .map(redirectFragmentEdge)
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .map(enrichEdge);

  return {
    _meta: {
      ...(input._meta ?? {}),
      schemaVersion: "2.0-runtime-enriched",
      runtimeCleaned: true,
      cleaningSteps: [
        "removed known proof-continuation fragment node if present",
        "redirected fragment edges to the real composition theorem",
        "deduplicated dependency edges with verified edges taking precedence",
        "added optional semantic, graph, label, and review metadata",
      ],
      manualCorrections: {
        removedNodes: fragment
          ? [
              {
                id: FRAGMENT_NODE_ID,
                mergedTextInto: FRAGMENT_TEXT_TARGET_ID,
                edgeSourceRedirectedTo: FRAGMENT_EDGE_TARGET_ID,
                reason:
                  "Duplicate number 3.16; text is proof continuation from Theorem 3.23, not a standalone theorem.",
              },
            ]
          : [],
      },
      counts: {
        rawNodes: input.nodes.length,
        cleanNodes: nodes.length,
        cleanEdges: edges.length,
        removedNodes: fragment ? 1 : 0,
      },
    },
    nodes: addGraphMetadata(nodes, edges),
    edges,
  };
}

function enrichNode(node: TopoNode, fragment?: TopoNode): TopoNode {
  const semantic = semanticForNode(node);
  const label = node.label ?? `${kindLabel(node.kind)} ${node.number}: ${node.title}`;
  const cleanText = node.cleanText ?? stripPageArtifacts(node.originalText);

  return {
    ...node,
    label,
    cleanText,
    statementText: node.statementText ?? firstParagraph(cleanText),
    chapterGroup: node.chapterGroup ?? chapterGroup(node.chapter),
    qualityFlags: node.qualityFlags ?? [],
    mergedFrom:
      node.id === FRAGMENT_TEXT_TARGET_ID && fragment
        ? [
            ...(node.mergedFrom ?? []),
            {
              id: fragment.id,
              reason:
                "extracted as a duplicate theorem because a proof continuation began with “Theorem 3.16”; retained as continuation text only",
              cleanText: stripPageArtifacts(fragment.originalText),
            },
          ]
        : node.mergedFrom ?? [],
    semantic: {
      ...semantic,
      ...(node.semantic ?? {}),
    },
  };
}

function semanticForNode(node: TopoNode): NonNullable<TopoNode["semantic"]> {
  const layer = SEMANTIC_LAYERS[node.chapter] ?? {
    layer: "other",
    layerOrder: 999,
    layerName: "Other",
  };
  const isCoreConcept = node.kind !== "example" && CORE_TITLE_PATTERNS.some((pattern) => pattern.test(node.title));

  return {
    ...layer,
    conceptBuckets: [...new Set([...(node.tags ?? []), node.topicCluster].filter(Boolean))],
    role: isCoreConcept ? "core-concept" : node.kind === "example" ? "example" : node.kind === "definition" ? "definition" : "result",
    shortLabel: `${kindLabel(node.kind)} ${node.number}: ${node.title}`,
    sortKey: [Number.parseInt(node.chapter, 10) || 99, node.section, Number.parseFloat(node.number) || 0],
    isCoreConcept,
  };
}

function dedupeEdges(edges: TopoEdge[]): TopoEdge[] {
  const chosen = new Map<string, TopoEdge>();

  for (const edge of edges) {
    if (edge.source === "verified" && edge.confidence < 0.7) continue;

    const redirected = redirectFragmentEdge(edge);
    const key = `${redirected.from}\u0000${redirected.to}`;
    const previous = chosen.get(key);

    if (!previous || edgeRank(redirected) > edgeRank(previous)) {
      chosen.set(key, redirected);
    }
  }

  return [...chosen.values()].map((edge) => ({
    ...edge,
    id: edge.id || edgeId(edge),
  }));
}

function edgeRank(edge: TopoEdge) {
  return (edge.source === "verified" ? 10 : 0) + edge.confidence;
}

function redirectFragmentEdge(edge: TopoEdge): TopoEdge {
  if (edge.from !== FRAGMENT_NODE_ID && edge.to !== FRAGMENT_NODE_ID) return edge;

  return {
    ...edge,
    from: edge.from === FRAGMENT_NODE_ID ? FRAGMENT_EDGE_TARGET_ID : edge.from,
    to: edge.to === FRAGMENT_NODE_ID ? FRAGMENT_EDGE_TARGET_ID : edge.to,
    id: edgeId({
      ...edge,
      from: edge.from === FRAGMENT_NODE_ID ? FRAGMENT_EDGE_TARGET_ID : edge.from,
      to: edge.to === FRAGMENT_NODE_ID ? FRAGMENT_EDGE_TARGET_ID : edge.to,
    }),
  };
}

function enrichEdge(edge: TopoEdge): TopoEdge {
  const flags: string[] = [...(edge.review?.flags ?? [])];
  if (edge.source === "auto") flags.push("auto-edge-review");
  if (edge.confidence < 0.75) flags.push("low-confidence");

  return {
    ...edge,
    id: edge.id || edgeId(edge),
    label: edge.label ?? RELATION_LABEL[edge.relation],
    review: {
      flags: [...new Set(flags)],
      needsHumanReview: edge.review?.needsHumanReview ?? flags.length > 0,
    },
  };
}

function addGraphMetadata(nodes: TopoNode[], edges: TopoEdge[]): TopoNode[] {
  const inByNode = new Map<string, TopoEdge[]>();
  const outByNode = new Map<string, TopoEdge[]>();

  for (const node of nodes) {
    inByNode.set(node.id, []);
    outByNode.set(node.id, []);
  }

  for (const edge of edges) {
    outByNode.get(edge.from)?.push(edge);
    inByNode.get(edge.to)?.push(edge);
  }

  return nodes.map((node) => {
    const incoming = inByNode.get(node.id) ?? [];
    const outgoing = outByNode.get(node.id) ?? [];
    const degree = incoming.length + outgoing.length;
    const basePriority = node.semantic?.isCoreConcept ? 10 : node.kind === "definition" ? 6 : node.kind === "theorem" ? 5 : 2;

    return {
      ...node,
      graph: {
        ...(node.graph ?? {}),
        inDegree: incoming.length,
        outDegree: outgoing.length,
        degree,
        inByRelation: countRelations(incoming),
        outByRelation: countRelations(outgoing),
        conceptMapPriority: node.graph?.conceptMapPriority ?? basePriority + degree,
      },
    };
  });
}

function countRelations(edges: TopoEdge[]) {
  return edges.reduce<Record<string, number>>((counts, edge) => {
    counts[edge.relation] = (counts[edge.relation] ?? 0) + 1;
    return counts;
  }, {});
}

function edgeId(edge: Pick<TopoEdge, "from" | "to" | "relation">) {
  return `edge-${hash(`${edge.from}|${edge.to}|${edge.relation}`).slice(0, 12)}`;
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function chapterGroup(chapter: string) {
  if (chapter === "1") return "overture-and-applications";
  if (chapter === "2") return "metric-foundations";
  if (["3", "4", "5"].includes(chapter)) return "point-set-topology";
  if (chapter === "6") return "topological-properties";
  if (["7", "8"].includes(chapter)) return "algebraic-topology";
  if (chapter === "A") return "set-theory";
  if (chapter === "B") return "algebra";
  return "other";
}

function kindLabel(kind: TopoNode["kind"]) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function firstParagraph(text: string) {
  return text.split(/\n\s*\n/)[0]?.trim() ?? text;
}

function stripPageArtifacts(text: string) {
  return text
    .replace(/\n\s*Chapter\s+\d+\.[^\n]*\n/g, "\n")
    .replace(/\n\s*\d+\s+\d+(?:\.\d+)?\.[^\n]*\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
