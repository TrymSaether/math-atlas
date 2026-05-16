import { Handle, Position, type NodeProps } from "reactflow";
import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
  const { domainId, label, count, sampleTitles, color, tint, border, width, height } = data;

  return (
    <motion.button
      type="button"
      onClick={() => expandCluster(domainId)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        width,
        height,
        background: tint,
        borderColor: border,
        // Carry the domain color through CSS var so children pick it up.
        ["--c-domain" as string]: color,
      }}
      className="group relative flex flex-col items-start justify-between overflow-hidden rounded-[20px] border-[1.5px] p-5 text-left shadow-[var(--shadow-2)] transition-all hover:shadow-[var(--shadow-3)]"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <div className="flex w-full items-center justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ background: "var(--surface)", color }}
        >
          {count} concepts
        </span>
        <ArrowRight
          className="h-4 w-4 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100"
          style={{ color }}
        />
      </div>

      <div className="w-full">
        <div
          className="font-display text-[22px] leading-[1.15]"
          style={{ color }}
        >
          {label}
        </div>
        {sampleTitles.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] leading-snug text-[var(--text-soft)]">
            {sampleTitles.map((title) => (
              <li key={title} className="truncate">
                · <MathText text={title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.button>
  );
}

export const ClusterBubbleNode = memo(ClusterBubbleNodeComponent);
