import type { CSSProperties, ReactNode } from "react";
import { MathText } from "../../lib/katex";
import { DomainGlyph } from "../DomainGlyph";
import type { ConceptView } from "../../lib/conceptView";

/**
 * The unified concept identity block: domain-colored rail + serif title + a
 * single row of quiet meta pills (domain · kind · reference). One header for the
 * panel, the dictionary detail, and the flashcard — so a concept looks like the
 * same object wherever it appears.
 */
export function ConceptHeader({ view, size = "panel" }: { view: ConceptView; size?: "panel" | "card" }) {
  const { tone, glyphId, domainLabel, kindLabel, compactRef } = view;
  return (
    <div
      className={`concept-title-header concept-title-header-${size}`}
      style={{ "--concept-tone": tone.color } as CSSProperties}
    >
      <span aria-hidden className="concept-title-rail" style={{ background: tone.color }} />
      <div className="concept-title-stack">
        <h2 className="concept-title">
          <MathText text={view.node.label} />
        </h2>
        <div className="concept-title-meta">
          <span
            className="concept-title-pill concept-title-domain-pill"
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
      className={`concept-title-pill ${mono ? "font-mono text-caption-2" : ""}`}
      style={{ background: "var(--surface-3)", color: "var(--fg-3)" }}
    >
      {children}
    </span>
  );
}
