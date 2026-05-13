import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeTone = "default" | "muted" | "cyan" | "violet" | "kind";

const tones: Record<BadgeTone, string> = {
  default: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-soft)]",
  muted: "border-[var(--border-soft)] bg-[var(--surface-soft)] text-[var(--muted)]",
  cyan: "border-[rgba(var(--primary-rgb),0.25)] bg-[rgba(var(--primary-rgb),0.10)] text-[var(--primary)]",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-300",
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
