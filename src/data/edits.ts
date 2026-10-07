/**
 * Authoring overlay persistence.
 *
 * Math Atlas is a static SPA with no backend, so user edits are kept as a
 * per-map *source overlay* in localStorage. On load, if a map has an overlay we
 * build the runtime graph from it (same strict validation + buildArtifact as the
 * CLI); otherwise the shipped artifact is used unchanged. Authors can export the
 * overlay as a `*.source.json` to commit back into the real build pipeline, or
 * revert to the built-in map (which clears the overlay).
 *
 * The overlay stores the full edited SourceGraph (not a diff) plus the base
 * artifact `version` it was branched from, so a shipped map update can be
 * detected and surfaced rather than silently shadowed.
 */
import { isMapId, type MapId } from "./mapRegistry";

const EDITS_STORAGE_KEY = "math-atlas-edits-v1";
const EDITS_VERSION = 1;

export interface MapOverlay {
  /** Artifact `version` of the built-in map this overlay was branched from. */
  baseVersion: number;
  /** ISO date the overlay was last written. */
  updated: string;
  /** The full edited source graph (unparsed; validated when built). */
  source: unknown;
}

interface EditsFile {
  version: typeof EDITS_VERSION;
  maps: Partial<Record<MapId, MapOverlay>>;
}

function readFile(): EditsFile {
  if (typeof localStorage === "undefined") return { version: EDITS_VERSION, maps: {} };
  try {
    const raw = localStorage.getItem(EDITS_STORAGE_KEY);
    if (!raw) return { version: EDITS_VERSION, maps: {} };
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== EDITS_VERSION
    ) {
      return { version: EDITS_VERSION, maps: {} };
    }
    const record = parsed as { maps?: unknown };
    const maps: Partial<Record<MapId, MapOverlay>> = {};
    if (typeof record.maps === "object" && record.maps !== null) {
      for (const [key, value] of Object.entries(record.maps)) {
        if (isMapId(key) && isOverlay(value)) maps[key] = value;
      }
    }
    return { version: EDITS_VERSION, maps };
  } catch {
    return { version: EDITS_VERSION, maps: {} };
  }
}

function isOverlay(value: unknown): value is MapOverlay {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.baseVersion === "number" &&
    typeof v.updated === "string" &&
    typeof v.source === "object" &&
    v.source !== null
  );
}

function writeFile(file: EditsFile): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(EDITS_STORAGE_KEY, JSON.stringify(file));
  } catch {
    /* ignore private-mode / quota failures */
  }
}

export function readOverlay(mapId: MapId): MapOverlay | null {
  return readFile().maps[mapId] ?? null;
}

export function hasOverlay(mapId: MapId): boolean {
  return readOverlay(mapId) !== null;
}

export function writeOverlay(mapId: MapId, overlay: MapOverlay): void {
  const file = readFile();
  file.maps[mapId] = overlay;
  writeFile(file);
}

export function clearOverlay(mapId: MapId): void {
  const file = readFile();
  if (mapId in file.maps) {
    delete file.maps[mapId];
    writeFile(file);
  }
}
