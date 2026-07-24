/**
 * The original Math Atlas compass rose, refined into a quieter single-colour
 * system mark. It reads as navigation at small sizes and as an atlas rather
 * than as a generic network visual.
 */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="20.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="24" cy="24" r="14.25" stroke="currentColor" strokeWidth="1.15" opacity="0.28" />
      <path d="M24 5.5 27.4 24 24 20.8 20.6 24Z" fill="currentColor" />
      <path d="m24 42.5-3.4-18.5 3.4 3.2 3.4-3.2Z" fill="currentColor" opacity="0.42" />
      <path d="m42.5 24-18.5 3.4 3.2-3.4-3.2-3.4Z" fill="currentColor" opacity="0.72" />
      <path d="m5.5 24 18.5-3.4-3.2 3.4 3.2 3.4Z" fill="currentColor" opacity="0.42" />
      <circle cx="24" cy="24" r="2" fill="var(--primary)" />
    </svg>
  );
}

export function LogoLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <LogoMark className="size-7 shrink-0" />
      {!compact && (
        <span className="shell-brand-copy truncate text-subhead font-semibold tracking-[-0.015em]">Math Atlas</span>
      )}
    </span>
  );
}
