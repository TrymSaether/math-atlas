import { Handle, Position, type NodeProps } from "reactflow";
import { memo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useStore } from "../store";
import type { GraphNode } from "../types";
import { getKindAbbrev, getKindColor, getKindTier } from "../lib/kindStyle";
import type { SemanticDetail } from "../hooks/useSemanticZoom";

export type RouteRole = "from" | "to" | "waypoint" | null;

interface Data {
  node: GraphNode;
  detail?: SemanticDetail;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
  routeRole?: RouteRole;
  routeNonce?: number;
  hasIncoming?: boolean;
  hasOutgoing?: boolean;
  incomingHandleColor?: string;
  outgoingHandleColor?: string;
}

const CARD_WIDTH = { primary: 208, secondary: 184, compact: 160 } as const;
const TITLE_WIDTH = { primary: 196, secondary: 176, compact: 152 } as const;
const DOT_SIZE = { primary: 28, secondary: 22, compact: 16 } as const;

function handleStyle(color?: string): CSSProperties {
  return {
    opacity: color ? 1 : 0,
    pointerEvents: "none",
    background: color ?? "transparent",
    borderColor: "var(--surface)",
  };
}

function GraphNodeCardComponent({ data, selected }: NodeProps<Data>) {
  const {
    node,
    detail = "card",
    dim,
    highlight,
    routeRole,
    hasIncoming,
    hasOutgoing,
    incomingHandleColor,
    outgoingHandleColor,
  } = data;
  const select = useStore((s) => s.select);
  const tier = getKindTier(node.kind);
  const kindColor = getKindColor(node.kind);
  const onRoute = routeRole != null;
  const accented = selected || onRoute || highlight === "primary";
  const opacity = dim ? 0.3 : 1;

  if (detail === "dot") {
    const size = DOT_SIZE[tier];
    return (
      <motion.div
        animate={{ opacity }}
        onClick={() => select(node.id)}
        title={node.title}
        style={{ width: size, height: size, background: kindColor, borderColor: "var(--surface)" }}
        className={cn(
          "rounded-full border-[1.5px] shadow-[var(--shadow-1)] transition-transform hover:scale-110",
          accented && "ring-2 ring-offset-1 ring-offset-[var(--bg)]",
        )}
      >
        {hasIncoming && <Handle type="target" position={Position.Left} style={handleStyle(incomingHandleColor)} />}
        {hasOutgoing && <Handle type="source" position={Position.Right} style={handleStyle(outgoingHandleColor)} />}
      </motion.div>
    );
  }

  if (detail === "title") {
    const width = TITLE_WIDTH[tier];
    return (
      <motion.div
        animate={{ opacity }}
        onClick={() => select(node.id)}
        style={{
          width,
          borderColor: accented ? kindColor : "var(--border)",
          background: "color-mix(in srgb, var(--surface) 94%, transparent)",
          boxShadow: accented ? `0 0 0 3px color-mix(in srgb, ${kindColor} 18%, transparent), var(--shadow-1)` : "var(--shadow-1)",
        }}
        className="relative rounded-pill border px-3 py-1.5 text-left transition hover:-translate-y-px"
      >
        {hasIncoming && <Handle type="target" position={Position.Left} className="graph-node-handle graph-node-handle-left" style={handleStyle(incomingHandleColor)} />}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kindColor }} />
          <span className="truncate text-[12px] font-semibold" style={{ color: "var(--fg-1)" }}>{node.title}</span>
        </div>
        {hasOutgoing && <Handle type="source" position={Position.Right} className="graph-node-handle graph-node-handle-right" style={handleStyle(outgoingHandleColor)} />}
      </motion.div>
    );
  }

  const width = CARD_WIDTH[tier];
  return (
    <motion.div
      animate={{ opacity }}
      onClick={() => select(node.id)}
      style={{
        width,
        borderColor: accented || highlight ? kindColor : "var(--border)",
        background: "color-mix(in srgb, var(--surface) 96%, transparent)",
        boxShadow: accented
          ? `0 0 0 4px color-mix(in srgb, ${kindColor} 16%, transparent), var(--shadow-2)`
          : "var(--shadow-1)",
      }}
      className="group relative rounded-[10px] border-[1.5px] px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]"
    >
      {onRoute && (
        <span
          className="absolute -left-[7px] -top-[7px] rounded-[5px] px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-[0.1em]"
          style={{ background: "var(--accent)", color: "var(--fg-on-color)" }}
        >
          {routeRole === "from" ? "From" : routeRole === "to" ? "To" : "Route"}
        </span>
      )}
      {hasIncoming && <Handle type="target" position={Position.Left} className="graph-node-handle graph-node-handle-left" style={handleStyle(incomingHandleColor)} />}
      <div className="flex items-center gap-1.5">
        <span
          className="rounded-[5px] border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-[0.06em]"
          style={{
            color: kindColor,
            background: `color-mix(in srgb, ${kindColor} 10%, transparent)`,
            borderColor: `color-mix(in srgb, ${kindColor} 30%, transparent)`,
          }}
        >
          {getKindAbbrev(node.kind)}
        </span>
        {node.number && (
          <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: "var(--fg-3)" }}>
            {node.number}
          </span>
        )}
      </div>
      <div
        className={cn("mt-1 text-[13.5px] font-semibold leading-[1.3]", tier === "compact" ? "line-clamp-1" : "line-clamp-2")}
        style={{ color: "var(--fg-1)" }}
      >
        {node.title}
      </div>
      {hasOutgoing && <Handle type="source" position={Position.Right} className="graph-node-handle graph-node-handle-right" style={handleStyle(outgoingHandleColor)} />}
    </motion.div>
  );
}

export const GraphNodeCard = memo(GraphNodeCardComponent);
