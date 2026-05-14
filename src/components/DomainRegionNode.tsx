import type { NodeProps } from "reactflow";

interface Data {
  label: string;
  count: number;
  width: number;
  height: number;
  color: string;
  tint: string;
  border: string;
  shape?: "rect" | "circle";
}

/** Metro-map domain region: pastel tint, dashed domain-color border, eyebrow label. */
export function DomainRegionNode({ data }: NodeProps<Data>) {
  const isCircle = data.shape === "circle";

  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: data.width, height: data.height }}
    >
      <div
        className="absolute inset-0 border-[1.5px] border-dashed"
        style={{
          background: `color-mix(in srgb, ${data.tint} ${isCircle ? 34 : 52}%, transparent)`,
          borderColor: data.border,
          borderRadius: isCircle ? "9999px" : 12,
        }}
      />
      <div
        className="absolute left-4 top-3 inline-flex max-w-[calc(100%-32px)] items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em]"
        style={{ color: data.color }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: data.color }}
        />
        <span className="min-w-0 truncate">{data.label}</span>
        <span
          className="font-sans text-[10px] font-medium tracking-[0.04em] text-[var(--faint)]"
          style={{ textTransform: "none" }}
        >
          {data.count} item{data.count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
