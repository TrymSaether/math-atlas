import type { ReactNode } from "react";

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

export type DomainGlyphId =
  | "foundations"
  | "continuity"
  | "connectedness"
  | "fundamental-group"
  | "covering-spaces"
  | "compactness"
  | "homotopy"
  | "examples";

const GLYPHS: Record<DomainGlyphId, ReactNode> = {
  foundations: (
    <>
      <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      <path d="M12 3v18" />
    </>
  ),
  continuity: <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />,
  connectedness: (
    <>
      <circle cx="7" cy="12" r="4" />
      <circle cx="17" cy="12" r="4" />
    </>
  ),
  "fundamental-group": <circle cx="12" cy="12" r="8" />,
  "covering-spaces": (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  compactness: (
    <>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M3 3h18v18H3z" strokeDasharray="2 2" />
    </>
  ),
  homotopy: (
    <>
      <path d="M8 12c0-3 8-3 8 0s-8 3-8 0z" transform="rotate(-20 12 12)" />
      <path d="M5 12c0-5 14-5 14 0s-14 5-14 0z" />
    </>
  ),
  examples: (
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z" />
  ),
};

/**
 * Explicit domain-id → glyph mapping. Best-fit assignments per map; domains
 * with no sensible glyph fall through to the dot in their host component.
 */
const DOMAIN_GLYPH: Record<string, DomainGlyphId> = {
  // topology
  foundations: "foundations",
  spaces_constructions: "covering-spaces",
  continuity: "continuity",
  compactness: "compactness",
  connectedness: "connectedness",
  separation_countability: "homotopy",
  algebraic_topology: "fundamental-group",
  // fourier analysis
  fourier_series: "continuity",
  examples_counterexamples: "examples",
  // functional analysis
  spaces_norms: "covering-spaces",
  examples_applications: "examples",
};

/** Resolve a domain id to a glyph, or `null` when none fits (host shows a dot). */
export function getDomainGlyphId(domainId: string): DomainGlyphId | null {
  const exact = DOMAIN_GLYPH[domainId];
  if (exact) return exact;
  // Shared naming conventions recur across maps.
  if (domainId.includes("example")) return "examples";
  if (domainId.includes("foundation")) return "foundations";
  return null;
}

export function DomainGlyph({
  id,
  size = 16,
  className,
}: {
  id: DomainGlyphId;
  size?: number;
  className?: string;
}) {
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
