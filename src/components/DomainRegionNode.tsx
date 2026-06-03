import type { NodeProps } from "reactflow";

import { DomainGlyph, getDomainGlyphId } from "./DomainGlyph";

interface Data {
  domainId?: string;
  label: string;
  count: number;
  width: number;
  height: number;
  color: string;
  tint: string;
  border: string;
  shape?: "rect" | "circle";
}

export function DomainRegionNode({ data }: NodeProps<Data>) {
  const isCircle = data.shape === "circle";
  const glyphId = data.domainId ? getDomainGlyphId(data.domainId) : null;

  // Watermark title: large enough to label the territory when the cards
  // themselves become unreadable on zoom-out. Sized to the band so it never
  // overflows a narrow or short region.
  const watermarkSize = Math.max(
    28,
    Math.min(data.width / Math.max(8, data.label.length * 0.62), data.height * 0.42, 132),
  );

  return (
    <div
      className="pointer-events-none relative select-none"
      style={{ width: data.width, height: data.height }}
    >
      <div
        className="absolute inset-0 border border-dashed"
        style={{
          background: `color-mix(in srgb, ${data.tint} ${isCircle ? 44 : 64}%, transparent)`,
          borderColor: data.border,
          borderRadius: isCircle ? 9999 : 24,
          boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--surface) 68%, transparent)",
        }}
      />
      {/* Colored left rail — extends the per-card lane metaphor to the band, so
          the domain reads even where the tint washes out. */}
      {!isCircle && (
        <div
          className="absolute inset-y-5 left-0 w-[4px] rounded-[var(--radius-xs)]"
          style={{ background: data.color, opacity: 0.5 }}
        />
      )}
      {/* Faint oversized domain name — the label of last resort at low zoom. */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden px-8"
        aria-hidden
      >
        <span
          className="font-serif leading-none"
          style={{
            fontSize: watermarkSize,
            color: data.color,
            opacity: 0.1,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          {data.label}
        </span>
      </div>
      <div
        className="absolute left-4 top-3 inline-flex max-w-[calc(100%-32px)] items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1 text-ui-caption font-bold uppercase"
        style={{
          background: "color-mix(in srgb, var(--surface) 78%, transparent)",
          borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
          color: data.color,
          boxShadow: "var(--shadow-1)",
        }}
      >
        {glyphId ? (
          <DomainGlyph id={glyphId} size={13} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: data.color }} />
        )}
        <span className="min-w-0 truncate">{data.label}</span>
        <span
          className="font-mono text-ui-tiny font-semibold"
          style={{ color: "var(--fg-3)" }}
        >
          {data.count}
        </span>
      </div>
    </div>
  );
}
