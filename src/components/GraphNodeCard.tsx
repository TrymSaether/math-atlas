import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
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
  primary: { w: 248, titleClamp: 2, titleSize: "text-[13px]", pad: "px-3 py-2.5" },
  secondary: { w: 212, titleClamp: 2, titleSize: "text-[12px]", pad: "px-2.5 py-2" },
  compact: { w: 178, titleClamp: 1, titleSize: "text-[11px]", pad: "px-2 py-1.5" },
} as const;

export function GraphNodeCard({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight } = data;
  const select = useStore((s) => s.select);
  const tier = getKindTier(node.kind);
  const tw = TIER_STYLE[tier];
  const isPrimary = tier === "primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: dim ? 0.26 : 1, y: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => select(node.id)}
      style={{ width: tw.w }}
      className={cn(
        `kind-${node.kind}`,
        "group relative cursor-pointer overflow-hidden rounded-2xl border font-display",
        tw.pad,
        "border-white/10 bg-ink-900/72 shadow-[0_12px_36px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md",
        "transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--c),0.55)] hover:bg-ink-800/80",
        selected && "ring-2 ring-[rgba(var(--c),0.85)]",
        highlight === "primary" && "ring-2 ring-white/75",
        highlight === "anc" && "ring-1 ring-accent-cyan/60",
        highlight === "desc" && "ring-1 ring-accent-violet/60"
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[rgba(var(--c),0.72)]" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />

      <div className="flex items-center justify-between gap-2 pl-1.5">
        <Badge tone="kind" className={cn("rounded-md px-1.5 py-0 text-[9px] uppercase tracking-[0.14em]", !isPrimary && "opacity-80")}>
          {KIND_LABEL[node.kind]}
        </Badge>
        {node.number && <span className="shrink-0 font-mono text-[10px] text-white/32">{node.number}</span>}
      </div>

      <div
        className={cn(
          "mt-2 pl-1.5 font-semibold leading-snug text-white/92",
          tw.titleSize,
          tw.titleClamp === 1 ? "line-clamp-1" : "line-clamp-2"
        )}
      >
        {node.title}
      </div>

      {isPrimary && (
        <div className="mt-2 flex min-w-0 items-center gap-1.5 pl-1.5 text-[10px] text-white/44">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(var(--c),0.9)]" />
          <span className="truncate">{node.topicCluster}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  );
}
