import { Handle, Position, type NodeProps } from "reactflow";
import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import { MathText } from "../lib/katex";

interface Data {
  domainId: string;
  label: string;
  count: number;
  sampleTitles: string[];
  color: string;
  tint: string;
  border: string;
  width: number;
  height: number;
}

function ClusterBubbleNodeComponent({ data }: NodeProps<Data>) {
  const expandCluster = useStore((s) => s.expandCluster);
  return (
    <motion.div
      onClick={() => expandCluster(data.domainId)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        width: data.width,
        height: data.height,
        background: `linear-gradient(180deg, color-mix(in srgb, ${data.tint} 72%, var(--surface)), ${data.tint})`,
        borderColor: data.border,
        boxShadow: "var(--shadow-2)",
      }}
      className="group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border-[1.5px] p-5 text-left transition-all hover:shadow-[var(--shadow-3)]"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className="rounded-pill border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ background: "var(--surface)", borderColor: data.border, color: data.color }}
        >
          {data.count} concepts
        </span>
        <ArrowUpRight
          className="h-4 w-4 opacity-55 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          style={{ color: data.color }}
        />
      </div>
      <div className="w-full">
        <div className="font-serif text-[22px] leading-[1.12]" style={{ color: data.color }}>
          {data.label}
        </div>
        {data.sampleTitles.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] leading-snug" style={{ color: "var(--fg-2)" }}>
            {data.sampleTitles.map((title) => (
              <li key={title} className="truncate">
                <MathText text={title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export const ClusterBubbleNode = memo(ClusterBubbleNodeComponent);
