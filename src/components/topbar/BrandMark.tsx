/** Compass-rose mark + DM Serif wordmark — the canonical Math Atlas lockup. */
export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 48 48" fill="none" className="text-[var(--text)]">
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
        <path d="M24 5 L27.5 24 L24 21 L20.5 24 Z" fill="currentColor" />
        <path d="M24 43 L20.5 24 L24 27 L27.5 24 Z" fill="currentColor" fillOpacity="0.55" />
        <path d="M43 24 L24 27.5 L27 24 L24 20.5 Z" fill="currentColor" fillOpacity="0.85" />
        <path d="M5 24 L24 20.5 L21 24 L24 27.5 Z" fill="currentColor" fillOpacity="0.55" />
        <circle cx="24" cy="24" r="1.8" fill="currentColor" />
      </svg>
      <div>
        <div className="font-display text-[19px] leading-none tracking-[-0.005em] text-[var(--text)]">
          Mathematical Map
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          concept graph explorer
        </div>
      </div>
    </div>
  );
}
