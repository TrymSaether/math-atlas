/**
 * CliMap — the in-memory model every command works against.
 *
 * It pairs the validated authored `SourceGraph` with the derived `Artifact`
 * (oriented edges + degree + depth, via the shared `buildArtifact`) and builds
 * cheap adjacency indices over the dependency DAG. Nothing here re-validates:
 * `fromSource` assumes the SourceGraph already parsed against SourceGraphSchema.
 */
import { buildArtifact } from "../../../shared/maps/build.ts";
import type { SourceGraph } from "../../../shared/maps/source.ts";
import type { Artifact, ArtifactEdge, ArtifactNode } from "../../../shared/maps/artifact.ts";

export interface CliMap {
  id: string;
  label: string;
  field: string;
  version: number;
  fileName: string;
  source: SourceGraph;
  raw: string;
  artifact: Artifact;
  warnings: string[];

  nodes: ArtifactNode[];
  nodeById: Map<string, ArtifactNode>;
  edges: ArtifactEdge[];
  domainsByOrder: Artifact["domains"];
  domainById: Map<string, Artifact["domains"][number]>;

  /** Dependency edges only (from = prerequisite, to = dependent). */
  depEdges: ArtifactEdge[];
  /** Prerequisites of a node (foundational neighbours it depends on). */
  prereqsOf: Map<string, string[]>;
  /** Dependents of a node (things that depend on it). */
  dependentsOf: Map<string, string[]>;
  /** All outgoing edges keyed by `from`. */
  outBy: Map<string, ArtifactEdge[]>;
  /** All incoming edges keyed by `to`. */
  inBy: Map<string, ArtifactEdge[]>;
  /** Undirected neighbour ids, all relations. */
  neighbors: Map<string, Set<string>>;
}

export function buildCliMap(source: SourceGraph, raw: string, fileName: string): CliMap {
  const { artifact, warnings } = buildArtifact(source);

  const nodeById = new Map(artifact.nodes.map((n) => [n.id, n]));
  const domainById = new Map(artifact.domains.map((d) => [d.id, d]));

  const prereqsOf = new Map<string, string[]>();
  const dependentsOf = new Map<string, string[]>();
  const outBy = new Map<string, ArtifactEdge[]>();
  const inBy = new Map<string, ArtifactEdge[]>();
  const neighbors = new Map<string, Set<string>>();
  for (const n of artifact.nodes) {
    prereqsOf.set(n.id, []);
    dependentsOf.set(n.id, []);
    outBy.set(n.id, []);
    inBy.set(n.id, []);
    neighbors.set(n.id, new Set());
  }

  for (const e of artifact.edges) {
    outBy.get(e.from)?.push(e);
    inBy.get(e.to)?.push(e);
    neighbors.get(e.from)?.add(e.to);
    neighbors.get(e.to)?.add(e.from);
    if (e.isDependency) {
      // to depends on from ⇒ from is a prerequisite of to.
      prereqsOf.get(e.to)?.push(e.from);
      dependentsOf.get(e.from)?.push(e.to);
    }
  }

  return {
    id: artifact.id,
    label: artifact.label,
    field: artifact.field,
    version: artifact.version,
    fileName,
    source,
    raw,
    artifact,
    warnings,
    nodes: artifact.nodes,
    nodeById,
    edges: artifact.edges,
    domainsByOrder: artifact.domains,
    domainById,
    depEdges: artifact.edges.filter((e) => e.isDependency),
    prereqsOf,
    dependentsOf,
    outBy,
    inBy,
    neighbors,
  };
}

/** Locate a concept across maps by exact id. */
export function findConcept(maps: CliMap[], id: string): { map: CliMap; node: ArtifactNode } | undefined {
  for (const map of maps) {
    const node = map.nodeById.get(id);
    if (node) return { map, node };
  }
  return undefined;
}
