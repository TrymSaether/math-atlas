import type { NodeProps } from "reactflow";

interface Data { chapter: string; title: string; width: number; height: number }

/** Decorative full-width band behind a chapter's nodes. Non-interactive. */
export function LaneNode({ data }: NodeProps<Data>) {
  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: data.width + 320, height: data.height + 40 }}
    >
      <div
        className="absolute inset-0 rounded-2xl border border-dashed"
        style={{
          background: "rgba(120,140,255,0.025)",
          borderColor: "rgba(120,140,255,0.12)",
        }}
      />
      <div
        className="absolute left-3 top-3 font-display text-[36px] font-semibold tracking-[0.18em]"
        style={{ color: "rgba(120,140,255,0.32)" }}
      >
        CH·{data.chapter}
      </div>
      <div
        className="absolute left-3 top-14 font-display text-[12px] uppercase tracking-[0.22em]"
        style={{ color: "rgba(120,140,255,0.45)" }}
      >
        {data.title}
      </div>
    </div>
  );
}
