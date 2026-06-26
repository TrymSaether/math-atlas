import type { NodeProps } from "reactflow";
import type { MapId } from "../data";

import { DomainGlyph, getDomainGlyphId } from "./DomainGlyph";

interface Data {
  mapId?: MapId;
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
  const glyphId = data.domainId ? getDomainGlyphId({ mapId: data.mapId, domainId: data.domainId }) : null;

  // Watermark title: large enough to label the territory when the cards
  // themselves become unreadable on zoom-out. Sized to the band so it never
  // overflows a narrow or short region.
  const watermarkSize = Math.max(
    28,
    Math.min(data.width / Math.max(8, data.label.length * 0.62), data.height * 0.42, 132),
  );

  return (
    <div className="pointer-events-none relative select-none" style={{ width: data.width, height: data.height }}>
      <div
        className="absolute inset-0 overflow-hidden border"
        style={{
          background: `color-mix(in srgb, ${data.tint} ${isCircle ? 36 : 48}%, transparent)`,
          borderColor: data.border,
          borderRadius: isCircle ? 9999 : "var(--radius-2xl)",
        }}
      >
        {/* Colored left rail — mirrors the per-card rail convention while sitting
            inside the clipped domain frame, so no gap appears between rail, fill,
            and border. */}
        {!isCircle && <span className="absolute inset-y-0 -left-px w-1" style={{ background: data.border }} />}
      </div>
      {/* Faint oversized domain name — the label of last resort at low zoom. */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-8" aria-hidden>
        <span
          className="leading-none"
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
        className="absolute left-4 top-3 inline-flex max-w-[calc(100%-32px)] items-center gap-2 rounded-sm border px-2 py-1 text-caption-1 font-bold uppercase"
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
        <span className="font-mono text-caption-2 font-semibold" style={{ color: "var(--fg-3)" }}>
          {data.count}
        </span>
      </div>
    </div>
  );
}
