import { Sigma } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-cyan/20 bg-accent-cyan/8 text-accent-cyan">
        <Sigma className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display text-sm font-semibold tracking-wide text-white/90">Mathematical Map</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/38">concept graph explorer</div>
      </div>
    </div>
  );
}
