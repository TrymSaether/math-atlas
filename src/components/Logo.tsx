/** Math Atlas compass-rose mark. Single-color via currentColor. */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <path d="M24 5 L27.5 24 L24 21 L20.5 24 Z" fill="currentColor" />
      <path d="M24 43 L20.5 24 L24 27 L27.5 24 Z" fill="currentColor" opacity="0.55" />
      <path d="M43 24 L24 27.5 L27 24 L24 20.5 Z" fill="currentColor" opacity="0.85" />
      <path d="M5 24 L24 20.5 L21 24 L24 27.5 Z" fill="currentColor" opacity="0.55" />
      <circle cx="24" cy="24" r="1.8" fill="currentColor" />
    </svg>
  );
}
