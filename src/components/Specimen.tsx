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
import { createElement, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CaretRightIcon } from "@phosphor-icons/react";
import type { LoadedMap } from "../data";
import { MathText, MathProse, tidyMathText } from "../lib/katex";
import { getDomainTone, type DomainTone } from "../lib/colors";
import { CATEGORY_META, categoryOf, kindAbbrev, railBackground } from "../lib/nodeCategory";
import { kindIcon } from "../lib/nodeCategoryIcons";
import { compactNodeRef } from "../lib/nodeMeta";
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
      className="relative overflow-hidden rounded-md pl-4 pr-4"
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
        style={{
          color: "var(--fg-1)",
          fontSize: size === "dict" ? "15px" : "15.5px",
        }}
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
      <div className="text-ui-copy" style={{ color: muted ? "var(--fg-2)" : "var(--fg-1)" }}>
        {children}
      </div>
    </div>
  );
}

/** A boxed math block used for formal statement / definition / formula facets. */
export function MathBox({ text }: { text: string }) {
  return (
    <div
      className="block max-w-full overflow-x-auto rounded-sm border px-3.5 py-2.5 font-math text-ui-body leading-[1.6]"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
        color: "var(--fg-1)",
      }}
    >
      <MathText text={text} asBlock />
    </div>
  );
}

/**
 * Mono micro-label with a dashed derivation rule — heads a Proof / Solution
 * block (or the panel's Proof / Solution tab). The static, always-shown sibling
 * of the collapsible {@link Proof} header.
 */
export function StepLabel({ label, toneColor }: { label: string; toneColor: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="font-mono text-ui-2xs uppercase tracking-label" style={{ color: toneColor }}>
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1"
        style={{
          background: `repeating-linear-gradient(90deg, ${toneColor} 0 2px, transparent 2px 5px)`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/**
 * The body of a prose (non-stepped) argument: a dotted derivation rail in the
 * domain tone and the classic ∎ tombstone closing it. Shared by the panel's
 * Proof / Solution tabs (under a static {@link StepLabel}) and the collapsible
 * {@link Proof} so the manuscript texture is identical everywhere.
 */
export function Argument({ text, toneColor }: { text: string; toneColor: string }) {
  return (
    <div
      className="font-math pl-3.5 text-ui-copy leading-[1.7]"
      style={{
        color: "var(--fg-1)",
        borderLeft: `1.5px dotted color-mix(in srgb, ${toneColor} 55%, transparent)`,
      }}
    >
      <MathProse text={tidyMathText(text)} asBlock />
      <span aria-hidden className="mt-1.5 block text-right text-ui-sm" style={{ color: toneColor }}>
        ∎
      </span>
    </div>
  );
}

/**
 * A foldable section under a domain-toned dashed derivation rule: a caret toggle
 * and, optionally, a mono micro-label that doubles as the rule's caption. Omit
 * `label` where context already names the block (the panel's Proof / Solution
 * tab) — you get the same fold affordance without a redundant heading.
 */
export function Collapsible({
  toneColor,
  label,
  defaultOpen = false,
  collapsible = true,
  children,
}: {
  toneColor: string;
  label?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();

  if (!collapsible) {
    return <>{children}</>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label ? undefined : open ? "Collapse" : "Expand"}
        className="group mb-1 flex w-full items-center gap-1.5 focus:outline-none"
      >
        <CaretRightIcon
          className="h-3 w-3 shrink-0 transition-transform duration-200"
          style={{
            color: toneColor,
            transform: open ? "rotate(90deg)" : "none",
          }}
          aria-hidden
        />
        {label && (
          <span
            className="font-mono text-ui-2xs uppercase tracking-label"
            style={{ color: toneColor }}
          >
            {label}
          </span>
        )}
        <span
          aria-hidden
          className="h-px flex-1 opacity-50 transition-opacity group-hover:opacity-100"
          style={{
            background: `repeating-linear-gradient(90deg, ${toneColor} 0 2px, transparent 2px 5px)`,
          }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="collapsible-body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            <div className="mt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * A prose proof or worked solution as a collapsible "manuscript" — a labeled
 * {@link Collapsible} over an {@link Argument} body. Used where the block is one
 * section among many (dictionary, flashcard back); the panel's dedicated tabs
 * wrap their content in a label-less Collapsible instead.
 */

export function Proof({
  text,
  toneColor,
  label = "Proof",
  defaultOpen = false,
  collapsible = true,
}: {
  text: string;
  toneColor: string;
  label?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  return (
    <Collapsible
      toneColor={toneColor}
      label={label}
      defaultOpen={defaultOpen}
      collapsible={collapsible}
    >
      <Argument text={text} toneColor={toneColor} />
    </Collapsible>
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
  defaultOpen = true,
  collapsible = true,
}: {
  steps: ProofStep[];
  toneColor: string;
  map?: LoadedMap;
  onSelect?: (id: string) => void;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  return (
    <ol className="m-0 list-none space-y-0 p-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const role = ROLE_LABEL[step.role] ?? (step.role ? step.role : "");
        const deps = map ? step.uses.filter((id) => map.nodeById.has(id)) : [];
        return (
          <ProofStepItem
            key={i}
            index={i}
            step={step}
            role={role}
            deps={deps}
            last={last}
            toneColor={toneColor}
            map={map}
            onSelect={onSelect}
            defaultOpen={defaultOpen}
            collapsible={collapsible}
          />
        );
      })}
    </ol>
  );
}

function ProofStepItem({
  index,
  step,
  role,
  deps,
  last,
  toneColor,
  map,
  onSelect,
  defaultOpen,
  collapsible,
}: {
  index: number;
  step: ProofStep;
  role: string;
  deps: string[];
  last: boolean;
  toneColor: string;
  map?: LoadedMap;
  onSelect?: (id: string) => void;
  defaultOpen: boolean;
  collapsible: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  const generatedId = useId();
  const reduceMotion = useReducedMotion();
  const stepNumber = index + 1;
  const bodyId = `${generatedId}-proof-step-${stepNumber}`;
  const showBody = open || !collapsible;

  return (
    <li className={`relative pl-8 ${last ? "" : showBody ? "pb-4" : "pb-2"}`}>
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[10px] top-[22px] w-px"
          style={{
            background: `color-mix(in srgb, ${toneColor} 45%, transparent)`,
          }}
        />
      )}
      <span
        aria-hidden
        className="absolute left-0 top-0 flex h-[21px] w-[21px] items-center justify-center rounded-full font-mono text-ui-2xs"
        style={{
          background: `color-mix(in srgb, ${toneColor} 14%, var(--surface))`,
          color: toneColor,
          border: `1px solid color-mix(in srgb, ${toneColor} 40%, transparent)`,
        }}
      >
        {stepNumber}
      </span>

      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={showBody}
        aria-controls={bodyId}
        disabled={!collapsible}
        className="group -ml-1 flex min-h-6 w-[calc(100%+4px)] items-center gap-1.5 rounded-xs px-1 py-0.5 text-left transition-colors hover:bg-(--surface-2) focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] disabled:cursor-default disabled:hover:bg-transparent"
      >
        {collapsible && (
          <CaretRightIcon
            className="h-3 w-3 shrink-0 transition-transform duration-200"
            style={{
              color: "var(--fg-3)",
              transform: showBody ? "rotate(90deg)" : "none",
            }}
            aria-hidden
          />
        )}
        <span className="min-w-0 truncate">
          <span style={{ color: toneColor }}>
            <MathText
              text={role || "Step"}
              className="block truncate font-mono text-ui-2xs tracking-label-tight"
            />
          </span>
        </span>
        {deps.length > 0 && (
          <span
            className="ml-auto shrink-0 rounded-xs px-1.5 py-px font-mono text-ui-2xs leading-none"
            style={{
              background: "var(--surface-3)",
              color: "var(--fg-3)",
            }}
          >
            {deps.length} use{deps.length === 1 ? "" : "s"}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {showBody && (
          <motion.div
            key="proof-step-body"
            id={bodyId}
            initial={reduceMotion || !collapsible ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion || !collapsible ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            {step.content && (
              <div
                className="font-math mt-1.5 text-ui-copy leading-[1.7]"
                style={{ color: "var(--fg-1)" }}
              >
                <MathProse text={step.content} asBlock />
              </div>
            )}
            {deps.length > 0 && onSelect && map && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {deps.map((id) => (
                  <ConnectionChip key={id} id={id} map={map} onClick={() => onSelect(id)} />
                ))}
              </div>
            )}
            {last && (
              <span aria-hidden className="mt-2 block text-ui-sm" style={{ color: toneColor }}>
                ∎
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
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
  caption,
}: {
  id: string;
  map: LoadedMap;
  onClick: () => void;
  /** Faint relation verb shown after the title (e.g. "defined from"). */
  caption?: string;
}) {
  const node = map.nodeById.get(id);
  if (!node) return null;
  const tone = getDomainTone(node.domain);
  const icon = kindIcon(node.kind);
  return (
    <button
      onClick={onClick}
      title={
        caption
          ? `${node.label} · ${caption} · ${KIND_LABEL[node.kind]}`
          : `${node.label} · ${KIND_LABEL[node.kind]}`
      }
      className="group inline-flex max-w-full items-center gap-1.5 rounded-sm border py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-(--surface-3) focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: tone.tint, color: tone.color }}
      >
        {createElement(icon, { className: "h-2.5 w-2.5", strokeWidth: 2.4, "aria-hidden": true })}
      </span>
      <span className="min-w-0 truncate text-ui-control leading-4" style={{ color: "var(--fg-1)" }}>
        <MathText text={node.label} />
      </span>
      {caption && (
        <span className="shrink-0 font-mono text-ui-2xs lowercase" style={{ color: "var(--fg-4)" }}>
          {caption}
        </span>
      )}
    </button>
  );
}

/** Single-line "kind · ref" caption used in card/panel headers. */
export function specimenMeta(node: GraphNode): string {
  const ref = compactNodeRef(node);
  return ref ? `${KIND_LABEL[node.kind]} · ${ref}` : KIND_LABEL[node.kind];
}

export { MathProse };
