/**
 * Content-hash cache for incremental builds. Keyed by map id → sha256 of the
 * source text, persisted under node_modules/.cache/atlas. `build` skips any map
 * whose hash is unchanged (unless --force), so rebuilding one map doesn't touch
 * the others.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Workspace } from "./workspace";

const CACHE_FILE = "build-cache.json";

export type CacheState = Record<string, string>; // mapId -> source hash

export function hashSource(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export function loadCache(ws: Workspace): CacheState {
  const path = join(ws.cacheDir, CACHE_FILE);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CacheState;
  } catch {
    return {};
  }
}

export function saveCache(ws: Workspace, state: CacheState): void {
  if (!existsSync(ws.cacheDir)) mkdirSync(ws.cacheDir, { recursive: true });
  writeFileSync(join(ws.cacheDir, CACHE_FILE), JSON.stringify(state, null, 2) + "\n");
}
