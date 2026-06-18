/**
 * Map identity. Maps are loaded from the API at runtime (see mapsApi.ts /
 * loadMap.ts); the catalog lives in the store. A `MapId` is a stable map slug
 * (e.g. "topology") — historically a fixed union, now any catalog slug.
 */
export type MapId = string;

/** Slug shown on first load when none is persisted. */
export const DEFAULT_MAP_ID: MapId = "fourier_analysis";

export function isMapId(value: string | null | undefined): value is MapId {
  return typeof value === "string" && value.length > 0;
}
