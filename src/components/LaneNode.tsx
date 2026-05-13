import type { NodeProps } from "reactflow";

interface Data { topic: string; subtitle: string; width: number; height: number }

/** Decorative full-width band behind a topic-cluster's nodes. Non-interactive. */
export function LaneNode({ data }: NodeProps<Data>) {
  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: data.width + 320, height: data.height + 40 }}
    >
      <div
        className="absolute inset-0 rounded-2xl border border-dashed"
        style={{
          background: "rgba(var(--primary-rgb),0.035)",
          borderColor: "rgba(var(--primary-rgb),0.14)",
        }}
      />
      <div
        className="absolute left-3 top-3 font-display text-[26px] font-semibold leading-tight tracking-[0.06em]"
        style={{ color: "rgba(var(--primary-rgb),0.58)" }}
      >
        {data.topic}
      </div>
      <div
        className="absolute left-3 top-12 font-display text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "rgba(var(--primary-rgb),0.42)" }}
      >
        {data.subtitle}
      </div>
    </div>
  );
}
