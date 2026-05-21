import functionalAnalysisRaw from "./maps/functional_analysis.json";
import fourierAnalysisRaw from "./maps/fourier_analysis.json";
import topologyRaw from "./maps/topology.json";
import dataWarehouseRaw from "./maps/data_warehouse.json";
interface MapCatalogEntry<Id extends string = string> {
  id: Id;
  label: string;
  description: string;
  raw: unknown;
}

export const MAP_CATALOG = {
  functional_analysis: {
    id: "functional_analysis",
    label: "Functional Analysis",
    description:
      "Normed spaces, Banach spaces, Hilbert spaces, operators, and duality.",
    raw: functionalAnalysisRaw,
  },
  fourier_analysis: {
    id: "fourier_analysis",
    label: "Fourier Analysis",
    description:
      "Fourier series, transforms, convergence, summability, and harmonic analysis.",
    raw: fourierAnalysisRaw,
  },
  topology: {
    id: "topology",
    label: "Topology",
    description:
      "Topological spaces, compactness, connectedness, and continuity.",
    raw: topologyRaw,
  },
  data_warehouse: {
    id: "data_warehouse",
    label: "Data Warehouse",
    description: "Data warehousing concepts, design, and implementation.",
    raw: dataWarehouseRaw,
  },
} as const satisfies Record<string, MapCatalogEntry>;

export type MapId = keyof typeof MAP_CATALOG;

type PublicMapEntry = Omit<(typeof MAP_CATALOG)[MapId], "raw">;

export const DEFAULT_MAP_ID: MapId = "functional_analysis";

function toPublicMaps<T extends Record<string, MapCatalogEntry>>(catalog: T) {
  return Object.fromEntries(
    Object.entries(catalog).map(([id, entry]) => {
      const { raw: _raw, ...metadata } = entry;
      return [id, metadata];
    }),
  ) as { [K in keyof T]: Omit<T[K], "raw"> };
}

export const MAPS = toPublicMaps(MAP_CATALOG) satisfies Record<
  MapId,
  PublicMapEntry
>;

export function isMapId(value: string | null): value is MapId {
  return value !== null && value in MAP_CATALOG;
}

export function getMapCatalogEntry(mapId: MapId = DEFAULT_MAP_ID) {
  return MAP_CATALOG[mapId];
}
