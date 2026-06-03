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
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react";
import type { LoadedMap } from "../data";
import { MathText, MathProse, tidyMathText } from "../lib/katex";
import { getDomainTone, type DomainTone } from "../lib/colors";
import { CATEGORY_META, categoryOf, kindAbbrev, railBackground } from "../lib/nodeCategory";
import { KIND_LABEL, type GraphNode, type ProofStep } from "../types";

export function kindShortLabel(kind: string): string {
  return kindAbbrev(kind) || KIND_LABEL[kind];
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
          className="mb-1.5 block font-mono text-ui-2xs uppercase tracking-label"
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
        className="mb-1 block font-mono text-ui-2xs uppercase tracking-label"
        style={{ color: toneColor ?? "var(--fg-3)" }}
      >
        {label}
      </span>
      <div
        className="text-ui-copy"
        style={{ color: muted ? "var(--fg-2)" : "var(--fg-1)" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A proof: the rigorous spine of a result. Treated distinctly from a Facet —
 * proofs run long and are read deliberately, so they're collapsible and carry a
 * "manuscript" texture: a dotted derivation rail in the domain tone, a mono
 * PROOF label that doubles as the fold toggle, and the classic ∎ tombstone
 * closing the argument. Shared by the panel and the dictionary.
 */
export function Proof({
  text,
  toneColor,
  defaultOpen = false,
}: {
  text: string;
  toneColor: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-1.5 focus:outline-none"
      >
        <CaretRight
          className="h-3 w-3 shrink-0 transition-transform duration-200"
          style={{ color: toneColor, transform: open ? "rotate(90deg)" : "none" }}
          aria-hidden
        />
        <span
          className="font-mono text-ui-2xs uppercase tracking-label"
          style={{ color: toneColor }}
        >
          Proof
        </span>
        <span
          aria-hidden
          className="h-px flex-1 opacity-50 transition-opacity group-hover:opacity-100"
          style={{ background: `repeating-linear-gradient(90deg, ${toneColor} 0 2px, transparent 2px 5px)` }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="proof-body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="font-math mt-2 pl-3.5 text-ui-copy leading-[1.7]"
              style={{
                color: "var(--fg-1)",
                borderLeft: `1.5px dotted color-mix(in srgb, ${toneColor} 55%, transparent)`,
              }}
            >
              <MathProse text={tidyMathText(text)} asBlock />
              <span
                aria-hidden
                className="mt-1.5 block text-right text-ui-sm"
                style={{ color: toneColor }}
              >
                ∎
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Semantic role → short uppercase tag shown beside a step's heading. */
const ROLE_LABEL: Record<string, string> = {
  setup: "Setup",
  claim: "Claim",
  calculation: "Calculation",
  case: "Case",
  argument: "Argument",
  conclusion: "Conclusion",
  remark: "Remark",
};

/**
 * A multi-step proof or worked solution. Each step is a numbered node on a
 * domain-toned derivation rail, carrying its heading, a role tag, the prose+TeX
 * body, and chips for the prior results it leans on. Shared by the panel's
 * Proof / Solution tabs and the dictionary detail pane.
 */
export function Steps({
  steps,
  toneColor,
  map,
  onSelect,
}: {
  steps: ProofStep[];
  toneColor: string;
  map?: LoadedMap;
  onSelect?: (id: string) => void;
}) {
  return (
    <ol className="m-0 list-none space-y-0 p-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const role = ROLE_LABEL[step.role] ?? (step.role ? step.role : "");
        const deps = map ? step.dependsOn.filter((id) => map.nodeById.has(id)) : [];
        return (
          <li key={step.id || i} className="relative pb-5 pl-7 last:pb-0">
            {/* derivation rail + node marker */}
            {!last && (
              <span
                aria-hidden
                className="absolute left-[10px] top-6 bottom-0 w-px"
                style={{ background: `color-mix(in srgb, ${toneColor} 45%, transparent)` }}
              />
            )}
            <span
              aria-hidden
              className="absolute left-0 top-1 flex h-[21px] w-[21px] items-center justify-center rounded-full font-mono text-ui-2xs"
              style={{
                background: `color-mix(in srgb, ${toneColor} 14%, var(--surface))`,
                color: toneColor,
                border: `1px solid color-mix(in srgb, ${toneColor} 40%, transparent)`,
              }}
            >
              {i + 1}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {step.label && (
                <span className="font-serif text-ui-lead" style={{ color: "var(--fg-1)", fontWeight: 600 }}>
                  {step.label}
                </span>
              )}
              {role && (
                <span className="font-mono text-ui-2xs uppercase tracking-label" style={{ color: toneColor }}>
                  {role}
                </span>
              )}
            </div>
            {step.content && (
              <div className="font-math mt-1.5 text-ui-copy leading-[1.7]" style={{ color: "var(--fg-1)" }}>
                <MathProse text={step.content} asBlock />
              </div>
            )}
            {deps.length > 0 && onSelect && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {deps.map((id) => (
                  <ConnectionChip key={id} id={id} map={map!} onClick={() => onSelect(id)} />
                ))}
              </div>
            )}
            {last && (
              <span aria-hidden className="mt-2 block text-ui-sm" style={{ color: toneColor }}>
                ∎
              </span>
            )}
          </li>
        );
      })}
    </ol>
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
      <span className="min-w-0 truncate text-ui-control leading-4" style={{ color: "var(--fg-1)" }}>
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
