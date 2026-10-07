import type { GraphData, GraphDomain, GraphEdge, GraphNode } from "../types";
import type { Artifact } from "./artifactSchema";
import {
  computeSwimlaneLayout,
  type DomainBounds,
  type Position,
} from "../lib/atlasLayout";
import { registerDomainTones, type DomainTone } from "../lib/colors";
import { computeGraphMetrics, type GraphMetrics } from "../lib/graphMetrics";
import { DEFAULT_MAP_ID, MAPS, loadRawMap, type MapId } from "./mapRegistry";
import { SourceGraphSchema } from "./sourceSchema";
import { buildArtifact } from "./buildArtifact";
import { readOverlay } from "./edits";

/**
 * Enrich a pre-validated build artifact into the runtime GraphData by computing
 * the derived fields (see GraphNode). The artifact is already schema-checked at
 * build time, so there is no runtime validation or format translation here.
 */
export function enrichArtifact(artifact: Artifact): GraphData {
  const domains: GraphDomain[] = [...artifact.domains].sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label),
  );
  const domainLabel = new Map(domains.map((d) => [d.id, d.label]));

  // Prerequisites: for node X, the `from` (prereq) of dependency edges into X.
  const prereqs = new Map<string, string[]>();
  for (const e of artifact.edges) {
    if (!e.isDependency) continue;
    const list = prereqs.get(e.to) ?? [];
    list.push(e.from);
    prereqs.set(e.to, list);
  }

  const domainCounters = new Map<string, number>();
  const nodes: GraphNode[] = artifact.nodes.map((n) => {
    const idx = (domainCounters.get(n.domain) ?? 0) + 1;
    domainCounters.set(n.domain, idx);
    return {
      ...n,
      topicCluster: domainLabel.get(n.domain) ?? n.domain,
      number: String(idx),
      dictChapter: n.source?.chapter ?? "",
      statementDependencies: prereqs.get(n.id) ?? [],
      proofDependencies: [
        ...new Set((n.proof?.steps ?? []).flatMap((s) => s.uses)),
      ],
    };
  });

  return {
    id: artifact.id,
    label: artifact.label,
    field: artifact.field,
    version: artifact.version,
    domains,
    nodes,
    edges: artifact.edges as GraphEdge[],
  };
}

function groupEdges(edges: GraphEdge[], key: "from" | "to") {
  const grouped = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const id = edge[key];
    const list = grouped.get(id) ?? [];
    list.push(edge);
    grouped.set(id, list);
  }
  return grouped;
}

function buildAdjacency(edges: GraphEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    const set = adjacency.get(a) ?? new Set<string>();
    set.add(b);
    adjacency.set(a, set);
  };
  for (const edge of edges) {
    link(edge.from, edge.to);
    link(edge.to, edge.from);
  }
  return adjacency;
}

function computeDegrees(edges: GraphEdge[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
  }
  return degrees;
}

export interface LoadedMap {
  data: GraphData;
  nodeById: Map<string, GraphData["nodes"][number]>;
  domainById: Map<string, GraphDomain>;
  /** Resolved palette tone per domain id (single source of truth for color). */
  domainTones: Map<string, DomainTone>;
  edgeById: Map<string, GraphEdge>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
  /** Undirected neighbor sets, computed once. */
  neighborsByNodeId: Map<string, Set<string>>;
  /** Total (in+out) degree per node. */
  degreeByNodeId: Map<string, number>;
  kinds: string[];
  relations: string[];
  topics: string[];
  positions: Map<string, Position>;
  domainBounds: Map<string, DomainBounds>;
  /** Derived structural metrics: depth (x-axis), impact (node size), reduction. */
  metrics: GraphMetrics;
}

export function buildLoadedMap(data: GraphData): LoadedMap {
  const metrics = computeGraphMetrics(data);
  const layout = computeSwimlaneLayout(data, metrics);
  return {
    data,
    nodeById: new Map(data.nodes.map((node) => [node.id, node])),
    domainById: new Map(data.domains.map((domain) => [domain.id, domain])),
    domainTones: registerDomainTones(data.domains),
    edgeById: new Map(data.edges.map((edge) => [edge.id, edge])),
    incomingEdgesByNodeId: groupEdges(data.edges, "to"),
    outgoingEdgesByNodeId: groupEdges(data.edges, "from"),
    neighborsByNodeId: buildAdjacency(data.edges),
    degreeByNodeId: computeDegrees(data.edges),
    kinds: [...new Set(data.nodes.map((node) => node.kind))].sort(),
    relations: [...new Set(data.edges.map((edge) => edge.relation))].sort(),
    topics: data.domains.map((domain) => domain.id),
    positions: layout.positions,
    domainBounds: layout.domainBounds,
    metrics,
  };
}

/**
 * Format a Zod error from validating an edited source graph into a short,
 * human-facing message (the editor surfaces this when an edit is rejected).
 */
export function formatSourceIssues(error: import("zod").ZodError): string {
  return error.issues
    .slice(0, 4)
    .map((i) => `${i.path.join(".") || "graph"}: ${i.message}`)
    .join("; ");
}

export type BuildResult =
  | { ok: true; map: LoadedMap; warnings: string[] }
  | { ok: false; error: string };

/**
 * Validate an edited source graph with the SAME strict schema the CLI build
 * uses, then re-derive the runtime LoadedMap. This is the in-browser mirror of
 * `scripts/build-maps.ts` and the single gate every authoring edit passes
 * through, so the invariants (FK integrity, dup/subsumption, contiguous
 * domains) can never be violated from the UI.
 */
export function buildLoadedMapFromSource(source: unknown): BuildResult {
  const parsed = SourceGraphSchema.safeParse(source);
  if (!parsed.success) {
    return { ok: false, error: formatSourceIssues(parsed.error) };
  }
  const { artifact, warnings } = buildArtifact(parsed.data);
  return { ok: true, map: buildLoadedMap(enrichArtifact(artifact)), warnings };
}

async function buildFromShipped(mapId: MapId): Promise<LoadedMap> {
  const raw = await loadRawMap(mapId);
  return buildLoadedMap(enrichArtifact(raw as Artifact));
}

/**
 * Build the runtime map, preferring a saved authoring overlay. A corrupt or
 * stale overlay never breaks the app: validation failure falls back to the
 * shipped artifact with a console warning.
 */
async function buildPreferringOverlay(mapId: MapId): Promise<LoadedMap> {
  const overlay = readOverlay(mapId);
  if (overlay) {
    const result = buildLoadedMapFromSource(overlay.source);
    if (result.ok) return result.map;
    console.warn(
      `[math-atlas] ignoring invalid edit overlay for "${mapId}": ${result.error}`,
    );
  }
  return buildFromShipped(mapId);
}

const loadedMapCache = new Map<MapId, Promise<LoadedMap>>();

export function loadMap(mapId: MapId = DEFAULT_MAP_ID): Promise<LoadedMap> {
  const cached = loadedMapCache.get(mapId);
  if (cached) return cached;

  const loaded = buildPreferringOverlay(mapId);
  loadedMapCache.set(mapId, loaded);
  return loaded;
}

/** Load the built-in map, bypassing (and not caching) any overlay — for revert. */
export function loadShippedMap(mapId: MapId = DEFAULT_MAP_ID): Promise<LoadedMap> {
  loadedMapCache.delete(mapId);
  return buildFromShipped(mapId);
}

export async function loadRegisteredMaps(): Promise<Record<MapId, LoadedMap>> {
  const entries = await Promise.all(
    (Object.keys(MAPS) as MapId[]).map(
      async (mapId) => [mapId, await loadMap(mapId)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<MapId, LoadedMap>;
}
