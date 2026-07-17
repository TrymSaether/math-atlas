/** Aggregate the extra lint passes (on top of SourceGraphSchema). */
import type { CliMap } from "../core/model.ts";
import type { Workspace } from "../core/workspace.ts";
import type { Diagnostic } from "../diagnostics/diagnostic.ts";
import * as structure from "./structure.ts";
import * as content from "./content.ts";
import * as diagrams from "./diagrams.ts";
import * as references from "./references.ts";
import * as suggestions from "./suggestions.ts";

export interface LintOptions {
  /** Run the (slower, advisory) suggestion heuristics. */
  suggest?: boolean;
}

export function runLints(map: CliMap, ws: Workspace, opts: LintOptions = {}): Diagnostic[] {
  const diags = [...structure.run(map), ...content.run(map), ...diagrams.run(map, ws), ...references.run(map)];
  if (opts.suggest) diags.push(...suggestions.run(map));
  return diags;
}
