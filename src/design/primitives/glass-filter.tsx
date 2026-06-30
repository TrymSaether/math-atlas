import { useMemo } from "react";

/*
 * GlassFilter — the Chrome-only progressive enhancement.
 *
 * Apple's "liquid" edge is real light refraction: an SVG feDisplacementMap bends
 * the content behind the glass at the rim. This is the technique borrowed from
 * liquid-glass-react, rebuilt as our own so we carry no dependency. It is
 * Safari/Firefox-invisible (they don't apply SVG filters to backdrops), so it is
 * strictly additive on top of the backdrop-filter baseline — and expensive, so
 * use it only on a hero surface or two (command palette, selected node), never
 * across the canvas.
 *
 * Usage: render <GlassFilter id="palette" /> once, then apply
 * `backdrop-filter: url(#palette)` to the surface (guarded by supportsDisplacement()
 * from ./supports).
 */

/**
 * Build a rounded-rect displacement map: red/green encode x/y bend, strongest at
 * the edges and zero in the centre, so the rim refracts and the middle stays flat.
 */
function displacementDataUri(radius: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <defs>
      <radialGradient id="x" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#808080"/>
        <stop offset="60%" stop-color="#808080"/>
        <stop offset="100%" stop-color="#ff8000"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" rx="${radius}" ry="${radius}" fill="url(#x)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface GlassFilterProps {
  /** Referenced as `backdrop-filter: url(#id)`. */
  id: string;
  /** Edge bend strength (px). Bar default ~24 for hero surfaces. */
  scale?: number;
  /** Rounded-rect radius of the displacement map. */
  radius?: number;
}

export function GlassFilter({ id, scale = 24, radius = 48 }: GlassFilterProps) {
  const map = useMemo(() => displacementDataUri(radius), [radius]);
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter id={id} colorInterpolationFilters="sRGB">
        <feImage href={map} result="map" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
