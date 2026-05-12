import type { NodeProps } from "reactflow";
import type { LanePalette } from "../themes";

interface Data {
  topic: string;
  subtitle: string;
  width: number;
  height: number;
  palette?: LanePalette;
}

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
          background: data.palette?.fill ?? "rgba(120,140,255,0.025)",
          borderColor: data.palette?.border ?? "rgba(120,140,255,0.12)",
        }}
      />
      <div
        className="absolute left-3 top-3 font-display text-[26px] font-semibold tracking-[0.06em] leading-tight"
        style={{ color: data.palette?.label ?? "rgba(150,170,255,0.55)" }}
      >
        {data.topic}
      </div>
      <div
        className="absolute left-3 top-12 font-display text-[10px] uppercase tracking-[0.28em]"
        style={{ color: data.palette?.label ?? "rgba(150,170,255,0.4)" }}
      >
        {data.subtitle}
      </div>
    </div>
  );
}
