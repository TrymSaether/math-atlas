import { Handle, Position, type NodeProps } from "reactflow";
import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import type { ClusterMember } from "../lib/layout";

interface Data {
  domainId: string;
  label: string;
  count: number;
  members: ClusterMember[];
  color: string;
  tint: string;
  border: string;
  width: number;
  height: number;
}

function MemberMosaic({ members, color }: { members: ClusterMember[]; color: string }) {
  // Visual fingerprint of the cluster — one dot per concept, kind-colored.
  // Smaller for big clusters so they still fit, larger when the cluster has
  // only a few concepts (each one earns more visual weight).
  const dot = members.length > 24 ? 6 : members.length > 12 ? 8 : 10;
  return (
    <div
      className="flex flex-wrap gap-[3px] rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface)] p-2"
      style={{ borderColor: `color-mix(in srgb, ${color} 18%, var(--border-soft))` }}
    >
      {members.map((member, i) => (
        <span
          key={i}
          style={{ width: dot, height: dot, background: member.color }}
          className="rounded-full opacity-90"
          title={member.kind}
        />
      ))}
    </div>
  );
}

function ClusterBubbleNodeComponent({ data }: NodeProps<Data>) {
  const expandCluster = useStore((s) => s.expandCluster);
  const { domainId, label, count, members, color, tint, border, width, height } = data;

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
      }}
      className="group relative flex flex-col items-start justify-between overflow-hidden rounded-[20px] border-[1.5px] p-5 text-left shadow-[var(--shadow-2)] transition-all hover:shadow-[var(--shadow-3)]"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />

      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] font-semibold tabular-nums" style={{ color }}>
            {count}
          </div>
          <div className="mt-1 font-display text-[20px] leading-[1.1]" style={{ color }}>
            {label}
          </div>
        </div>
        <ArrowUpRight
          className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          style={{ color }}
        />
      </div>

      <MemberMosaic members={members} color={color} />
    </motion.button>
  );
}

export const ClusterBubbleNode = memo(ClusterBubbleNodeComponent);
