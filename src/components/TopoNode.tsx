import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { cn } from "../lib/utils";
import { hexToRgbString } from "../lib/colors";
import { useStore } from "../store";
import { getThemePalette } from "../themes";
import { KIND_LABEL, type NodeKind, type TopoNode as TopoNodeT } from "../types";

interface Data {
  node: TopoNodeT;
  dim?: boolean;
  highlight?: "primary" | "anc" | "desc" | null;
}

type Tier = "primary" | "secondary" | "compact";

const KIND_TIER: Record<NodeKind, Tier> = {
  definition: "primary",
  theorem: "primary",
  proposition: "secondary",
  lemma: "secondary",
  corollary: "secondary",
  example: "compact",
};

const TIER_STYLE: Record<Tier, { w: number; titleClamp: number; titleSize: string; pad: string }> = {
  primary: { w: 240, titleClamp: 2, titleSize: "text-[13px]", pad: "px-3 py-2" },
  secondary: { w: 200, titleClamp: 2, titleSize: "text-[12px]", pad: "px-2.5 py-1.5" },
  compact: { w: 168, titleClamp: 1, titleSize: "text-[11px]", pad: "px-2 py-1" },
};

export function TopoNodeView({ data, selected }: NodeProps<Data>) {
  const { node, dim, highlight } = data;
  const select = useStore((s) => s.select);
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const palette = getThemePalette(themeId, colorMode);
  const tier = KIND_TIER[node.kind];
  const tw = TIER_STYLE[tier];
  const isPrimary = tier === "primary";
  const nodeColor = palette.kindColors[node.kind];
  const style = {
    width: tw.w,
    "--c": hexToRgbString(nodeColor),
  } as CSSProperties;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dim ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => select(node.id)}
      style={style}
      className={cn(
        `kind-${node.kind}`,
        "group relative cursor-pointer rounded-xl border font-display bg-[var(--surface)]",
        tw.pad,
        isPrimary
          ? "border-[rgba(var(--c),0.62)]"
          : tier === "secondary"
            ? "border-[rgba(var(--c),0.45)]"
            : "border-[rgba(var(--c),0.32)]",
        "transition-all hover:-translate-y-0.5 hover:border-[rgba(var(--c),0.85)] hover:bg-[var(--surface-muted)]",
        selected && "ring-2 ring-[rgba(var(--c),0.78)]",
        highlight === "primary" && "ring-2 ring-[var(--ink)]",
        highlight === "anc" && "ring-1 ring-[var(--primary)]",
        highlight === "desc" && "ring-1 ring-[var(--primary-hover)]"
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[rgba(var(--c),0.95)]">
        <span className={cn(isPrimary ? "font-semibold" : "font-medium opacity-80")}>
          {KIND_LABEL[node.kind]}
        </span>
        <span style={{ color: "var(--muted)" }}>№ {node.number}</span>
      </div>
      <div
        className={cn(
          "mt-1 font-medium leading-snug text-[var(--node-title)]",
          tw.titleSize,
          tw.titleClamp === 1 ? "line-clamp-1" : "line-clamp-2"
        )}
      >
        {node.title}
      </div>
      {isPrimary && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),0.95)]" />
          <span className="truncate text-[10px]" style={{ color: "var(--muted)" }}>{node.topicCluster}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  );
}
