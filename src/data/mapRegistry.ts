interface MapCatalogEntry<Id extends string = string> {
  id: Id;
  label: string;
  description: string;
}

export const MAPS = {
  functional_analysis: {
    id: "functional_analysis",
    label: "Functional Analysis",
    description:
      "Normed spaces, Banach spaces, Hilbert spaces, operators, and duality.",
  },
  fourier_analysis: {
    id: "fourier_analysis",
    label: "Fourier Analysis",
    description:
      "Fourier series, transforms, convergence, summability, and harmonic analysis.",
  },
  topology: {
    id: "topology",
    label: "Topology",
    description:
      "Topological spaces, compactness, connectedness, and continuity.",
  },
  data_warehouse: {
    id: "data_warehouse",
    label: "Data Warehouse",
    description: "Data warehousing concepts, design, and implementation.",
  },
} as const satisfies Record<string, MapCatalogEntry>;

export type MapId = keyof typeof MAPS;

export const DEFAULT_MAP_ID: MapId = "functional_analysis";

const MAP_LOADERS = {
  functional_analysis: () => import("./maps/functional_analysis.json"),
  fourier_analysis: () => import("./maps/fourier_analysis.json"),
  topology: () => import("./maps/topology.json"),
  data_warehouse: () => import("./maps/data_warehouse.json"),
} satisfies Record<MapId, () => Promise<{ default: unknown }>>;

export function isMapId(value: string | null): value is MapId {
  return value !== null && value in MAPS;
}

export async function loadRawMap(mapId: MapId = DEFAULT_MAP_ID): Promise<unknown> {
  const module = await MAP_LOADERS[mapId]();
  return module.default;
}
