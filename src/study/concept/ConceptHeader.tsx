import type { ReactNode } from "react";
import { MathText } from "@/math/MathText";
import { DomainGlyph } from "@/atlas/DomainGlyph";
import type { ConceptView } from "./view";

/**
 * The unified concept identity block: domain-colored rail + serif title + a
 * single row of quiet meta pills (domain · kind · reference). One header for the
 * panel, the dictionary detail, and the flashcard — so a concept looks like the
 * same object wherever it appears.
 */
export function ConceptHeader({ view, size = "panel" }: { view: ConceptView; size?: "panel" | "card" }) {
  const { tone, glyphId, domainLabel, kindLabel, compactRef } = view;
  const card = size === "card";
  return (
    <div
      className={
        card
          ? "grid grid-cols-[3px_minmax(0,1fr)] items-stretch gap-x-2.5"
          : "grid grid-cols-[4px_minmax(0,1fr)] items-stretch gap-x-3.5"
      }
    >
      <span
        aria-hidden
        className={`w-full rounded-full ${card ? "min-h-[34px]" : "min-h-[48px]"}`}
        style={{ background: tone.color }}
      />
      <div className="min-w-0 self-start">
        <h2
          className={`m-0 max-w-full text-title-3 font-semibold [overflow-wrap:anywhere] ${
            card ? "leading-[1.1]" : "leading-none"
          }`}
        >
          <MathText text={view.node.label} />
        </h2>
        <div className={`flex flex-wrap items-center ${card ? "mt-[7px] gap-[5px]" : "mt-2.5 gap-[7px]"}`}>
          <span
            className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-caption-2 font-medium"
            style={{ background: tone.tint, color: tone.text }}
          >
            {glyphId ? (
              <DomainGlyph id={glyphId} size={12} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.color }} />
            )}
            {domainLabel}
          </span>
          <MetaPill>{kindLabel}</MetaPill>
          {compactRef && <MetaPill mono>{compactRef}</MetaPill>}
        </div>
      </div>
    </div>
  );
}

function MetaPill({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-caption-2 font-medium text-muted-foreground ${
        mono ? "font-mono" : ""
      }`}
    >
      {children}
    </span>
  );
}
