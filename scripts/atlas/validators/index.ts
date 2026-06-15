/** Aggregate the extra lint passes (on top of SourceGraphSchema). */
import type { CliMap } from "../core/model";
import type { Workspace } from "../core/workspace";
import type { Diagnostic } from "../diagnostics/diagnostic";
import * as structure from "./structure";
import * as content from "./content";
import * as diagrams from "./diagrams";
import * as references from "./references";
import * as suggestions from "./suggestions";

export interface LintOptions {
  /** Run the (slower, advisory) suggestion heuristics. */
  suggest?: boolean;
}

export function runLints(
  map: CliMap,
  ws: Workspace,
  opts: LintOptions = {},
): Diagnostic[] {
  const diags = [
    ...structure.run(map),
    ...content.run(map),
    ...diagrams.run(map, ws),
    ...references.run(map),
  ];
  if (opts.suggest) diags.push(...suggestions.run(map));
  return diags;
}
