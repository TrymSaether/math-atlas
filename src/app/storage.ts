import { isMapId, type MapId } from "@/maps/registry";

export const APP_STATE_STORAGE_KEY = "math-atlas-state-v1";
export const PERSISTED_STATE_VERSION = 1;

export interface PersistedMapState {
  search?: string;
  kinds?: string[];
  topics?: string[];
  relations?: string[];
  selectedId?: string | null;
  recents?: string[];
  routeFrom?: string | null;
  routeTo?: string | null;
}

export interface PersistedState {
  version: typeof PERSISTED_STATE_VERSION;
  mapId?: MapId;
  searchScope?: "all" | "title";
  view?: "dependency" | "cluster";
  showSoftDeps?: boolean;
  edgeStyle?: "smooth" | "straight" | "bezier";
  edgeLabelStyle?: "prose" | "terse";
  focusMode?: boolean;
  focusDepth?: number;
  showGrid?: boolean;
  showRegions?: boolean;
  showMinimap?: boolean;
  surface?: "atlas" | "dictionary" | "flashcards" | "sandbox";
  mode?: "explore" | "paths";
  routeKind?: "prereq" | "path";
  routeIncludeProof?: boolean;
  maps?: Partial<Record<MapId, PersistedMapState>>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readPersistedState(storage: StorageLike | null = browserStorage()): unknown | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== PERSISTED_STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePersistedState(state: PersistedState, storage: StorageLike | null = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore private-mode / quota failures */
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function normalizePersistedMapState(value: unknown): PersistedMapState | undefined {
  if (!isRecord(value)) return undefined;
  return {
    search: asString(value.search),
    kinds: asStringArray(value.kinds),
    topics: asStringArray(value.topics),
    relations: asStringArray(value.relations),
    selectedId: asNullableString(value.selectedId),
    routeFrom: asNullableString(value.routeFrom),
    routeTo: asNullableString(value.routeTo),
  };
}

export function normalizePersistedState(value: unknown | null): PersistedState | null {
  if (!isRecord(value)) return null;
  const maps: Partial<Record<MapId, PersistedMapState>> = {};
  if (isRecord(value.maps)) {
    for (const [key, mapState] of Object.entries(value.maps)) {
      if (!isMapId(key)) continue;
      const normalized = normalizePersistedMapState(mapState);
      if (normalized) maps[key] = normalized;
    }
  }
  return {
    version: PERSISTED_STATE_VERSION,
    mapId: typeof value.mapId === "string" && isMapId(value.mapId) ? value.mapId : undefined,
    searchScope: value.searchScope === "all" || value.searchScope === "title" ? value.searchScope : undefined,
    view: value.view === "dependency" || value.view === "cluster" ? value.view : undefined,
    showSoftDeps: asBoolean(value.showSoftDeps),
    edgeStyle:
      value.edgeStyle === "smooth" || value.edgeStyle === "straight" || value.edgeStyle === "bezier"
        ? value.edgeStyle
        : undefined,
    edgeLabelStyle:
      value.edgeLabelStyle === "prose" || value.edgeLabelStyle === "terse" ? value.edgeLabelStyle : undefined,
    focusMode: asBoolean(value.focusMode),
    focusDepth:
      typeof value.focusDepth === "number" && Number.isFinite(value.focusDepth)
        ? Math.min(3, Math.max(1, Math.round(value.focusDepth)))
        : undefined,
    showGrid: asBoolean(value.showGrid),
    showRegions: asBoolean(value.showRegions),
    showMinimap: asBoolean(value.showMinimap),
    surface:
      value.surface === "atlas" ||
      value.surface === "dictionary" ||
      value.surface === "flashcards" ||
      value.surface === "sandbox"
        ? value.surface
        : undefined,
    mode: value.mode === "explore" || value.mode === "paths" ? value.mode : undefined,
    routeKind: value.routeKind === "prereq" || value.routeKind === "path" ? value.routeKind : undefined,
    routeIncludeProof: asBoolean(value.routeIncludeProof),
    maps,
  };
}
