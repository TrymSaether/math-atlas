/**
 * `NodeViz` — the embeddable form of the workspace engine.
 *
 * Any atlas node (or concept page, figure, card) can drop in a live, compact
 * visualization just by referencing a prepared workspace id, or by passing a
 * `Workspace` document inline. It runs the same engine + Mafs plane as the full
 * sandbox, so "visualize anything node-related" is a one-liner:
 *
 *   <NodeViz workspaceId="unit-circle" />
 *   <NodeViz workspace={myDoc} interactive height={220} />
 *
 * It holds its own local copy so dragging free points / sliders animates the
 * preview without touching the global sandbox state.
 */

import { useMemo, useState } from "react";
import { compile } from "../../lib/workspace/engine";
import { loadWorkspace } from "../../lib/workspace/library";
import type { Value } from "../../lib/workspace/expr";
import type { Workspace } from "../../lib/workspace/types";
import { PlaneView } from "./PlaneView";

export interface NodeVizProps {
  /** Atlas-linked: load a prepared workspace by id. */
  workspaceId?: string;
  /** …or supply a workspace document directly. */
  workspace?: Workspace;
  /** Allow dragging free points inside the embed. */
  interactive?: boolean;
  height?: number;
  /** Show grid labels + point names (off by default for small chips). */
  detailed?: boolean;
  /** Optional caption rendered under the plane. */
  caption?: string;
}

export function NodeViz({
  workspaceId,
  workspace,
  interactive = false,
  height = 200,
  detailed = false,
  caption,
}: NodeVizProps) {
  const initial = useMemo<Workspace>(
    () => workspace ?? loadWorkspace(workspaceId ?? "blank"),
    [workspace, workspaceId],
  );
  const [values, setValues] = useState<Record<string, Value>>(initial.values);

  const ws = useMemo<Workspace>(() => ({ ...initial, values }), [initial, values]);
  const compiled = useMemo(() => compile(ws), [ws]);

  return (
    <figure
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <PlaneView
        rows={ws.rows}
        compiled={compiled}
        viewport={ws.viewport}
        marks={ws.marks}
        compact={!detailed}
        pan={interactive}
        height={height}
        onMovePoint={interactive ? (id, p) => setValues((v) => ({ ...v, [id]: p })) : undefined}
      />
      {caption && (
        <figcaption
          className="border-t px-3 py-1.5 text-[11px]"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
