import type { NodeProps } from "reactflow";
import { BookOpen, Circle, Layers, Link2, Network, Orbit, Star, Target, Waves } from "lucide-react";

interface Data {
  topic: string;
  subtitle: string;
  width: number;
  height: number;
  color: string;
  rgb: string;
  icon: string;
}

const icons = {
  book: BookOpen,
  waves: Waves,
  link: Link2,
  network: Network,
  target: Target,
  layers: Layers,
  loop: Orbit,
  star: Star,
  circle: Circle,
} as const;

/** Non-interactive atlas section behind concept nodes. */
export function GraphGroupRegion({ data }: NodeProps<Data>) {
  const Icon = icons[data.icon as keyof typeof icons] ?? Circle;

  return (
    <div
      className="pointer-events-none select-none rounded-[28px]"
      style={{
        width: data.width,
        height: data.height,
        ["--group-rgb" as string]: data.rgb,
      }}
    >
      <div
        className="absolute inset-0 rounded-[28px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(var(--group-rgb),0.095), rgba(var(--group-rgb),0.035) 58%, rgba(var(--surface-rgb),0.34))",
          borderColor: "rgba(var(--group-rgb),0.22)",
          boxShadow: "inset 0 1px 0 rgba(var(--surface-rgb),0.66)",
        }}
      />
      <div className="absolute left-6 top-5 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={{
            background: "rgba(var(--group-rgb),0.10)",
            borderColor: "rgba(var(--group-rgb),0.20)",
            color: data.color,
          }}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <div className="font-display text-[22px] font-semibold leading-none" style={{ color: data.color }}>
            {data.topic}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {data.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
