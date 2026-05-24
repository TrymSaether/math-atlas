import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { useStore } from "../store";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "../types";

interface Data {
  node: TopoNodeT;
  dim?: boolean;
  isSelected?: boolean;
  isRelated?: boolean;
}

export function TopoNodeView({ data }: NodeProps<Data>) {
  const { node, dim, isSelected, isRelated } = data;
  const select = useStore((s) => s.select);
  const tone = getDomainTone(node.domainId);

  return (
    <div
      onClick={() => select(node.id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select(node.id);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${KIND_LABEL[node.kind]}: ${node.title}`}
      className={cn(
        "group relative flex w-[220px] cursor-pointer items-stretch overflow-hidden rounded-[10px] bg-white outline-none transition-[opacity,box-shadow,transform] duration-150",
        "border border-[rgba(0,0,0,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]",
        "focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F0]",
        isSelected && "shadow-[0_0_0_2px_#0A84FF,0_8px_24px_rgba(10,132,255,0.18)] border-transparent",
        !isSelected && isRelated && "shadow-[0_0_0_1px_#0A84FF80,0_4px_12px_rgba(10,132,255,0.10)]",
        dim && "opacity-25",
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span
        aria-hidden
        className="block w-[5px] flex-shrink-0"
        style={{ background: tone.color }}
      />
      <div className="min-w-0 flex-1 px-3 py-2">
        <div className="flex items-center gap-2 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-400">
          <span style={{ color: tone.color }}>{KIND_LABEL[node.kind]}</span>
        </div>
        <div className="mt-0.5 truncate text-[13px] font-medium leading-snug text-ink-900">
          {node.title}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}
