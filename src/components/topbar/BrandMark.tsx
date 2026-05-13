import { Sigma } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(var(--primary-rgb),0.22)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]">
        <Sigma className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display text-sm font-semibold tracking-wide text-[var(--text)]">Mathematical Map</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">concept graph explorer</div>
      </div>
    </div>
  );
}
