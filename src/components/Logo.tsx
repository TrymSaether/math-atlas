/** Math Atlas "Vertex A" mark — the brand letter built from a prerequisite graph.
 *  Structure uses currentColor (inherits text color); the crossbar edge and its
 *  nodes use the accent so the mark tracks the in-app theme. */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 18 L24 82" />
        <path d="M50 18 L76 82" />
      </g>
      <path d="M37 50 L63 50" stroke="var(--primary)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="50" cy="18" r="7" fill="currentColor" />
      <circle cx="24" cy="82" r="7" fill="var(--card)" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="76" cy="82" r="7" fill="var(--card)" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="37" cy="50" r="5.5" fill="var(--primary)" />
      <circle cx="63" cy="50" r="5.5" fill="var(--primary)" />
    </svg>
  );
}
