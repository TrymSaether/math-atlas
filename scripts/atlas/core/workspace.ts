/**
 * Workspace resolution. The CLI lives at scripts/atlas/, so the repo root is two
 * levels up from this module regardless of the caller's cwd. Everything else
 * (maps dir, public assets) hangs off that root, with env overrides for tests.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url)); // scripts/atlas/core
export const REPO_ROOT = join(HERE, "..", "..", "..");

export interface Workspace {
  root: string;
  mapsDir: string;
  publicDir: string;
  cacheDir: string;
}

export function resolveWorkspace(): Workspace {
  const root = process.env.ATLAS_ROOT ?? REPO_ROOT;
  return {
    root,
    mapsDir: process.env.MAPS_DIR ?? join(root, "src", "maps", "sources"),
    publicDir: process.env.ATLAS_PUBLIC ?? join(root, "public"),
    cacheDir: join(root, "node_modules", ".cache", "atlas"),
  };
}
