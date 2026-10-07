/**
 * Progressive SVG displacement maps for Liquid Glass refraction. Browsers that
 * support `backdrop-filter: url(#...)` get subtle organic diffraction; others
 * keep the blur, rim, and highlight layers from `glass.css`.
 */
export function LiquidGlassFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="liquid-glass" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.014" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="liquid-glass-strong" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.01" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
