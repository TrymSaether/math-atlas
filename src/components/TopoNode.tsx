import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { getNodeKindRgbString } from "../lib/colors";
import { useStore } from "../store";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "../types";

interface Data {
  node: TopoNodeT;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
}

type Tier = "primary" | "secondary" | "compact";

const KIND_TIER: Record<string, Tier> = {
  definition: "primary",
  theorem: "primary",
  structure: "primary",
  axiom: "primary",
  property: "primary",
  proposition: "secondary",
  lemma: "secondary",
  corollary: "secondary",
  construction: "secondary",
  object: "secondary",
  algorithm: "secondary",
  process: "secondary",
  example: "compact",
  counterexample: "compact",
  non_example: "compact",
  notation: "compact",
  proof: "compact",
  proof_step: "compact",
  proof_method: "compact",
};

const TIER_STYLE: Record<Tier, { w: number; titleClamp: number; titleSize: string; pad: string }> = {
  primary:   { w: 240, titleClamp: 2, titleSize: "text-[13px]", pad: "px-3 py-2" },
  secondary: { w: 200, titleClamp: 2, titleSize: "text-[12px]", pad: "px-2.5 py-1.5" },
  compact:   { w: 168, titleClamp: 1, titleSize: "text-[11px]", pad: "px-2 py-1" },
};

export function TopoNodeView({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight } = data;
  const select = useStore((s) => s.select);
  const tier = KIND_TIER[node.kind] ?? "secondary";
  const tw = TIER_STYLE[tier];
  const isPrimary = tier === "primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dim ? 0.28 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => select(node.id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select(node.id);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${KIND_LABEL[node.kind]} ${node.number}: ${node.title}`}
      style={{ width: tw.w, "--c": getNodeKindRgbString(node.kind) } as React.CSSProperties}
      className={cn(
        `kind-${node.kind}`,
        "group relative cursor-pointer rounded-xl border font-display outline-none",
        tw.pad,
        isPrimary
          ? "border-[rgba(var(--c),0.55)] bg-[rgba(var(--c),0.08)] shadow-[0_10px_30px_-12px_rgba(var(--c),0.45)]"
          : tier === "secondary"
            ? "border-[rgba(var(--c),0.35)] bg-[rgba(var(--c),0.04)] shadow-[0_6px_18px_-12px_rgba(var(--c),0.3)]"
            : "border-[rgba(var(--c),0.22)] bg-[rgba(var(--c),0.025)]",
        "backdrop-blur-md",
        "transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--c),0.85)] hover:bg-[rgba(var(--c),0.12)]",
        "hover:shadow-[0_18px_50px_-10px_rgba(var(--c),0.65),0_0_0_1px_rgba(var(--c),0.45)]",
        selected && "ring-2 ring-[rgba(var(--c),0.9)]",
        "focus-visible:ring-2 focus-visible:ring-white/90",
        highlight === "primary" && "ring-2 ring-white/80",
        highlight === "anc" && "ring-1 ring-accent-cyan/70",
        highlight === "desc" && "ring-1 ring-accent-violet/70"
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[rgba(var(--c),0.95)]">
        <span className={cn(isPrimary ? "font-semibold" : "font-medium opacity-80")}>
          {KIND_LABEL[node.kind]}
        </span>
        <span className="text-white/40">№ {node.number}</span>
      </div>
      <div
        className={cn(
          "mt-1 font-medium leading-snug text-white/95",
          tw.titleSize,
          tw.titleClamp === 1 ? "line-clamp-1" : "line-clamp-2"
        )}
      >
        {node.title}
      </div>
      {isPrimary && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),0.95)] shadow-[0_0_8px_rgba(var(--c),0.9)]" />
          <span className="text-[10px] text-white/55 truncate">{node.topicCluster}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  );
}
