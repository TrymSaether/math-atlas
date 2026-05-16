import fourierAnalysisRaw from "./maps/fourier_analysis.json";
import functionalAnalysisRaw from "./maps/functional_analysis.json";
import topologyRaw from "./maps/topology.json";
import { FieldJsonSchema, type GraphData } from "../types";
import { createGraphIndexes, uniqueSorted, type GraphIndexes } from "./graphIndexes";
import { normalizeFieldGraph } from "./normalizeFieldGraph";
import { DEFAULT_MAP_ID, getMapDescriptor, type MapId, type RegisteredMap } from "./mapRegistry";

const RAW_MAPS = {
  functional_analysis: functionalAnalysisRaw,
  topology: topologyRaw,
  fourier_analysis: fourierAnalysisRaw,
} satisfies Record<MapId, unknown>;

export interface LoadedMap extends GraphIndexes {
  readonly id: MapId;
  readonly descriptor: RegisteredMap;
  readonly data: GraphData;
  readonly kinds: readonly string[];
  readonly relations: readonly string[];
  readonly topics: readonly string[];
}

export type LoadMapResult =
  | Readonly<{ ok: true; value: LoadedMap }>
  | Readonly<{ ok: false; error: Error }>;

export function loadMap(mapId: MapId = DEFAULT_MAP_ID): LoadedMap {
  const result = tryLoadMap(mapId);

  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

export function tryLoadMap(mapId: MapId = DEFAULT_MAP_ID): LoadMapResult {
  try {
    return { ok: true, value: createLoadedMap(mapId) };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

function createLoadedMap(mapId: MapId): LoadedMap {
  const parsed = FieldJsonSchema.parse(RAW_MAPS[mapId]);
  const data = normalizeFieldGraph(parsed);
  const indexes = createGraphIndexes(data);

  return {
    id: mapId,
    descriptor: getMapDescriptor(mapId),
    data,
    ...indexes,
    kinds: uniqueSorted(data.nodes.map((node) => node.kind)),
    relations: uniqueSorted(data.edges.map((edge) => edge.relation)),
    topics: data.domains.map((domain) => domain.id),
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
