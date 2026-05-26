import { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { useStore } from "../store";

export interface ClusterMember {
  kind: string;
  color: string;
}

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
  const dot = members.length > 28 ? 5 : members.length > 16 ? 7 : 9;

  return (
    <div
      className="flex max-h-[72px] flex-wrap gap-[3px] overflow-hidden rounded-[10px] border p-2"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderColor: `color-mix(in srgb, ${color} 20%, var(--border))`,
      }}
    >
      {members.map((member, index) => (
        <span
          key={`${member.kind}-${index}`}
          className="rounded-full opacity-90"
          style={{ width: dot, height: dot, background: member.color }}
          title={member.kind}
        />
      ))}
    </div>
  );
}

function ClusterBubbleNodeComponent({ data }: NodeProps<Data>) {
  const expandDomain = useStore((s) => s.expandDomain);

  return (
    <div
      onClick={() => expandDomain(data.domainId)}
      aria-label={`${data.label}: ${data.count} concepts`}
      className="group relative flex flex-col items-start justify-between overflow-hidden rounded-[20px] border-[1.5px] p-5 text-left outline-none transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2"
      style={{
        width: data.width,
        height: data.height,
        background: data.tint,
        borderColor: data.border,
        boxShadow: "var(--shadow-2)",
        color: data.color,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-semibold tabular-nums">{data.count}</div>
          <div className="mt-1 line-clamp-2 font-serif text-[22px] leading-[1.08]">
            {data.label}
          </div>
        </div>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 opacity-45 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>

      <MemberMosaic members={data.members} color={data.color} />
    </div>
  );
}

export const ClusterBubbleNode = memo(ClusterBubbleNodeComponent);
