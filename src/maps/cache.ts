/**
 * Client-side cache of API map data, so the site still renders when the backend
 * is slow or asleep (the runtime equivalent of the old bundled artifacts — not a
 * build artifact). Cache-first with background revalidation; written through on
 * save. localStorage for now (note: move to IndexedDB if the payloads grow).
 */
import type { CatalogEntry, MapPayload } from "./api";

const CATALOG_KEY = "math-atlas-catalog-v1";
const SOURCE_PREFIX = "math-atlas-mapsrc-v1:";

function browserStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function read<T>(key: string): T | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

export function getCachedCatalog(): CatalogEntry[] | null {
  return read<CatalogEntry[]>(CATALOG_KEY);
}

export function setCachedCatalog(catalog: CatalogEntry[]): void {
  write(CATALOG_KEY, catalog);
}

export function getCachedMap(id: string): MapPayload | null {
  return read<MapPayload>(SOURCE_PREFIX + id);
}

export function setCachedMap(payload: MapPayload): void {
  write(SOURCE_PREFIX + payload.id, payload);
}

export function clearCachedMap(id: string): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.removeItem(SOURCE_PREFIX + id);
  } catch {
    /* ignore */
  }
}
