/**
 * Diagram lints: a `diagram` field that points at a missing SVG (broken ref) and
 * SVGs sitting in the map's diagram folder that no concept references (dead
 * assets). Resolves `/atlas-assets/<map>/diagrams/foo.svg` against `public/`.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CliMap } from "../core/model.ts";
import type { Workspace } from "../core/workspace.ts";
import { type Diagnostic, warning, suggestion } from "../diagnostics/diagnostic.ts";

/** Map a leading-slash public URL to an absolute filesystem path. */
export function diagramFsPath(ws: Workspace, ref: string): string {
  const rel = ref.replace(/^\//, "");
  return join(ws.publicDir, rel);
}

export function run(map: CliMap, ws: Workspace): Diagnostic[] {
  const out: Diagnostic[] = [];
  const referenced = new Set<string>();

  for (const c of map.source.concepts) {
    if (!c.diagram) continue;
    referenced.add(c.diagram);
    const fsPath = diagramFsPath(ws, c.diagram);
    if (!existsSync(fsPath)) {
      out.push(
        warning({
          code: "diagram/missing-file",
          map: map.id,
          file: map.fileName,
          conceptId: c.id,
          path: `concepts.${c.id}.diagram`,
          message: `diagram for '${c.id}' not found: ${c.diagram}`,
          hint: `expected file at public${c.diagram}`,
        }),
      );
    }
  }

  // Dead assets: SVGs in this map's diagram folder that nothing references.
  const dir = join(ws.publicDir, "atlas-assets", map.id, "diagrams");
  if (existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".svg")) continue;
      const ref = `/atlas-assets/${map.id}/diagrams/${file}`;
      if (!referenced.has(ref)) {
        out.push(
          suggestion({
            code: "diagram/unreferenced",
            map: map.id,
            file: map.fileName,
            path: ref,
            message: `unreferenced diagram asset: ${ref}`,
            hint: "attach it with `atlas diagram attach <concept> <path>` or remove it",
          }),
        );
      }
    }
  }

  return out;
}
