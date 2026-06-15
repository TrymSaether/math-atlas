import { useCallback, useEffect, useMemo, useReducer } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  ArrowCounterClockwise as RotateCcw,
  Shuffle,
  Sparkle as Sparkles,
  X,
} from "@phosphor-icons/react";

import { useStore } from "../store";
import type { LoadedMap, MapId } from "../data";
import { MathText } from "../lib/katex";
import { getDomainTone } from "../lib/colors";
import { nodeAnswerText } from "../lib/nodeContent";
import { useConceptView } from "../lib/conceptView";
import type { GraphNode } from "../types";
import { specimenMeta } from "./Specimen";
import { ConceptHeader, ConceptBody } from "./concept";
import { hasNodeVisual } from "./NodeVisual";

/** A node carries enough to drill if it has a title and at least one answer-side facet. */
function answerText(n: GraphNode): string {
  return nodeAnswerText(n);
}

type Rating = "again" | "got";

interface DrillState {
  /** Shuffle seed — bumping it reshuffles and resets the run. */
  seed: number;
  /** Ordered ids being studied this run. */
  order: string[];
  pos: number;
  flipped: boolean;
  ratings: Record<string, Rating>;
}

type DrillAction =
  | { type: "reset"; order: string[]; seed: number }
  | { type: "flip" }
  | { type: "go"; pos: number }
  | { type: "rate"; id: string; rating: Rating }
  | { type: "reshuffle"; order: string[] }
  | { type: "review"; order: string[] };

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case "reset":
      return { seed: action.seed, order: action.order, pos: 0, flipped: false, ratings: {} };
    case "flip":
      return { ...state, flipped: !state.flipped };
    case "go": {
      const pos = Math.max(0, Math.min(state.order.length - 1, action.pos));
      return { ...state, pos, flipped: false };
    }
    case "rate": {
      const ratings = { ...state.ratings, [action.id]: action.rating };
      const atEnd = state.pos >= state.order.length - 1;
      return {
        ...state,
        ratings,
        pos: atEnd ? state.pos : state.pos + 1,
        flipped: false,
      };
    }
    case "reshuffle":
      return {
        ...state,
        seed: state.seed + 1,
        order: action.order,
        pos: 0,
        flipped: false,
        ratings: {},
      };
    case "review":
      return { ...state, order: action.order, pos: 0, flipped: false, ratings: {} };
    default:
      return state;
  }
}

/** Deterministic PRNG so a given seed always produces the same shuffle. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(ids: string[], seed: number): string[] {
  const rng = mulberry32(seed);
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function FlashcardsView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <FlashcardsBody map={map} mapId={mapId} />;
}

function FlashcardsBody({ map, mapId }: { map: LoadedMap; mapId: MapId }) {
  // Share the TopBar/dictionary filter state so a narrowed atlas narrows the deck.
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const setSurface = useStore((s) => s.setSurface);
  const select = useStore((s) => s.select);
  const reduceMotion = useReducedMotion();

  const deck = useMemo(
    () =>
      map.data.nodes.filter((n) => {
        if (kinds.size > 0 && !kinds.has(n.kind)) return false;
        if (topics.size > 0 && !topics.has(n.domain)) return false;
        return Boolean(answerText(n) || hasNodeVisual(n));
      }),
    [map, kinds, topics],
  );
  const deckIds = useMemo(() => deck.map((n) => n.id), [deck]);
  const deckKey = deckIds.join("|");

  const [state, dispatch] = useReducer(drillReducer, undefined, (): DrillState => ({
    seed: 1,
    order: shuffle(deckIds, 1),
    pos: 0,
    flipped: false,
    ratings: {},
  }));

  // Rebuild the run whenever the filtered deck identity changes.
  useEffect(() => {
    dispatch({ type: "reset", order: shuffle(deckIds, state.seed), seed: state.seed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const total = state.order.length;
  const ratedCount = Object.keys(state.ratings).length;
  const gotCount = Object.values(state.ratings).filter((r) => r === "got").length;
  const againIds = state.order.filter((id) => state.ratings[id] === "again");
  const finished = total > 0 && ratedCount === total;

  const currentId = state.order[state.pos];
  const node = currentId ? (map.nodeById.get(currentId) ?? null) : null;

  const flip = useCallback(() => dispatch({ type: "flip" }), []);
  const go = useCallback(
    (delta: number) => dispatch({ type: "go", pos: state.pos + delta }),
    [state.pos],
  );
  const rate = useCallback(
    (rating: Rating) => currentId && dispatch({ type: "rate", id: currentId, rating }),
    [currentId],
  );
  const reshuffle = useCallback(
    () => dispatch({ type: "reshuffle", order: shuffle(deckIds, state.seed + 1) }),
    [deckIds, state.seed],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        setSurface("atlas");
        return;
      }
      if (finished) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (state.flipped && (e.key === "1" || e.key.toLowerCase() === "a")) {
        e.preventDefault();
        rate("again");
      } else if (state.flipped && (e.key === "2" || e.key.toLowerCase() === "g")) {
        e.preventDefault();
        rate("got");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [finished, flip, go, rate, state.flipped, setSurface]);

  return (
    <div className="absolute inset-0 flex flex-col items-center px-4 pb-4 pt-[68px]">
      <div className="flex w-full max-w-[680px] flex-1 flex-col">
        {/* Progress rail */}
        <div className="mb-3 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--surface-3)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: total ? `${(ratedCount / total) * 100}%` : "0%",
                background: "var(--accent)",
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-ui-hint" style={{ color: "var(--fg-3)" }}>
            {total ? Math.min(state.pos + 1, total) : 0}/{total}
          </span>
          <button
            onClick={reshuffle}
            disabled={total === 0}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 text-ui-meta font-medium transition-colors hover:bg-[color:var(--surface-3)] disabled:opacity-40"
            style={{
              borderColor: "var(--border)",
              color: "var(--fg-2)",
              background: "var(--surface)",
            }}
            title="Shuffle and restart"
          >
            <Shuffle className="h-3 w-3" />
            Shuffle
          </button>
        </div>

        {total === 0 ? (
          <EmptyState onBack={() => setSurface("atlas")} />
        ) : finished ? (
          <SummaryCard
            total={total}
            gotCount={gotCount}
            againCount={againIds.length}
            onRestart={reshuffle}
            onReview={() => againIds.length && dispatch({ type: "review", order: againIds })}
            onClose={() => setSurface("atlas")}
          />
        ) : (
          node && (
            <>
              <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${node.id}:${state.flipped ? "back" : "front"}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    {state.flipped ? (
                      <CardBack
                        node={node}
                        map={map}
                        mapId={mapId}
                        onOpen={() => {
                          select(node.id);
                          setSurface("dictionary");
                        }}
                      />
                    ) : (
                      <CardFront node={node} map={map} onFlip={flip} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <PagerButton
                  label="Previous card"
                  disabled={state.pos === 0}
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PagerButton>

                {state.flipped ? (
                  <div className="flex items-center gap-2">
                    <RateButton tone="again" onClick={() => rate("again")}>
                      <X className="h-4 w-4" /> Again
                      <Kbd>1</Kbd>
                    </RateButton>
                    <RateButton tone="got" onClick={() => rate("got")}>
                      <Check className="h-4 w-4" /> Got it
                      <Kbd>2</Kbd>
                    </RateButton>
                  </div>
                ) : (
                  <button
                    onClick={flip}
                    className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-6 text-ui-body font-semibold transition-transform active:scale-[0.98]"
                    style={{
                      background: "var(--accent)",
                      color: "var(--surface)",
                      boxShadow: "var(--shadow-2)",
                    }}
                  >
                    Reveal answer
                    <Kbd onAccent>Space</Kbd>
                  </button>
                )}

                <PagerButton
                  label="Next card"
                  disabled={state.pos >= total - 1}
                  onClick={() => go(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </PagerButton>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

function CardShell({
  children,
  tone,
  footer,
}: {
  children: React.ReactNode;
  tone: string;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <span aria-hidden className="h-1 w-full shrink-0" style={{ background: tone }} />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

function CardMeta({ node, map }: { node: GraphNode; map: LoadedMap }) {
  const tone = getDomainTone(node.domain);
  const domain = map.domainById.get(node.domain);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ui-meta">
      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: tone.color }}>
        <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
        {domain?.label ?? node.topicCluster}
      </span>
      <span aria-hidden style={{ color: "var(--fg-4)" }}>
        ·
      </span>
      <span style={{ color: "var(--fg-2)" }}>{specimenMeta(node)}</span>
    </div>
  );
}

function CardFront({ node, map, onFlip }: { node: GraphNode; map: LoadedMap; onFlip: () => void }) {
  const tone = getDomainTone(node.domain);
  return (
    <CardShell tone={tone.color}>
      <button
        onClick={onFlip}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-5 px-8 py-10 text-center"
      >
        <CardMeta node={node} map={map} />
        <h2
          className="font-serif text-atlas-display"
          style={{ color: "var(--fg-1)", fontWeight: 600, letterSpacing: "-0.02em" }}
        >
          <MathText text={node.label} />
        </h2>
        <span
          className="font-mono text-ui-hint uppercase tracking-label-wide"
          style={{ color: "var(--fg-4)" }}
        >
          Tap or press space to flip
        </span>
      </button>
    </CardShell>
  );
}

function CardBack({
  node,
  map,
  mapId,
  onOpen,
}: {
  node: GraphNode;
  map: LoadedMap;
  mapId: MapId;
  onOpen: () => void;
}) {
  const view = useConceptView(node, map, mapId);
  return (
    <CardShell
      tone={view.tone.color}
      footer={
        <button
          onClick={onOpen}
          className="flex shrink-0 items-center justify-center gap-1.5 border-t py-2.5 text-ui-xs font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{ borderColor: "var(--border-subtle)", color: "var(--accent)" }}
        >
          Open full entry in dictionary
        </button>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <ConceptHeader view={view} size="card" />
        <ConceptBody view={view} map={map} density="card" />
      </div>
    </CardShell>
  );
}

function SummaryCard({
  total,
  gotCount,
  againCount,
  onRestart,
  onReview,
  onClose,
}: {
  total: number;
  gotCount: number;
  againCount: number;
  onRestart: () => void;
  onReview: () => void;
  onClose: () => void;
}) {
  const pct = Math.round((gotCount / total) * 100);
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[var(--radius-2xl)] border px-8 py-12 text-center"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2
          className="font-serif text-atlas-summary"
          style={{ color: "var(--fg-1)", fontWeight: 600 }}
        >
          Deck complete
        </h2>
        <p className="text-ui-body" style={{ color: "var(--fg-2)" }}>
          You got <strong style={{ color: "var(--fg-1)" }}>{gotCount}</strong> of {total} ({pct}%).
          {againCount > 0 && ` ${againCount} to review.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {againCount > 0 && (
          <button
            onClick={onReview}
            className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-6 text-ui-body font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--surface)",
              boxShadow: "var(--shadow-2)",
            }}
          >
            Review {againCount} missed
          </button>
        )}
        <button
          onClick={onRestart}
          className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border px-5 text-ui-body font-medium transition-colors hover:bg-[color:var(--surface-3)]"
          style={{
            borderColor: "var(--border)",
            color: "var(--fg-1)",
            background: "var(--surface)",
          }}
        >
          <RotateCcw className="h-4 w-4" /> Restart deck
        </button>
        <button
          onClick={onClose}
          className="h-11 rounded-[var(--radius-sm)] px-5 text-ui-body font-medium transition-colors hover:bg-[color:var(--surface-3)]"
          style={{ color: "var(--fg-2)" }}
        >
          Back to atlas
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[var(--radius-2xl)] border px-8 py-12 text-center"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <p className="text-ui-lead" style={{ color: "var(--fg-1)" }}>
        No cards match the current filters.
      </p>
      <p className="max-w-[340px] text-ui-sm" style={{ color: "var(--fg-3)" }}>
        Widen the domain or category filters in the toolbar to build a study deck.
      </p>
      <button
        onClick={onBack}
        className="mt-1 h-10 rounded-[var(--radius-sm)] border px-5 text-ui-sm font-medium transition-colors hover:bg-[color:var(--surface-3)]"
        style={{ borderColor: "var(--border)", color: "var(--fg-1)", background: "var(--surface)" }}
      >
        Back to atlas
      </button>
    </div>
  );
}

function PagerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[color:var(--surface-3)] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
      style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "var(--surface)" }}
    >
      {children}
    </button>
  );
}

function RateButton({
  tone,
  onClick,
  children,
}: {
  tone: Rating;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const got = tone === "got";
  return (
    <button
      onClick={onClick}
      className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border px-5 text-ui-body font-semibold transition-transform active:scale-[0.98]"
      style={{
        background: got ? "var(--accent-soft)" : "var(--surface)",
        borderColor: got ? "var(--accent-border)" : "var(--border)",
        color: got ? "var(--accent)" : "var(--fg-2)",
      }}
    >
      {children}
    </button>
  );
}

function Kbd({ children, onAccent = false }: { children: React.ReactNode; onAccent?: boolean }) {
  return (
    <kbd
      className="ml-0.5 hidden h-5 items-center rounded border px-1.5 font-mono text-ui-2xs sm:inline-flex"
      style={
        onAccent
          ? {
              background: "color-mix(in srgb, var(--surface) 25%, transparent)",
              borderColor: "transparent",
              color: "var(--surface)",
            }
          : { background: "var(--surface-3)", borderColor: "var(--border)", color: "var(--fg-3)" }
      }
    >
      {children}
    </kbd>
  );
}
