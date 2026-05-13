import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeTone = "default" | "muted" | "cyan" | "violet" | "kind";

const tones: Record<BadgeTone, string> = {
  default: "border-white/12 bg-white/[0.055] text-white/70",
  muted: "border-white/8 bg-white/[0.035] text-white/45",
  cyan: "border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan",
  violet: "border-accent-violet/25 bg-accent-violet/10 text-accent-violet",
  kind: "border-[rgba(var(--c),0.35)] bg-[rgba(var(--c),0.10)] text-[rgba(var(--c),1)]",
};

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
