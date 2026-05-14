import { Handle, Position, type NodeProps } from "reactflow";
import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../store";
import { KIND_LABEL, type GraphNode } from "../types";
import { Badge } from "./ui";
import { getKindTier } from "../lib/kindStyle";

interface Data {
  node: GraphNode;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
}

const TIER_STYLE = {
  primary: { w: 248, titleClamp: 2, titleSize: "text-[20px]", pad: "px-4 py-3.5" },
  secondary: { w: 212, titleClamp: 2, titleSize: "text-[16px]", pad: "px-3.5 py-3" },
  compact: { w: 178, titleClamp: 1, titleSize: "text-[14px]", pad: "px-3 py-2.5" },
} as const;

function GraphNodeCardComponent({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight } = data;
  const select = useStore((s) => s.select);
  const tier = getKindTier(node.kind);
  const tw = TIER_STYLE[tier];
  const isPrimary = tier === "primary";

  // Disable animations for better performance with large graphs
  const shouldAnimate = false;

  return (
    <motion.div
      layout={shouldAnimate}
      initial={shouldAnimate ? { opacity: 0, y: 5 } : false}
      animate={shouldAnimate ? { opacity: dim ? 0.28 : 1, y: 0 } : { opacity: dim ? 0.28 : 1 }}
      transition={shouldAnimate ? { duration: 0.2 } : undefined}
      onClick={() => select(node.id)}
      style={{ width: tw.w }}
      className={cn(
        `kind-${node.kind}`,
        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-[var(--node-bg)] shadow-[var(--node-shadow)]",
        tw.pad,
        "border-[rgba(var(--c),0.28)] text-[var(--text)]",
        "transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--c),0.55)] hover:bg-[var(--node-hover)] hover:shadow-[var(--node-hover-shadow)]",
        selected && "border-[rgba(var(--primary-rgb),0.85)] ring-2 ring-[rgba(var(--primary-rgb),0.24)]",
        highlight === "primary" && "ring-2 ring-[rgba(var(--primary-rgb),0.36)]",
        highlight === "anc" && "ring-1 ring-[rgba(var(--c),0.50)]",
        highlight === "desc" && "ring-1 ring-[rgba(var(--c),0.50)]"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[rgba(var(--c),0.82)]" />
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[var(--surface)] !bg-[rgba(var(--c),0.9)]" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {node.number && <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">{node.number}</div>}
          <div
            className={cn(
              "mt-1 font-serif font-semibold leading-[1.08] text-[var(--text)]",
              tw.titleSize,
              tw.titleClamp === 1 ? "line-clamp-1" : "line-clamp-2"
            )}
          >
            {node.title}
          </div>
        </div>
        {selected ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
        ) : (
          <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-[rgba(var(--c),0.42)] bg-[var(--surface)]" />
        )}
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge tone="kind" className={cn("rounded-md px-1.5 py-0 text-[9px] uppercase tracking-[0.12em]", !isPrimary && "opacity-90")}>
          {KIND_LABEL[node.kind] ?? node.kind}
        </Badge>
        {isPrimary && node.topicCluster && (
          <span className="truncate text-[10px] text-[var(--muted)]">{node.topicCluster}</span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[var(--surface)] !bg-[rgba(var(--c),0.9)]" />
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders when props don't change
export const GraphNodeCard = memo(GraphNodeCardComponent);
