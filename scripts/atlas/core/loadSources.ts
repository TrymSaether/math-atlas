/**
 * Source discovery + raw read. Returns every `<id>.source.json` with its raw
 * text (kept for codeframes) and a parsed-but-unvalidated JSON value. Schema
 * validation is the caller's job — `validate` wants the Zod errors, other
 * commands want a built CliMap; both start here.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Workspace } from "./workspace";

export interface SourceFile {
  /** Map id, i.e. filename without `.source.json`. */
  mapId: string;
  /** Bare filename, e.g. `topology.source.json`. */
  fileName: string;
  /** Absolute path. */
  path: string;
  /** Raw file text (for codeframes / formatting diffs). */
  raw: string;
  /** Parsed JSON, or a parse error if the JSON itself is malformed. */
  json: unknown;
  jsonError?: SyntaxError;
}

export function listSourceFiles(ws: Workspace): SourceFile[] {
  if (!existsSync(ws.mapsDir)) {
    throw new Error(`maps directory not found: ${ws.mapsDir}`);
  }
  const files = readdirSync(ws.mapsDir)
    .filter((f) => f.endsWith(".source.json"))
    .sort();
  return files.map((fileName) => {
    const path = join(ws.mapsDir, fileName);
    const raw = readFileSync(path, "utf8");
    let json: unknown = undefined;
    let jsonError: SyntaxError | undefined;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      jsonError = err as SyntaxError;
    }
    return {
      mapId: fileName.replace(/\.source\.json$/, ""),
      fileName,
      path,
      raw,
      json,
      jsonError,
    };
  });
}

/** Apply a `--map` filter; throws a friendly error when the id is unknown. */
export function filterByMap(files: SourceFile[], mapId?: string): SourceFile[] {
  if (!mapId) return files;
  const hit = files.filter((f) => f.mapId === mapId);
  if (hit.length === 0) {
    const known = files.map((f) => f.mapId).join(", ");
    throw new Error(`unknown map '${mapId}'. Available: ${known}`);
  }
  return hit;
}
