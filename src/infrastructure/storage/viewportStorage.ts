import type { MapId } from "../../data/mapRegistry";

export const VIEWPORT_STORAGE_KEY = "math-atlas-viewports-v1";

export interface StoredViewport {
  x: number;
  y: number;
  zoom: number;
}

type ViewMode = "dependency" | "cluster";

interface PersistedViewportState {
  version: 1;
  maps: Partial<Record<MapId, Partial<Record<ViewMode, StoredViewport>>>>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function emptyState(): PersistedViewportState {
  return { version: 1, maps: {} };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeViewport(value: unknown): StoredViewport | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Partial<StoredViewport>;
  if (!isFiniteNumber(candidate.x) || !isFiniteNumber(candidate.y) || !isFiniteNumber(candidate.zoom)) {
    return null;
  }
  return {
    x: candidate.x,
    y: candidate.y,
    zoom: Math.min(2.4, Math.max(0.08, candidate.zoom)),
  };
}

function readViewportState(storage: StorageLike | null = browserStorage()): PersistedViewportState {
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(VIEWPORT_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return emptyState();
    const record = parsed as { version?: unknown; maps?: unknown };
    if (record.version !== 1 || typeof record.maps !== "object" || record.maps === null || Array.isArray(record.maps)) {
      return emptyState();
    }
    return { version: 1, maps: record.maps as PersistedViewportState["maps"] };
  } catch {
    return emptyState();
  }
}

export function savedViewportFor(
  mapId: MapId,
  view: ViewMode,
  storage: StorageLike | null = browserStorage(),
): StoredViewport | null {
  return normalizeViewport(readViewportState(storage).maps[mapId]?.[view]);
}

export function saveViewport(
  mapId: MapId,
  view: ViewMode,
  viewport: StoredViewport,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return;
  const state = readViewportState(storage);
  state.maps[mapId] = {
    ...(state.maps[mapId] ?? {}),
    [view]: normalizeViewport(viewport) ?? viewport,
  };
  try {
    storage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore private-mode / quota failures */
  }
}
