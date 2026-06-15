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
import { RELATION_KEYS, RELATIONS, type RelationType } from "../data/relations";
import {
  ancestors,
  buildAdjacency,
  descendants,
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
  /** False when there is genuinely no dependency path (path mode only). */
  found: boolean;
}

export const EMPTY_ROUTE: RouteResult = {
  nodeIds: new Set(),
  edgeIds: new Set(),
  ordered: [],
  found: false,
};

/** Relations that belong to the logical dependency DAG (closed, data-derived). */
const DEP_RELATIONS = new Set<RelationType>(RELATION_KEYS.filter((k) => RELATIONS[k].isDependency));

function depAdjacency(map: LoadedMap): Adjacency {
  return buildAdjacency(map.data.edges, DEP_RELATIONS);
}

/** Topo-order a node set and collect the dependency edges inside it. */
function orderAndEdges(
  map: LoadedMap,
  adj: Adjacency,
  nodeIds: Set<string>,
): { ordered: string[]; edgeIds: Set<string> } {
  const { nodes } = topoSortWithCycles(nodeIds, adj, map.data.nodes);
  const ordered = nodes.map((n) => n.id);
  const edgeIds = new Set<string>();
  for (const e of map.data.edges) {
    if (e.isDependency && nodeIds.has(e.from) && nodeIds.has(e.to)) {
      edgeIds.add(e.id);
    }
  }
  return { ordered, edgeIds };
}

/** Upstream prerequisite cone of a single goal concept. */
export function prereqResult(map: LoadedMap, targetId: string): RouteResult {
  if (!map.nodeById.has(targetId)) return EMPTY_ROUTE;
  const adj = depAdjacency(map);
  const nodeIds = ancestors(adj, targetId);
  nodeIds.add(targetId);
  const { ordered, edgeIds } = orderAndEdges(map, adj, nodeIds);
  return { nodeIds, edgeIds, ordered, found: true };
}

/** All dependency paths between two concepts (the connecting subgraph). */
export function pathResult(map: LoadedMap, fromId: string, toId: string): RouteResult {
  if (!map.nodeById.has(fromId) || !map.nodeById.has(toId)) return EMPTY_ROUTE;
  const adj = depAdjacency(map);
  const down = descendants(adj, fromId); // dependents of `from`
  const up = ancestors(adj, toId); // prerequisites of `to`
  const found = fromId === toId || down.has(toId);
  if (!found) {
    // Show the endpoints so the user can see what they picked, but no route.
    return { nodeIds: new Set([fromId, toId]), edgeIds: new Set(), ordered: [], found: false };
  }
  const nodeIds = new Set<string>([fromId, toId]);
  for (const id of down) if (up.has(id)) nodeIds.add(id);
  const { ordered, edgeIds } = orderAndEdges(map, adj, nodeIds);
  return { nodeIds, edgeIds, ordered, found: true };
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
  return useMemo(() => {
    if (!map) return EMPTY_ROUTE;
    if (kind === "prereq") return to ? prereqResult(map, to) : EMPTY_ROUTE;
    return from && to ? pathResult(map, from, to) : EMPTY_ROUTE;
  }, [map, kind, from, to]);
}
