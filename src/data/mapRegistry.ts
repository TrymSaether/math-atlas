type MapDescriptor<TId extends string = string> = Readonly<{
  id: TId;
  label: string;
  description: string;
}>;

type MapRegistry<T extends string> = Readonly<{
  [K in T]: MapDescriptor<K>;
}>;

const defineMapRegistry = <const T extends MapRegistry<keyof T & string>>(registry: T): T => registry;

export const MAPS = defineMapRegistry({
  functional_analysis: {
    id: "functional_analysis",
    label: "Functional Analysis",
    description: "Normed spaces, Banach spaces, Hilbert spaces, operators, and duality.",
  },
  topology: {
    id: "topology",
    label: "Topology",
    description: "Topological spaces, compactness, connectedness, and continuity.",
  },
  fourier_analysis: {
    id: "fourier_analysis",
    label: "Fourier Analysis",
    description: "Fourier series, Fourier transforms, convergence, distributions, and harmonic analysis.",
  },
});

export type MapId = keyof typeof MAPS;
export type RegisteredMap = (typeof MAPS)[MapId];

export const DEFAULT_MAP_ID = "functional_analysis" satisfies MapId;
export const MAP_IDS = Object.keys(MAPS) as readonly MapId[];

const hasOwn = <T extends object>(object: T, key: PropertyKey): key is keyof T =>
  Object.prototype.hasOwnProperty.call(object, key);

export function isMapId(value: unknown): value is MapId {
  return typeof value === "string" && hasOwn(MAPS, value);
}

export function parseMapId(value: unknown): MapId | null {
  return isMapId(value) ? value : null;
}

export function assertMapId(value: unknown): asserts value is MapId {
  if (!isMapId(value)) {
    const expected = MAP_IDS.join(", ");
    throw new TypeError(`Unknown map id: ${String(value)}. Expected one of: ${expected}.`);
  }
}

export function getMapDescriptor(mapId: MapId): RegisteredMap {
  return MAPS[mapId];
}
