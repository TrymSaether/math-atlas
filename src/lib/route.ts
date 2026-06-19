/**
 * Route computation for the Directions feature. Two "build" modes over the
 * *full* dependency DAG (never the filtered/visible graph, so a route can never
 * silently dead-end behind a hidden hop):
 *
 *   • prereq — everything you must understand to reach a single goal concept
 *              (its upstream prerequisite cone), as an ordered study sequence.
 *   • path   — the full set of dependency paths between two concepts (every
 *              concept that lies on some chain from `from` up to `to`).
 *
 * Both return the same shape; the "Tour" feature simply walks `ordered`.
 *
 * Edges in the artifact are oriented prerequisite → dependent for dependency
 * relations, so the dependency DAG runs `from → to`. `ancestors` (walking `in`)
 * therefore yields prerequisites; `descendants` (walking `out`) yields
 * dependents. Topological order puts prerequisites first and the goal last —
 * exactly the study order we want.
 */
import { useMemo } from "react";
import type { LoadedMap } from "../data/loadMap";
import type { GraphEdge } from "../types";
import { RELATION_KEYS, RELATIONS, type RelationType } from "../data/relations";
import {
  ancestors,
  buildAdjacency,
  descendants,
  equivalenceClasses,
  shortestPath,
  topoSortWithCycles,
  type Adjacency,
} from "./graph";
import { useStore } from "../store";

export type RouteKind = "prereq" | "path";

export interface RouteResult {
  /** Every concept on the route (cone or all-paths subgraph), incl. endpoints. */
  nodeIds: Set<string>;
  /** Dependency edges whose endpoints both lie on the route. */
  edgeIds: Set<string>;
  /** Study order — prerequisites first, goal last. Empty when not found. */
  ordered: string[];
  /**
   * The single shortest dependency chain between the endpoints (path mode only),
   * inclusive of both, or empty. The all-paths subgraph (`nodeIds`) shows every
   * route; this is the minimal one — the "spine" worth following first.
   */
  spine: string[];
  /** False when there is genuinely no dependency path (path mode only). */
  found: boolean;
}

export const EMPTY_ROUTE: RouteResult = {
  nodeIds: new Set(),
  edgeIds: new Set(),
  ordered: [],
  spine: [],
  found: false,
};

/** Relations that belong to the logical dependency DAG (closed, data-derived). */
const DEP_RELATIONS = new Set<RelationType>(RELATION_KEYS.filter((k) => RELATIONS[k].isDependency));

/**
 * The dependency edges a route runs over. By default just the definitional
 * backbone (statement scope) — what you need to *understand* the goal. With
 * `includeProof`, the proof-dependency overlay is added too — what you need to
 * also be able to *prove* it.
 */
function depEdges(map: LoadedMap, includeProof: boolean): GraphEdge[] {
  return includeProof ? [...map.data.edges, ...map.data.proofEdges] : map.data.edges;
}

function depAdjacency(map: LoadedMap, includeProof: boolean): Adjacency {
  return buildAdjacency(depEdges(map, includeProof), DEP_RELATIONS);
}

/** Topo-order a node set and collect the dependency edges inside it. */
function orderAndEdges(
  map: LoadedMap,
  adj: Adjacency,
  nodeIds: Set<string>,
  edges: GraphEdge[],
): { ordered: string[]; edgeIds: Set<string> } {
  const equivalence = equivalenceClasses(map.data.edges, nodeIds);
  const { nodes } = topoSortWithCycles(nodeIds, adj, map.data.nodes, equivalence);
  const ordered = nodes.map((n) => n.id);
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (e.isDependency && nodeIds.has(e.from) && nodeIds.has(e.to)) {
      edgeIds.add(e.id);
    }
  }
  return { ordered, edgeIds };
}

/** Upstream prerequisite cone of a single goal concept. */
export function prereqResult(map: LoadedMap, targetId: string, includeProof = false): RouteResult {
  if (!map.nodeById.has(targetId)) return EMPTY_ROUTE;
  const edges = depEdges(map, includeProof);
  const adj = depAdjacency(map, includeProof);
  const nodeIds = ancestors(adj, targetId);
  nodeIds.add(targetId);
  const { ordered, edgeIds } = orderAndEdges(map, adj, nodeIds, edges);
  return { nodeIds, edgeIds, ordered, spine: [], found: true };
}

/** All dependency paths between two concepts (the connecting subgraph). */
export function pathResult(map: LoadedMap, fromId: string, toId: string, includeProof = false): RouteResult {
  if (!map.nodeById.has(fromId) || !map.nodeById.has(toId)) return EMPTY_ROUTE;
  const edges = depEdges(map, includeProof);
  const adj = depAdjacency(map, includeProof);
  const down = descendants(adj, fromId); // dependents of `from`
  const up = ancestors(adj, toId); // prerequisites of `to`
  const found = fromId === toId || down.has(toId);
  if (!found) {
    // Show the endpoints so the user can see what they picked, but no route.
    return {
      nodeIds: new Set([fromId, toId]),
      edgeIds: new Set(),
      ordered: [],
      spine: [],
      found: false,
    };
  }
  const nodeIds = new Set<string>([fromId, toId]);
  for (const id of down) if (up.has(id)) nodeIds.add(id);
  const { ordered, edgeIds } = orderAndEdges(map, adj, nodeIds, edges);
  // The shortest dependency chain (fromId → … → toId) through the subgraph.
  const spine = shortestPath(adj, fromId, toId) ?? [];
  return { nodeIds, edgeIds, ordered, spine, found: true };
}

/**
 * Memoized route result for the active map and the store's route inputs. Pure —
 * callers that need the tour sequence in the store sync it themselves.
 */
export function useRouteResult(): RouteResult {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const kind = useStore((s) => s.routeKind);
  const from = useStore((s) => s.routeFrom);
  const to = useStore((s) => s.routeTo);
  const includeProof = useStore((s) => s.routeIncludeProof);
  return useMemo(() => {
    if (!map) return EMPTY_ROUTE;
    if (kind === "prereq") return to ? prereqResult(map, to, includeProof) : EMPTY_ROUTE;
    return from && to ? pathResult(map, from, to, includeProof) : EMPTY_ROUTE;
  }, [map, kind, from, to, includeProof]);
}
