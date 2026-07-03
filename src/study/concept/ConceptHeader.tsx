import type { ReactNode } from "react";
import { MathText } from "@/math/MathText";
import { DomainGlyph } from "@/atlas/DomainGlyph";
import type { ConceptView } from "./view";

type ConceptHeaderSize = "panel" | "card";

const SIZE_STYLES: Record<
  ConceptHeaderSize,
  {
    grid: string;
    rail: string;
    title: string;
    meta: string;
  }
> = {
  panel: {
    grid: "grid-cols-[4px_minmax(0,1fr)] gap-x-3.5",
    rail: "min-h-12",
    title: "leading-none",
    meta: "mt-2.5 gap-1.5",
  },
  card: {
    grid: "grid-cols-[3px_minmax(0,1fr)] gap-x-2.5",
    rail: "min-h-[34px]",
    title: "leading-[1.1]",
    meta: "mt-1.5 gap-1.25",
  },
};

/**
 * Unified concept identity block.
 */
export function ConceptHeader({ view, size = "panel" }: { view: ConceptView; size?: ConceptHeaderSize }) {
  const { tone, glyphId, domainLabel, kindLabel, compactRef } = view;
  const styles = SIZE_STYLES[size];

  return (
    <div className={`grid items-stretch ${styles.grid}`}>
      <span aria-hidden className={`w-full rounded-sm ${styles.rail}`} style={{ backgroundColor: tone.color }} />

      <div className="min-w-0 self-start">
        <h2 className={`m-0 max-w-full text-title-3 font-semibold wrap-break-word ${styles.title}`}>
          <MathText text={view.node.label} />
        </h2>

        <div className={`flex flex-wrap items-center ${styles.meta}`}>
          <MetaPill
            style={{
              backgroundColor: tone.tint,
              color: tone.text,
            }}
          >
            {glyphId ? (
              <DomainGlyph id={glyphId} size={12} />
            ) : (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.color }} />
            )}
            {domainLabel}
          </MetaPill>

          <MetaPill>{kindLabel}</MetaPill>

          {compactRef && <MetaPill>{compactRef}</MetaPill>}
        </div>
      </div>
    </div>
  );
}

function MetaPill({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 font-mono text-caption-2 font-medium text-muted-foreground"
      style={style}
    >
      {children}
    </span>
  );
}
