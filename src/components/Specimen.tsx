/**
 * Specimen primitives — the shared content vocabulary used by both the NodePanel
 * (compact) and the Dictionary (expansive). A concept is treated as a *specimen*:
 *  - a Spine: the canonical statement, always primary, carrying the node's
 *    identity via a domain-colored rail whose *texture* (solid/dashed/dotted)
 *    encodes the kind. Color stays reserved for domains (see lib/nodeCategory).
 *  - Facets: quiet prose blocks (intuition, formal, example, "in words") set off
 *    only by a mono micro-label, so chrome never competes with content.
 *  - ConnectionChips: compact node references for relationship zones.
 *
 * Keeping these here means the panel and the dictionary render the same data with
 * one design — change it once, both surfaces follow.
 */
import type { ReactNode } from "react";
import type { LoadedMap } from "../data";
import { MathText, MathProse } from "../lib/katex";
import { getDomainTone, type DomainTone } from "../lib/colors";
import { CATEGORY_META, categoryOf, railBackground } from "../lib/nodeCategory";
import { KIND_LABEL, type GraphNode } from "../types";

const KIND_SHORT_LABEL: Record<string, string> = {
  definition: "Def",
  theorem: "Thm",
  lemma: "Lem",
  proposition: "Prop",
  corollary: "Cor",
  example: "Ex",
  non_example: "Non-ex",
  counterexample: "Cex",
  application: "App",
  conjecture: "Conj",
  exercise: "Exr",
  construction: "Const",
  structure: "Struct",
};

export function kindShortLabel(kind: string): string {
  return KIND_SHORT_LABEL[kind] ?? KIND_LABEL[kind];
}

/**
 * The primary statement block. A domain-colored, kind-textured rail runs down the
 * left edge; the statement sits in a faint domain wash. This is the load-bearing
 * element of a specimen — the one boxed thing on the surface.
 */
export function Spine({
  tone,
  kind,
  label,
  children,
  size = "panel",
}: {
  tone: DomainTone;
  kind: string;
  label?: string;
  children: ReactNode;
  size?: "panel" | "dict";
}) {
  const texture = CATEGORY_META[categoryOf(kind)].rail;
  return (
    <div
      className="relative overflow-hidden rounded-[12px] pl-4 pr-4"
      style={{
        background: `color-mix(in srgb, ${tone.tint} 60%, var(--surface))`,
        paddingBlock: size === "dict" ? "12px" : "11px",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3.5px]"
        style={{ background: railBackground(tone.color, texture) }}
      />
      {label && (
        <span
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.13em]"
          style={{ color: tone.color }}
        >
          {label}
        </span>
      )}
      <div
        className="font-math leading-[1.6]"
        style={{ color: "var(--fg-1)", fontSize: size === "dict" ? "14px" : "15px" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A quiet labeled prose block: uppercase mono micro-label over body prose. No
 * icon, no box, no divider — the label alone signals the facet.
 */
export function Facet({
  label,
  children,
  muted = false,
  toneColor,
}: {
  label: string;
  children: ReactNode;
  muted?: boolean;
  toneColor?: string;
}) {
  return (
    <div>
      <span
        className="mb-1 block font-mono text-[10px] uppercase tracking-[0.13em]"
        style={{ color: toneColor ?? "var(--fg-3)" }}
      >
        {label}
      </span>
      <div
        className="text-[13.5px] leading-[1.6]"
        style={{ color: muted ? "var(--fg-2)" : "var(--fg-1)" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Compact reference to another node: domain-tinted glyph + title + short kind tag.
 * Used in the panel's Connections zone and the dictionary "see also".
 */
export function ConnectionChip({
  id,
  map,
  onClick,
}: {
  id: string;
  map: LoadedMap;
  onClick: () => void;
}) {
  const node = map.nodeById.get(id);
  if (!node) return null;
  const tone = getDomainTone(node.domainId);
  const Icon = CATEGORY_META[categoryOf(node.kind)].icon;
  return (
    <button
      onClick={onClick}
      title={`${node.title} · ${KIND_LABEL[node.kind]}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-[color:var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: tone.tint, color: tone.color }}
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
      </span>
      <span className="min-w-0 truncate text-[12.5px] leading-4" style={{ color: "var(--fg-1)" }}>
        <MathText text={node.title} />
      </span>
    </button>
  );
}

/** Single-line "kind · ref" caption used in card/panel headers. */
export function specimenMeta(node: GraphNode): string {
  const ref = node.ref?.trim();
  return ref ? `${KIND_LABEL[node.kind]} · ${ref}` : KIND_LABEL[node.kind];
}

export { MathProse };
