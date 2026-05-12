import type { NodeProps } from "reactflow";
<<<<<<< Updated upstream
||||||| Stash base
import type { LanePalette } from "../themes";
=======
import type { LanePalette } from "../themes";
import { typography } from "../design-tokens";
>>>>>>> Stashed changes

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
          background: "rgba(120,140,255,0.025)",
          borderColor: "rgba(120,140,255,0.12)",
        }}
      />
      <div
<<<<<<< Updated upstream
        className="absolute left-3 top-3 font-display text-[26px] font-semibold tracking-[0.06em] leading-tight"
        style={{ color: "rgba(150,170,255,0.55)" }}
||||||| Stash base
        className="absolute left-3 top-3 font-display text-[26px] font-semibold tracking-[0.06em] leading-tight"
        style={{ color: data.palette?.label ?? "rgba(150,170,255,0.55)" }}
=======
        className="absolute left-3 top-3 font-display font-semibold leading-tight"
        style={{
          fontSize: typography.sizes["3xl"],
          letterSpacing: typography.letterSpacing.normal,
          color: data.palette?.label ?? "rgba(var(--primary),0.55)"
        }}
>>>>>>> Stashed changes
      >
        {data.topic}
      </div>
      <div
<<<<<<< Updated upstream
        className="absolute left-3 top-12 font-display text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "rgba(150,170,255,0.4)" }}
||||||| Stash base
        className="absolute left-3 top-12 font-display text-[10px] uppercase tracking-[0.28em]"
        style={{ color: data.palette?.label ?? "rgba(150,170,255,0.4)" }}
=======
        className="absolute left-3 top-12 font-display uppercase"
        style={{
          fontSize: typography.sizes.xs,
          letterSpacing: typography.letterSpacing.widest,
          color: data.palette?.label ?? "rgba(var(--primary),0.4)"
        }}
>>>>>>> Stashed changes
      >
        {data.subtitle}
      </div>
    </div>
  );
}
