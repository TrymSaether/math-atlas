import type { ReactNode } from "react";
import type { DomainGlyphKey } from "./domainGlyphs";

export type { DomainGlyphKey } from "./domainGlyphs";

/**
 * Domain glyphs — carried from the Math Atlas (bundle b) design system.
 *
 * These mark a domain by a small line icon, complementing (not replacing) the
 * per-domain color. Single-color via `currentColor`, so they retune across all
 * themes automatically — the consumer sets the color with `style={{ color }}`.
 * Lucide has no equivalents, which is why they live here as inline SVG (the
 * same pattern as `Logo.tsx`) rather than as a fetched asset.
 *
 * Canonical source files are committed under `public/atlas-assets/domains/`.
 */

const GLYPHS: Record<DomainGlyphKey, ReactNode> = {
  "generic-foundations": (
    <>
      <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      <path d="M12 3v18" />
    </>
  ),
  "generic-examples": <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z" />,
  "topology-continuity": <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />,
  "topology-connectedness": (
    <>
      <circle cx="7" cy="12" r="4" />
      <circle cx="17" cy="12" r="4" />
    </>
  ),
  "topology-fundamental-group": <circle cx="12" cy="12" r="8" />,
  "topology-covering-spaces": (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  "topology-compactness": (
    <>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M3 3h18v18H3z" strokeDasharray="2 2" />
    </>
  ),
  "topology-homotopy": (
    <>
      <path d="M8 12c0-3 8-3 8 0s-8 3-8 0z" transform="rotate(-20 12 12)" />
      <path d="M5 12c0-5 14-5 14 0s-14 5-14 0z" />
    </>
  ),
  "fourier-foundations": (
    <>
      <path d="M4 18c2.2-4 5.2-6 9-6s6.2 2 7 6" />
      <path d="M6 15V7h12v8" />
      <path d="M9 11h6" />
    </>
  ),
  "fourier-series": (
    <>
      <path d="M3 12c1.6-3.8 3.4-3.8 5 0s3.4 3.8 5 0 3.4-3.8 5 0 1.8 3.8 3 0" />
      <path d="M5 18c2.6-1.8 4.8-1.8 7 0s4.4 1.8 7 0" />
    </>
  ),
  "fourier-convergence": (
    <>
      <path d="M4 5c4 3.7 8 5.5 16 5.5" />
      <path d="M4 12c4 1.5 8 2.2 16 2.2" />
      <path d="M4 18h16" />
    </>
  ),
  "fourier-transform": (
    <>
      <path d="M4 8c2.5-3 5.5-3 8 0s5.5 3 8 0" />
      <path d="M4 16h16" />
      <path d="M15 12l5 4-5 4" />
    </>
  ),
  "fourier-distributions": (
    <>
      <path d="M4 18h16" />
      <path d="M12 18V4" />
      <path d="M8 8l4-4 4 4" />
    </>
  ),
  "fourier-discrete": (
    <>
      <circle cx="6" cy="6" r="1.4" fill="currentColor" />
      <circle cx="18" cy="6" r="1.4" fill="currentColor" />
      <circle cx="6" cy="18" r="1.4" fill="currentColor" />
      <circle cx="18" cy="18" r="1.4" fill="currentColor" />
      <path d="M6 6l12 12M18 6L6 18M6 6h12M6 18h12" />
    </>
  ),
  "fourier-applications": (
    <>
      <path d="M4 17c2-4 4-4 6 0s4 4 6 0 3-3.5 4-1" />
      <path d="M5 8h4l2-3 3 10 2-7h3" />
    </>
  ),
  "fourier-number-theory": (
    <>
      <path d="M5 19c3-8 7-12 14-14" />
      <path d="M6 7h12M6 12h9M6 17h5" />
      <circle cx="18" cy="5" r="1.5" fill="currentColor" />
    </>
  ),
};

export function DomainGlyph({ id, size = 16, className }: { id: DomainGlyphKey; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[id]}
    </svg>
  );
}
