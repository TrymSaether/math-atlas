import { useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Sparkles, X, XIcon } from "lucide-react";

import { useStore } from "@/app/store";
import type { AtlasMap } from "@/atlas/model";
import type { MapId } from "@/maps";
import { MathText } from "@/math/MathText";
import { nodeAnswerText } from "./concept/content";
import { useConceptView } from "./concept/view";
import type { GraphNode } from "@/maps/types";
import { ConceptHeader, ConceptBody } from "./concept";
import { hasNodeVisual } from "./concept/visualModel";
import { useDrill, shuffle, type CardDirection, type DeckScope, type Rating } from "./drill";
import { useSrs, isDue, srsKey } from "./srs";
import { Chip } from "@/ui/chip";
import { useRegisterShellActions, type ShellAction } from "@/app/ShellActions";

/** A node carries enough to drill if it has a title and at least one answer-side facet. */
function answerText(n: GraphNode): string {
  return nodeAnswerText(n);
}

export function FlashcardsView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <FlashcardsBody map={map} mapId={mapId} />;
}

function FlashcardsBody({ map, mapId }: { map: AtlasMap; mapId: MapId }) {
  // Share the TopBar/dictionary filter state so a narrowed atlas narrows the deck.
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const setSurface = useStore((s) => s.setSurface);
  const select = useStore((s) => s.select);
  const progress = useStore((s) => s.progress[mapId]);
  const setNodeProgress = useStore((s) => s.setNodeProgress);
  const reduceMotion = useReducedMotion();

  const scope = useDrill((s) => s.scope);
  const setScope = useDrill((s) => s.setScope);
  const direction = useDrill((s) => s.direction);
  const setDirection = useDrill((s) => s.setDirection);
  const scoped = useDrill((s) => s.scoped);
  const setScoped = useDrill((s) => s.setScoped);
  const run = useDrill((s) => s.run);
  const drill = useDrill.getState;

  const srsCards = useSrs((s) => s.cards);
  const rateSrs = useSrs((s) => s.rate);

  // Base deck: an explicit scoped deck (concept + prerequisites) wins; otherwise
  // the toolbar filters decide. Either way a card needs an answer side.
  const baseDeck = useMemo(() => {
    const drillable = (n: GraphNode) => Boolean(answerText(n) || hasNodeVisual(n));
    if (scoped) {
      return scoped.ids.map((id) => map.nodeById.get(id)).filter((n): n is GraphNode => Boolean(n && drillable(n)));
    }
    return map.data.nodes.filter((n) => {
      if (kinds.size > 0 && !kinds.has(n.kind)) return false;
      if (topics.size > 0 && !topics.has(n.domain)) return false;
      return drillable(n);
    });
  }, [map, kinds, topics, scoped]);

  const scopeCounts = useMemo(
    () => ({
      all: baseDeck.length,
      due: baseDeck.filter((n) => isDue(srsCards[srsKey(mapId, n.id)])).length,
      learning: baseDeck.filter((n) => progress?.[n.id] === "learning").length,
    }),
    [baseDeck, srsCards, mapId, progress],
  );

  // Due/learning membership is snapshotted when a run starts (and again on
  // restart): rating a card changes its due date, and the running deck must
  // not shrink under the user. Hence srsCards/progress stay out of the deps
  // and out of the deck identity below.
  const deckIds = useMemo(() => {
    if (!scoped && scope === "due") {
      return baseDeck.filter((n) => isDue(srsCards[srsKey(mapId, n.id)])).map((n) => n.id);
    }
    if (!scoped && scope === "learning") {
      return baseDeck.filter((n) => progress?.[n.id] === "learning").map((n) => n.id);
    }
    return baseDeck.map((n) => n.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDeck, scoped, scope]);

  const baseKey = useMemo(() => baseDeck.map((n) => n.id).join("|"), [baseDeck]);
  const deckKey = `${scoped ? `scoped:${scoped.title}` : `scope:${scope}`}|${baseKey}`;

  // Start a fresh run whenever the deck identity changes; an unchanged deck
  // resumes the in-flight run (the whole point of keeping it in the store).
  useEffect(() => {
    if (run.deckKey !== deckKey) drill().reset(deckIds, deckKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const order = run.deckKey === deckKey ? run.order : shuffle(deckIds, run.seed);
  const total = order.length;
  const ratedCount = Object.keys(run.ratings).length;
  const gotCount = Object.values(run.ratings).filter((r) => r === "got").length;
  const againIds = order.filter((id) => run.ratings[id] === "again");
  const finished = total > 0 && ratedCount === total;

  const currentId = order[run.pos];
  const node = currentId ? (map.nodeById.get(currentId) ?? null) : null;

  const flip = useCallback(() => drill().flip(), [drill]);
  const go = useCallback((delta: number) => drill().go(drill().run.pos + delta), [drill]);
  const rate = useCallback(
    (rating: Rating) => {
      const id = drill().run.order[drill().run.pos];
      if (!id) return;
      drill().rate(id, rating);
      rateSrs(mapId, id, rating);
      // Persist a "got" as known; "again" keeps it in the learning set.
      setNodeProgress(mapId, id, rating === "got" ? "known" : "learning");
    },
    [drill, mapId, rateSrs, setNodeProgress],
  );
  const reshuffle = useCallback(() => drill().reshuffle(deckIds), [drill, deckIds]);
  const shellActions = useMemo<readonly ShellAction[]>(
    () =>
      ratedCount > 0
        ? [
            {
              id: "restart-study",
              label: "Restart",
              icon: RotateCcw,
              onSelect: reshuffle,
              disabled: total === 0,
            },
          ]
        : [],
    [ratedCount, reshuffle, total],
  );
  useRegisterShellActions("flashcards", shellActions);

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
      } else if (run.flipped && (e.key === "1" || e.key.toLowerCase() === "a")) {
        e.preventDefault();
        rate("again");
      } else if (run.flipped && (e.key === "2" || e.key.toLowerCase() === "g")) {
        e.preventDefault();
        rate("got");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [finished, flip, go, rate, run.flipped, setSurface]);

  return (
    <div className="absolute inset-x-0 top-[var(--shell-dock-top)] bottom-[var(--shell-content-bottom)] flex flex-col items-center px-4 pb-4">
      <div className="flex w-full max-w-170 flex-1 flex-col">
        {/* Deck scope + card direction */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {scoped ? (
            <span className="inline-flex min-h-(--control-h-sm) items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-caption-1 font-medium text-primary-text">
              Practicing: <MathText text={scoped.title} />
              <span className="font-mono opacity-70">{total}</span>
              <button
                type="button"
                onClick={() => setScoped(null)}
                aria-label="Back to full deck"
                title="Back to full deck"
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : (
            <div className="flex items-center gap-1.5" role="group" aria-label="Deck scope">
              <Chip active={scope === "all"} onClick={() => setScope("all")}>
                All <span className="font-mono text-caption-2 opacity-70">{scopeCounts.all}</span>
              </Chip>
              <Chip active={scope === "due"} onClick={() => setScope("due")}>
                Due <span className="font-mono text-caption-2 opacity-70">{scopeCounts.due}</span>
              </Chip>
              <Chip active={scope === "learning"} onClick={() => setScope("learning")}>
                Learning <span className="font-mono text-caption-2 opacity-70">{scopeCounts.learning}</span>
              </Chip>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5" role="group" aria-label="Card direction">
            <Chip
              variant="mono"
              active={direction === "term"}
              onClick={() => setDirection("term")}
              title="Show the name and recall the statement"
            >
              {DIRECTION_LABEL.term}
            </Chip>
            <Chip
              variant="mono"
              active={direction === "statement"}
              onClick={() => setDirection("statement")}
              title="Show the statement and recall the name"
            >
              {DIRECTION_LABEL.statement}
            </Chip>
          </div>
        </div>

        {/* Progress rail */}
        <div className="mb-3 flex items-center gap-3">
          <ProgressRail order={order} ratings={run.ratings} pos={run.pos} onJump={(i) => drill().go(i)} />
          <span className="shrink-0 font-mono text-caption-2 text-muted-foreground">
            {total ? Math.min(run.pos + 1, total) : 0}/{total}
          </span>
          <button
            type="button"
            onClick={reshuffle}
            disabled={total === 0}
            className="flex h-7 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-caption-1 font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            title="Shuffle and restart"
          >
            <Shuffle className="h-3 w-3" />
            Shuffle
          </button>
        </div>

        {total === 0 ? (
          <EmptyState scope={scoped ? "all" : scope} onBack={() => setSurface("atlas")} />
        ) : finished ? (
          <SummaryCard
            total={total}
            gotCount={gotCount}
            againCount={againIds.length}
            onRestart={reshuffle}
            onReview={() => againIds.length && drill().review(againIds)}
            onClose={() => setSurface("atlas")}
          />
        ) : (
          node && (
            <>
              <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${node.id}:${run.flipped ? "back" : "front"}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    {run.flipped ? (
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
                      <CardFront node={node} map={map} mapId={mapId} direction={direction} onFlip={flip} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="mt-3 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
                <PagerButton label="Previous card" disabled={run.pos === 0} onClick={() => go(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </PagerButton>

                {run.flipped ? (
                  <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                    <RateButton tone="again" onClick={() => rate("again")}>
                      <XIcon className="h-4 w-4" /> Again
                      <Kbd>1</Kbd>
                    </RateButton>
                    <RateButton tone="got" onClick={() => rate("got")}>
                      <Check className="h-4 w-4" /> Got it
                      <Kbd>2</Kbd>
                    </RateButton>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={flip}
                    className="flex h-11 items-center justify-center gap-2 rounded-sm border border-transparent bg-primary px-5 text-body font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                    style={{ boxShadow: "var(--shadow-e2)" }}
                  >
                    <span>Show answer</span>
                    <Kbd onAccent>Space</Kbd>
                  </button>
                )}

                <PagerButton label="Next card" disabled={run.pos >= total - 1} onClick={() => go(1)}>
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

/**
 * Segmented, clickable progress rail: one tick per card, colored by its rating
 * this run. Falls back to a continuous bar for very large decks where the
 * ticks would be sub-pixel.
 */
function ProgressRail({
  order,
  ratings,
  pos,
  onJump,
}: {
  order: string[];
  ratings: Record<string, Rating>;
  pos: number;
  onJump: (pos: number) => void;
}) {
  const total = order.length;
  if (total === 0 || total > 80) {
    const ratedCount = Object.keys(ratings).length;
    return (
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: total ? `${(ratedCount / total) * 100}%` : "0%" }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-2.5 flex-1 items-center gap-px" role="group" aria-label="Card progress">
      {order.map((id, i) => {
        const rating = ratings[id];
        const current = i === pos;
        const color = rating === "got" ? "bg-success/80" : rating === "again" ? "bg-destructive/70" : "bg-secondary";
        return (
          <button
            key={id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Card ${i + 1} of ${total}`}
            className={`h-full min-w-0 flex-1 first:rounded-l-full last:rounded-r-full ${color} transition-[transform,opacity] hover:opacity-80 ${
              current ? "scale-y-125 ring-1 ring-inset ring-primary" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

const DIRECTION_LABEL: Record<CardDirection, string> = {
  term: "Term first",
  statement: "Statement first",
};

function CardShell({ children, tone, footer }: { children: React.ReactNode; tone: string; footer?: React.ReactNode }) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-e2)" }}
    >
      <span aria-hidden className="h-1 w-full shrink-0" style={{ background: tone }} />
      <div className="panel-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

function CardFront({
  node,
  map,
  mapId,
  direction,
  onFlip,
}: {
  node: GraphNode;
  map: AtlasMap;
  mapId: MapId;
  direction: CardDirection;
  onFlip: () => void;
}) {
  const view = useConceptView(node, map, mapId);
  // Statement-first only works when there is a statement to show; cards
  // without one silently fall back to the classic term-first front.
  const reversed = direction === "statement" && Boolean(view.statement);
  return (
    <CardShell tone={view.tone.color}>
      <button
        type="button"
        onClick={onFlip}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-5 px-8 py-10 text-left"
      >
        {reversed ? (
          <div className="w-full max-w-md space-y-4">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-caption-2 font-medium"
              style={{ backgroundColor: view.tone.tint, color: view.tone.text }}
            >
              {view.kindLabel}
            </span>
            <div className="text-callout leading-relaxed text-foreground">
              <MathText text={view.statement} />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <ConceptHeader view={view} size="card" />
          </div>
        )}
        <span className="text-caption-2 font-medium text-muted-foreground">
          {reversed ? "Name this concept — tap to reveal" : "Tap or press space to flip"}
        </span>
      </button>
    </CardShell>
  );
}

function CardBack({ node, map, mapId, onOpen }: { node: GraphNode; map: AtlasMap; mapId: MapId; onOpen: () => void }) {
  const view = useConceptView(node, map, mapId);
  return (
    <CardShell
      tone={view.tone.color}
      footer={
        <button
          type="button"
          onClick={onOpen}
          className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border py-2.5 text-caption-1 font-medium text-primary-text transition-colors hover:bg-muted"
        >
          Open full entry in dictionary
        </button>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <ConceptHeader view={view} size="card" />
        <ConceptBody view={view} map={map} density="card" showVisual={false} />
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
      className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card px-8 py-12 text-center"
      style={{ boxShadow: "var(--shadow-e2)" }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-text">
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-title-1 font-semibold text-foreground">Deck complete</h2>
        <p className="text-body text-muted-foreground">
          You got <strong className="text-foreground">{gotCount}</strong> of {total} ({pct}%).
          {againCount > 0 && ` ${againCount} to review.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {againCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="flex h-11 items-center gap-2 rounded-sm bg-primary px-6 text-body font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            style={{ boxShadow: "var(--shadow-e2)" }}
          >
            Review {againCount} missed
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="flex h-11 items-center gap-2 rounded-sm border border-border bg-card px-5 text-body font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Restart deck
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-sm px-5 text-body font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Back to atlas
        </button>
      </div>
    </div>
  );
}

function EmptyState({ scope, onBack }: { scope: DeckScope; onBack: () => void }) {
  const message =
    scope === "due"
      ? "Nothing is due for review — nicely done."
      : scope === "learning"
        ? "No cards are marked as still learning."
        : "No cards match the current filters.";
  const hint =
    scope === "all"
      ? "Widen the domain or category filters in the toolbar to build a study deck."
      : "Switch the deck scope to All to keep drilling anyway.";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-8 py-12 text-center">
      <p className="text-callout text-foreground">{message}</p>
      <p className="max-w-85 text-footnote text-muted-foreground">{hint}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-1 h-10 rounded-sm border border-border bg-card px-5 text-footnote font-medium text-foreground transition-colors hover:bg-secondary"
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function RateButton({ tone, onClick, children }: { tone: Rating; onClick: () => void; children: React.ReactNode }) {
  const got = tone === "got";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-sm border px-5 text-body font-semibold transition-transform active:scale-[0.98] ${got ? "border-primary/40 bg-primary/10 text-primary-text" : "border-border bg-card text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function Kbd({ children, onAccent = false }: { children: React.ReactNode; onAccent?: boolean }) {
  return (
    <kbd
      className={`ml-0.5 hidden h-5 items-center rounded border px-1.5 font-mono text-caption-2 sm:inline-flex ${onAccent ? "border-transparent text-primary-foreground" : "border-border bg-secondary text-muted-foreground"}`}
      style={onAccent ? { background: "color-mix(in srgb, var(--card) 25%, transparent)" } : undefined}
    >
      {children}
    </kbd>
  );
}
