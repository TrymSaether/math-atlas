import { ChevronsLeft } from "lucide-react";

/**
 * Compact map-identity chip in the top bar. Clicking it returns to the Atlas
 * so the user can switch maps. Replaces the old dropdown switcher — single
 * canonical "Browse all maps" entry point.
 */
export function CurrentMapPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
      title="Switch map"
    >
      <ChevronsLeft className="h-3.5 w-3.5 text-[var(--muted)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        Map
      </span>
      <span className="font-display text-[14px] leading-none">{label}</span>
    </button>
  );
}
