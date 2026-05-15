import { Handle, Position, type NodeProps } from "reactflow";
import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useStore, type LearningState } from "../store";
import type { GraphNode } from "../types";
import { getKindAbbrev, getKindTier } from "../lib/kindStyle";

export type RouteRole = "from" | "to" | "waypoint" | null;

interface Data {
  node: GraphNode;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
  learningState?: LearningState;
  routeRole?: RouteRole;
  routeNonce?: number;
  hasIncoming?: boolean;
  hasOutgoing?: boolean;
}

const TIER_WIDTH = { primary: 208, secondary: 184, compact: 160 } as const;

/** Corner status badge — mirrors the design kit's node-state glyphs. */
function StateBadge({ state, selected }: { state: LearningState; selected: boolean }) {
  if (selected) {
    return (
      <span className="absolute -right-[7px] -top-[7px] flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.18)]" style={{ background: "rgb(var(--c))" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4 4 10-10" />
        </svg>
      </span>
    );
  }
  if (state === "learned") {
    return (
      <span className="absolute -right-[7px] -top-[7px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--success)] shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4 4 10-10" />
        </svg>
      </span>
    );
  }
  if (state === "in-progress") {
    return (
      <span className="absolute -right-[7px] -top-[7px] h-[18px] w-[18px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" style={{ stroke: "rgb(var(--c))" }} strokeWidth="2" />
          <path d="M12 2 a10 10 0 0 1 0 20 z" style={{ fill: "rgb(var(--c))" }} />
        </svg>
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span className="absolute -right-[7px] -top-[7px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--faint)] shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="11" width="12" height="9" rx="1.5" />
          <path d="M8.5 11V8a3.5 3.5 0 017 0v3" />
        </svg>
      </span>
    );
  }
  return null;
}

function GraphNodeCardComponent({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight, learningState, routeRole, hasIncoming, hasOutgoing } = data;
  const select = useStore((s) => s.select);
  const tier = getKindTier(node.kind);
  const width = TIER_WIDTH[tier];
  const state: LearningState = learningState ?? "not-started";
  const onRoute = routeRole != null;
  const accented = selected || onRoute || highlight === "primary";

  return (
    <motion.div
      animate={{ opacity: dim ? 0.32 : 1 }}
      onClick={() => select(node.id)}
      style={{ width }}
      className={cn(
        `kind-${node.kind}`,
        "group relative cursor-pointer rounded-[10px] border-[1.5px] px-3 py-2.5 shadow-[var(--shadow-1)] transition-all",
        "hover:border-[rgb(var(--c))] hover:shadow-[var(--shadow-2)]",
        state === "locked"
          ? "border-[var(--border)] bg-[var(--surface-muted)] opacity-[0.62]"
          : "border-[var(--border)] bg-[var(--node-bg)]",
        accented && "border-[rgb(var(--c))] shadow-[0_0_0_4px_rgba(var(--c),0.16),var(--shadow-1)]",
        highlight === "anc" && !accented && "border-[rgba(var(--c),0.55)]",
        highlight === "desc" && !accented && "border-[rgba(var(--c),0.55)]"
      )}
    >
      <StateBadge state={state} selected={selected} />
      {onRoute && (
        <span className="absolute -left-[7px] -top-[7px] rounded-[4px] bg-[var(--primary)] px-1 py-[1px] text-[8px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
          {routeRole === "from" ? "From" : routeRole === "to" ? "To" : "Route"}
        </span>
      )}

      {hasIncoming && (
        <Handle type="target" position={Position.Left} className="graph-node-handle graph-node-handle-left" />
      )}

      <div className="flex items-center gap-1.5">
        <span
          className="rounded-[4px] border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-[0.06em]"
          style={{
            color: "rgb(var(--c))",
            background: "rgba(var(--c),0.10)",
            borderColor: "rgba(var(--c),0.30)",
          }}
        >
          {getKindAbbrev(node.kind)}
        </span>
        {node.number && (
          <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--muted)]">
            {node.number}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-1 text-[13.5px] font-semibold leading-[1.3]",
          tier === "compact" ? "line-clamp-1" : "line-clamp-2",
          state === "locked" ? "text-[var(--faint)]" : "text-[var(--text)]"
        )}
      >
        {node.title}
      </div>

      {hasOutgoing && (
        <Handle type="source" position={Position.Right} className="graph-node-handle graph-node-handle-right" />
      )}
    </motion.div>
  );
}

export const GraphNodeCard = memo(GraphNodeCardComponent);
