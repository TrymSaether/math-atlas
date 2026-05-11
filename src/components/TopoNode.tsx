import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useStore } from "../store";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "../types";

interface Data {
  node: TopoNodeT;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
}

export function TopoNodeView({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight } = data;
  const select = useStore((s) => s.select);
  const isSelected = selected;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dim ? 0.28 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => select(node.id)}
      className={cn(
        `kind-${node.kind}`,
        "group relative w-[240px] cursor-pointer rounded-xl border px-3 py-2 font-display",
        "border-[rgba(var(--c),0.45)] bg-[rgba(var(--c),0.06)]",
        "shadow-[0_10px_30px_-12px_rgba(var(--c),0.35)] backdrop-blur-md",
        "transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--c),0.85)] hover:bg-[rgba(var(--c),0.12)]",
        "hover:shadow-[0_18px_50px_-10px_rgba(var(--c),0.65),0_0_0_1px_rgba(var(--c),0.45)]",
        isSelected && "ring-2 ring-[rgba(var(--c),0.9)]",
        highlight === "primary" && "ring-2 ring-white/80",
        highlight === "anc" && "ring-1 ring-accent-cyan/70",
        highlight === "desc" && "ring-1 ring-accent-violet/70"
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[rgba(var(--c),0.95)]">
        <span className="font-medium">{KIND_LABEL[node.kind]} {node.number}</span>
        <span className="text-white/40 dark:text-white/40">{node.sectionTitle.slice(0, 18)}</span>
      </div>
      <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-white/95 dark:text-white/95 text-slate-900">
        {node.title}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),0.95)] shadow-[0_0_8px_rgba(var(--c),0.9)]" />
        <span className="text-[10px] text-white/50">Ch. {node.chapter}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  );
}
