import { Handle, Position, type NodeProps } from "reactflow";
import type { CSSProperties } from "react";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { useStore } from "../store";
import { getKindAbbrev } from "../lib/kindStyle";
import type { SemanticDetail } from "../hooks/useSemanticZoom";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "../types";

interface Data {
  node: TopoNodeT;
  detail?: SemanticDetail;
  dim?: boolean;
  isSelected?: boolean;
  isRelated?: boolean;
  incomingHandleColor?: string;
  outgoingHandleColor?: string;
}

const DOT_SIZE = 22;

function handleStyle(color?: string) {
  return color ? ({ "--handle-color": color } as CSSProperties) : undefined;
}

export function TopoNodeView({ data }: NodeProps<Data>) {
  const {
    node,
    detail = "card",
    dim,
    isSelected,
    isRelated,
    incomingHandleColor,
    outgoingHandleColor,
  } = data;
  const select = useStore((s) => s.select);
  const tone = getDomainTone(node.domainId);
  const accented = isSelected || isRelated;

  if (detail === "dot") {
    return (
      <div
        onClick={() => select(node.id)}
        aria-label={`${KIND_LABEL[node.kind]}: ${node.title}`}
        title={node.title}
        className={cn(
          "relative rounded-full border-[1.5px] outline-none transition-transform hover:scale-110 focus-visible:ring-2",
          dim && "opacity-25",
          accented && "ring-2 ring-offset-1 ring-offset-[var(--bg)]",
        )}
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          background: tone.color,
          borderColor: "var(--surface)",
          boxShadow: accented ? `0 0 0 3px ${tone.tint}` : "var(--shadow-1)",
          ["--tw-ring-color" as string]: tone.color,
        }}
      >
        <Handle type="target" position={Position.Top} className="graph-node-handle graph-node-handle-top" style={handleStyle(incomingHandleColor)} />
        <Handle type="source" position={Position.Bottom} className="graph-node-handle graph-node-handle-bottom" style={handleStyle(outgoingHandleColor)} />
      </div>
    );
  }

  if (detail === "title") {
    return (
      <div
        onClick={() => select(node.id)}
        aria-label={`${KIND_LABEL[node.kind]}: ${node.title}`}
        className={cn(
          "relative flex w-[196px] items-center gap-2 rounded-pill border px-3 py-1.5 text-left outline-none transition-all hover:-translate-y-px focus-visible:ring-2",
          dim && "opacity-25",
        )}
        style={{
          background: "var(--surface)",
          borderColor: accented ? tone.color : "var(--border)",
          boxShadow: isSelected ? `0 0 0 3px ${tone.tint}, var(--shadow-2)` : "var(--shadow-1)",
          ["--tw-ring-color" as string]: tone.color,
        }}
      >
        <Handle type="target" position={Position.Top} className="graph-node-handle graph-node-handle-top" style={handleStyle(incomingHandleColor)} />
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.color }} />
        <span className="min-w-0 truncate text-[12px] font-semibold" style={{ color: "var(--fg-1)" }}>
          {node.title}
        </span>
        <Handle type="source" position={Position.Bottom} className="graph-node-handle graph-node-handle-bottom" style={handleStyle(outgoingHandleColor)} />
      </div>
    );
  }

  return (
    <div
      onClick={() => select(node.id)}
      aria-label={`${KIND_LABEL[node.kind]}: ${node.title}`}
      className={cn(
        "group relative flex w-[220px] cursor-pointer flex-col gap-1 rounded-[10px] px-3 py-2.5 text-left outline-none transition-all duration-150 focus-visible:ring-2",
        "hover:-translate-y-px",
        dim && "opacity-25",
      )}
      style={{
        background: "var(--surface)",
        border: `1.4px solid ${isSelected || isRelated ? tone.color : "var(--border)"}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${tone.tint}, var(--shadow-2)`
          : isRelated
            ? "var(--shadow-2)"
            : "var(--shadow-1)",
        ["--tw-ring-color" as string]: tone.color,
      }}
    >
      <Handle type="target" position={Position.Top} className="graph-node-handle graph-node-handle-top" style={handleStyle(incomingHandleColor)} />
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] px-1 font-sans text-[10px] font-bold leading-none"
          style={{ background: tone.color, color: "var(--fg-on-color)" }}
        >
          {getKindAbbrev(node.kind)}
        </span>
        <span
          className="truncate font-mono text-[10.5px] font-semibold tracking-[0.02em]"
          style={{ color: tone.color }}
          title={node.id}
        >
          {shortId(node.id)}
        </span>
      </div>
      <div
        className="truncate text-[12.5px] font-medium leading-snug"
        style={{ color: "var(--fg-1)" }}
      >
        {node.title}
      </div>
      <Handle type="source" position={Position.Bottom} className="graph-node-handle graph-node-handle-bottom" style={handleStyle(outgoingHandleColor)} />
    </div>
  );
}

function shortId(id: string): string {
  if (id.length <= 14) return id;
  return id.slice(0, 12) + "…";
}
