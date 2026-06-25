/**
 * SVG filter primitives offered to the Liquid Glass material as a *progressive
 * enhancement*. Where a browser honours displacement maps inside
 * `backdrop-filter` (current Chromium is inconsistent here), these add a gentle
 * organic refraction to the blurred backdrop; where it doesn't, nothing breaks
 * — chrome.css only references them inside `@supports (backdrop-filter: url(#x))`
 * and the clarity + specular + flowing-light layers carry the look regardless.
 *
 * The visible "liquid" quality is produced in CSS (the animated light flow in
 * chrome.css), not here, so this stays deliberately cheap: a single fractal
 * turbulence feeding a low-scale displacement. Rendered once near the app root.
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
        <filter
          id="liquid-glass"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.014"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id="liquid-glass-strong"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.007 0.01"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="16"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
