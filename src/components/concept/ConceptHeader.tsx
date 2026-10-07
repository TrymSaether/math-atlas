import { MathText } from "../../lib/katex";
import { DomainGlyph } from "../DomainGlyph";
import type { ConceptView } from "../../lib/conceptView";

/**
 * The unified concept identity block: domain-colored rail + serif title + a
 * single row of quiet meta pills (domain · kind · reference). One header for the
 * panel, the dictionary detail, and the flashcard — so a concept looks like the
 * same object wherever it appears.
 */
export function ConceptHeader({
  view,
  size = "panel",
}: {
  view: ConceptView;
  size?: "panel" | "card";
}) {
  const { tone, glyphId, domainLabel, kindLabel, compactRef } = view;
  const titleClass =
    size === "card" ? "text-atlas-card" : "text-node-panel-title";
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-[6px] h-9 w-[3px] shrink-0 rounded-full"
        style={{ background: tone.color }}
      />
      <div className="min-w-0">
        <h2
          className={`font-serif ${titleClass}`}
          style={{
            color: "var(--fg-1)",
            fontWeight: 600,
            letterSpacing: "-0.015em",
          }}
        >
          <MathText text={view.node.label} />
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-ui-meta font-medium"
            style={{ background: tone.tint, color: tone.text }}
          >
            {glyphId ? (
              <DomainGlyph id={glyphId} size={12} />
            ) : (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: tone.color }}
              />
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

function MetaPill({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-ui-meta ${mono ? "font-mono text-ui-hint" : ""}`}
      style={{ background: "var(--surface-3)", color: "var(--fg-3)" }}
    >
      {children}
    </span>
  );
}
