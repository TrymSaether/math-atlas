/**
 * Reconstruct an editable SourceGraph from a loaded (denormalized) GraphData.
 *
 * The authoring loop edits the *source* shape — forward relations, one fact per
 * pair — then re-derives the artifact via buildArtifact. The runtime only ever
 * holds the artifact/GraphData, so we un-orient edges back to their authored
 * `source → target` form here. This is lossless for everything the editor can
 * touch (edge `notes`, dropped at build, are author-only and never surfaced).
 */
import type { GraphData } from "../types";
import type { SourceEdge, SourceGraph } from "./sourceSchema";

const TODAY = (): string => new Date().toISOString().slice(0, 10);

export function graphDataToSource(data: GraphData): SourceGraph {
  const concepts = data.nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    domain: n.domain,
    label: n.label,
    content: n.content,
    examples: n.examples,
    diagram: n.diagram,
    assumptions: n.assumptions,
    properties: n.properties,
    proof: n.proof,
    source: n.source,
    tags: n.tags,
    priority: n.priority,
  }));

  const edges: SourceEdge[] = data.edges.map((e) => {
    // Dependency edges are stored prerequisite → dependent (the reverse of how
    // they were authored), so un-orient: authored source is the dependent.
    const [source, target] = e.isDependency ? [e.to, e.from] : [e.from, e.to];
    return {
      id: e.id,
      source,
      target,
      relation: e.relation as SourceEdge["relation"],
    };
  });

  return {
    id: data.id,
    label: data.label,
    field: data.field,
    version: data.version,
    updated: TODAY(),
    domains: data.domains.map((d) => ({
      id: d.id,
      label: d.label,
      order: d.order,
      palette: d.palette,
    })),
    concepts,
    edges,
  };
}
