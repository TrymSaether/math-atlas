import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronLeft,
  Minus,
  RotateCcw,
  Shuffle,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  X,
  XIcon,
} from "lucide-react";

import { useStore } from "@/app/store";
import { useRegisterShellActions, type ShellAction } from "@/app/ShellActions";
import type { AtlasMap } from "@/atlas/model";
import type { MapId } from "@/maps";
import { KIND_LABEL, type GraphNode } from "@/maps/types";
import { MathText } from "@/math/MathText";
import type { ProgressStatus } from "@/progress/api";
import { Surface } from "@/design";
import { Chip } from "@/ui/chip";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { ModalShell } from "@/ui/modal-shell";
import { ConceptBody, ConceptHeader } from "./concept";
import { nodeAnswerText } from "./concept/content";
import { useConceptView } from "./concept/view";
import { hasNodeVisual } from "./concept/visualModel";
import { CATEGORY_META, categoryOf, railBackground } from "@shared/maps/nodeCategory";
import {
  dependentDeck,
  prerequisiteDeck,
  shuffle,
  useDrill,
  type CardDirection,
  type CardOutcome,
  type DeckScope,
  type Rating,
  type SessionSize,
} from "./drill";
import { formatInterval, intervalFor, isDue, srsKey, useSrs, type SrsCard } from "./srs";

function isDrillable(node: GraphNode): boolean {
  return Boolean(nodeAnswerText(node) || hasNodeVisual(node));
}

function limitDeck(ids: string[], size: SessionSize): string[] {
  return size === "all" ? ids : ids.slice(0, size);
}

export function FlashcardsView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <FlashcardsBody map={map} mapId={mapId} />;
}

interface ExternalUndo {
  id: string;
  srs: SrsCard | undefined;
  progress: ProgressStatus | null;
  changedExternal: boolean;
}

function FlashcardsBody({ map, mapId }: { map: AtlasMap; mapId: MapId }) {
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const selectedId = useStore((s) => s.selectedId);
  const setSurface = useStore((s) => s.setSurface);
  const select = useStore((s) => s.select);
  const progress = useStore((s) => s.progress[mapId]);
  const setNodeProgress = useStore((s) => s.setNodeProgress);
  const reduceMotion = useReducedMotion();

  const scope = useDrill((s) => s.scope);
  const setScope = useDrill((s) => s.setScope);
  const direction = useDrill((s) => s.direction);
  const setDirection = useDrill((s) => s.setDirection);
  const sessionSize = useDrill((s) => s.sessionSize);
  const setSessionSize = useDrill((s) => s.setSessionSize);
  const scoped = useDrill((s) => s.scoped);
  const setScoped = useDrill((s) => s.setScoped);
  const missedIds = useDrill((s) => s.missedIds);
  const run = useDrill((s) => s.run);
  const drill = useDrill.getState;

  const srsCards = useSrs((s) => s.cards);
  const rateSrs = useSrs((s) => s.rate);
  const restoreSrs = useSrs((s) => s.restore);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [externalUndo, setExternalUndo] = useState<ExternalUndo | null>(null);

  const baseDeck = useMemo(() => {
    if (scoped) {
      return scoped.ids
        .map((id) => map.nodeById.get(id))
        .filter((node): node is GraphNode => Boolean(node && isDrillable(node)));
    }
    return map.data.nodes.filter((node) => {
      if (kinds.size > 0 && !kinds.has(node.kind)) return false;
      if (topics.size > 0 && !topics.has(node.domain)) return false;
      return isDrillable(node);
    });
  }, [map, kinds, topics, scoped]);

  const missedSet = useMemo(() => new Set(missedIds), [missedIds]);
  const scopeCounts = useMemo(
    () => ({
      all: baseDeck.length,
      due: baseDeck.filter((node) => isDue(srsCards[srsKey(mapId, node.id)])).length,
      learning: baseDeck.filter((node) => progress?.[node.id] === "learning").length,
      missed: baseDeck.filter((node) => missedSet.has(node.id)).length,
    }),
    [baseDeck, srsCards, mapId, progress, missedSet],
  );

  const deckIds = useMemo(() => {
    if (scope === "due")
      return baseDeck.filter((node) => isDue(srsCards[srsKey(mapId, node.id)])).map((node) => node.id);
    if (scope === "learning")
      return baseDeck.filter((node) => progress?.[node.id] === "learning").map((node) => node.id);
    if (scope === "missed") return baseDeck.filter((node) => missedSet.has(node.id)).map((node) => node.id);
    return baseDeck.map((node) => node.id);
    // Due and learning membership is intentionally snapshotted by deckKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDeck, scope, missedSet]);

  const baseKey = useMemo(() => baseDeck.map((node) => node.id).join("|"), [baseDeck]);
  const deckKey = `${scoped ? `scoped:${scoped.title}` : "filtered"}|scope:${scope}|size:${sessionSize}|${baseKey}`;

  useEffect(() => {
    if (run.deckKey !== deckKey) {
      drill().reset(deckIds, deckKey);
      setExternalUndo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const order = run.deckKey === deckKey ? run.order : limitDeck(shuffle(deckIds, run.seed), sessionSize);
  const total = order.length;
  const completedCount = Object.keys(run.ratings).length;
  const finished = total > 0 && completedCount === total;
  const currentId = order[run.pos];
  const node = currentId ? (map.nodeById.get(currentId) ?? null) : null;

  const outcomeIds = useMemo(
    () => ({
      again: order.filter((id) => run.ratings[id] === "again"),
      partial: order.filter((id) => run.ratings[id] === "partial"),
      got: order.filter((id) => run.ratings[id] === "got"),
      skipped: order.filter((id) => run.ratings[id] === "skipped"),
    }),
    [order, run.ratings],
  );
  const retryIds = [...outcomeIds.again, ...outcomeIds.partial, ...outcomeIds.skipped];

  const flip = useCallback(() => drill().flip(), [drill]);
  const goBack = useCallback(() => {
    setExternalUndo(null);
    drill().go(drill().run.pos - 1);
  }, [drill]);

  const rate = useCallback(
    (rating: Rating) => {
      const current = drill().run;
      const id = current.order[current.pos];
      if (!id) return;
      const key = srsKey(mapId, id);
      setExternalUndo({
        id,
        srs: useSrs.getState().cards[key],
        progress: useStore.getState().progress[mapId]?.[id] ?? null,
        changedExternal: true,
      });
      drill().rate(id, rating);
      rateSrs(mapId, id, rating);
      setNodeProgress(mapId, id, rating === "got" ? "known" : "learning");
    },
    [drill, mapId, rateSrs, setNodeProgress],
  );

  const skip = useCallback(() => {
    const current = drill().run;
    const id = current.order[current.pos];
    if (!id) return;
    setExternalUndo({ id, srs: undefined, progress: null, changedExternal: false });
    drill().skip(id);
  }, [drill]);

  const undo = useCallback(() => {
    if (!drill().run.undo || !externalUndo) return;
    drill().undo();
    if (externalUndo.changedExternal) {
      restoreSrs(mapId, externalUndo.id, externalUndo.srs);
      setNodeProgress(mapId, externalUndo.id, externalUndo.progress);
    }
    setExternalUndo(null);
  }, [drill, externalUndo, mapId, restoreSrs, setNodeProgress]);

  const reshuffle = useCallback(() => {
    setExternalUndo(null);
    drill().reshuffle(deckIds);
  }, [deckIds, drill]);
  const requestRestart = useCallback(() => {
    if (completedCount > 0) setRestartOpen(true);
    else reshuffle();
  }, [completedCount, reshuffle]);

  const shellActions = useMemo<readonly ShellAction[]>(
    () =>
      completedCount > 0
        ? [
            {
              id: "restart-study",
              label: "Restart & shuffle",
              icon: RotateCcw,
              onSelect: requestRestart,
              disabled: total === 0,
            },
          ]
        : [],
    [completedCount, requestRestart, total],
  );
  useRegisterShellActions("flashcards", shellActions);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.isContentEditable)
      )
        return;
      if (builderOpen || restartOpen) return;
      if (event.key === "Escape") {
        setSurface("atlas");
        return;
      }
      if (event.key.toLowerCase() === "u" && run.undo && externalUndo) {
        event.preventDefault();
        undo();
        return;
      }
      if (finished) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        flip();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        skip();
      } else if (run.flipped && (event.key === "1" || event.key.toLowerCase() === "a")) {
        event.preventDefault();
        rate("again");
      } else if (run.flipped && (event.key === "2" || event.key.toLowerCase() === "p")) {
        event.preventDefault();
        rate("partial");
      } else if (run.flipped && (event.key === "3" || event.key.toLowerCase() === "g")) {
        event.preventDefault();
        rate("got");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    builderOpen,
    externalUndo,
    finished,
    flip,
    goBack,
    rate,
    restartOpen,
    run.flipped,
    run.undo,
    setSurface,
    skip,
    undo,
  ]);

  const deckLabel = scoped
    ? `${scoped.title} · ${SCOPE_LABEL[scope]}`
    : `${SCOPE_LABEL[scope]} · ${topics.size || "all"} domain${topics.size === 1 ? "" : "s"} · ${
        kinds.size || "all"
      } kind${kinds.size === 1 ? "" : "s"}`;

  const summary = useMemo(() => summarizeWeaknesses(order, run.ratings, map), [map, order, run.ratings]);

  return (
    <div className="absolute inset-x-0 top-[var(--shell-dock-top)] bottom-[var(--shell-content-bottom)] flex flex-col items-center px-4 pb-4">
      <div className="my-auto flex h-full max-h-[720px] w-full max-w-170 flex-col">
        <div className="mb-3 rounded-xl border border-border bg-card p-2.5 shadow-[var(--shadow-e1)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5" role="group" aria-label="Deck scope">
              {(["all", "due", "learning", "missed"] as const).map((value) => (
                <Chip key={value} active={scope === value} onClick={() => setScope(value)}>
                  {SCOPE_LABEL[value]} <span className="font-mono text-caption-2 opacity-70">{scopeCounts[value]}</span>
                </Chip>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5" role="group" aria-label="Card direction">
              <Chip
                variant="mono"
                active={direction === "term"}
                onClick={() => setDirection("term")}
                title="Show the concept name and recall its mathematical content"
              >
                {DIRECTION_LABEL.term}
              </Chip>
              <Chip
                variant="mono"
                active={direction === "statement"}
                onClick={() => setDirection("statement")}
                title="Show the mathematical statement and recall its name"
              >
                {DIRECTION_LABEL.statement}
              </Chip>
              <Chip variant="mono" active={builderOpen || scoped !== null} onClick={() => setBuilderOpen(true)}>
                <SlidersHorizontal className="h-3 w-3" /> Deck
              </Chip>
            </div>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2 text-caption-2 text-muted-foreground">
            <span className="min-w-0 flex-1 truncate" title={deckLabel}>
              {deckLabel}
            </span>
            {scoped && (
              <button
                type="button"
                onClick={() => setScoped(null)}
                className="shrink-0 text-primary-text hover:underline"
              >
                Clear scope
              </button>
            )}
          </div>
          <div className="mt-0 flex items-center gap-2">
            <ProgressRail order={order} ratings={run.ratings} pos={run.pos} onJump={(pos) => drill().go(pos)} />
            <span className="shrink-0 font-mono text-caption-2 text-muted-foreground">
              {total ? Math.min(run.pos + 1, total) : 0}/{total}
            </span>
            <button
              type="button"
              onClick={requestRestart}
              disabled={total === 0}
              className="flex h-7 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-caption-1 font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              title={completedCount > 0 ? "Restart and shuffle this session" : "Shuffle this session"}
            >
              <Shuffle className="h-3 w-3" />
              {completedCount > 0 ? "Restart & shuffle" : "Shuffle"}
            </button>
          </div>
        </div>

        {total === 0 ? (
          <EmptyState scope={scope} onConfigure={() => setBuilderOpen(true)} onBack={() => setSurface("atlas")} />
        ) : finished ? (
          <SummaryCard
            total={total}
            counts={{
              got: outcomeIds.got.length,
              partial: outcomeIds.partial.length,
              again: outcomeIds.again.length,
              skipped: outcomeIds.skipped.length,
            }}
            retryCount={retryIds.length}
            summary={summary}
            canUndo={Boolean(run.undo && externalUndo)}
            onUndo={undo}
            onRestart={requestRestart}
            onReview={() => retryIds.length && drill().review(retryIds)}
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

              <div className="mt-3 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
                <PagerButton label="Previous card" disabled={run.pos === 0} onClick={goBack}>
                  <ChevronLeft className="h-4 w-4" />
                </PagerButton>

                {run.flipped ? (
                  <div className="grid min-w-0 grid-cols-3 gap-1.5">
                    {(["again", "partial", "got"] as const).map((rating, index) => (
                      <RateButton
                        key={rating}
                        tone={rating}
                        interval={formatInterval(intervalFor(srsCards[srsKey(mapId, node.id)], rating))}
                        shortcut={String(index + 1)}
                        onClick={() => rate(rating)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={flip}
                      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-sm border border-transparent bg-primary px-5 text-body font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                      style={{ boxShadow: "var(--shadow-e2)" }}
                    >
                      <span>Show answer</span>
                      <Kbd onAccent>Space</Kbd>
                    </button>
                    {run.undo && externalUndo && (
                      <button
                        type="button"
                        onClick={undo}
                        className="flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-border bg-card px-3 text-footnote font-medium text-muted-foreground hover:bg-secondary"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Undo <Kbd>U</Kbd>
                      </button>
                    )}
                  </div>
                )}

                <PagerButton label="Skip card" onClick={skip}>
                  <SkipForward className="h-4 w-4" />
                </PagerButton>
              </div>
            </>
          )
        )}
      </div>

      <DeckBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        map={map}
        focusId={currentId ?? selectedId ?? null}
        scope={scope}
        sessionSize={sessionSize}
        onApply={({ scope: nextScope, size, scoped: nextScoped, kinds: nextKinds, topics: nextTopics }) => {
          useStore.setState({ kinds: nextKinds, topics: nextTopics });
          setScope(nextScope);
          setSessionSize(size);
          setScoped(nextScoped);
          setBuilderOpen(false);
        }}
      />

      <ConfirmDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        title="Restart this study session?"
        description="Your ratings and skips from this session will be cleared. Long-term review history is kept."
        confirmLabel="Restart & shuffle"
        onConfirm={reshuffle}
      />
    </div>
  );
}

const SCOPE_LABEL: Record<DeckScope, string> = {
  all: "All",
  due: "Due",
  learning: "Learning",
  missed: "Missed",
};

const DIRECTION_LABEL: Record<CardDirection, string> = {
  term: "Recall statement",
  statement: "Recall name",
};

function ProgressRail({
  order,
  ratings,
  pos,
  onJump,
}: {
  order: string[];
  ratings: Record<string, CardOutcome>;
  pos: number;
  onJump: (pos: number) => void;
}) {
  const total = order.length;
  if (total === 0 || total > 80) {
    const completed = Object.keys(ratings).length;
    return (
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
        aria-label={`${completed} of ${total} completed`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: total ? `${(completed / total) * 100}%` : "0%" }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-2.5 flex-1 items-center gap-px" role="group" aria-label="Card progress">
      {order.map((id, index) => {
        const outcome = ratings[id];
        const color =
          outcome === "got"
            ? "bg-success/80"
            : outcome === "partial"
              ? "bg-[color:var(--domain-amber)]/80"
              : outcome === "again"
                ? "bg-destructive/70"
                : outcome === "skipped"
                  ? "bg-muted-foreground/50"
                  : "bg-secondary";
        return (
          <button
            key={id}
            type="button"
            onClick={() => onJump(index)}
            disabled={index > pos && !outcome}
            aria-label={`Card ${index + 1} of ${total}${outcome ? `, ${outcome}` : ""}`}
            className={`h-full min-w-0 flex-1 first:rounded-l-full last:rounded-r-full ${color} transition-[transform,opacity] hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100 ${
              index === pos ? "scale-y-125 ring-1 ring-inset ring-primary" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

function CardShell({
  children,
  tone,
  kind,
  footer,
}: {
  children: React.ReactNode;
  tone: string;
  kind: string;
  footer?: React.ReactNode;
}) {
  const texture = CATEGORY_META[categoryOf(kind)].rail;
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-e2)" }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 z-10 w-1"
        style={{ background: railBackground(tone, texture) }}
      />
      <div className="panel-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

function recallPrompt(kind: string): string {
  if (kind === "definition") return "Give the definition.";
  if (["theorem", "lemma", "proposition", "corollary"].includes(kind)) return "State the result precisely.";
  if (kind === "property") return "State the property.";
  if (kind === "example") return "What does this example show?";
  if (kind === "counterexample" || kind === "non_example") return "What does this refute?";
  if (kind === "exercise") return "What is the key idea?";
  return "Recall the key idea.";
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
  const reversed = direction === "statement" && Boolean(view.statement);
  return (
    <CardShell tone={view.tone.color} kind={node.kind}>
      <button
        type="button"
        onClick={onFlip}
        className="flex h-full w-full cursor-pointer items-center justify-center px-8 py-10 text-center"
      >
        {reversed ? (
          <div className="flex w-full max-w-lg flex-col items-center">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-caption-2 font-medium"
              style={{ backgroundColor: view.tone.tint, color: view.tone.text }}
            >
              {view.kindLabel}
            </span>
            <div className="mt-4 text-callout leading-relaxed text-foreground">
              <MathText text={view.statement} />
            </div>
          </div>
        ) : (
          <div className="flex w-full max-w-lg flex-col items-center">
            <h2 className="m-0 max-w-full text-title-2 font-semibold leading-tight text-foreground wrap-break-word">
              <MathText text={view.node.label} />
            </h2>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-caption-2 font-medium"
                style={{ backgroundColor: view.tone.tint, color: view.tone.text }}
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: view.tone.color }} />
                {view.domainLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-caption-2 font-medium text-muted-foreground">
                {view.kindLabel}
              </span>
            </div>

            <p className="mt-5 text-callout font-medium text-foreground">{recallPrompt(node.kind)}</p>
          </div>
        )}
      </button>
    </CardShell>
  );
}

function CardBack({ node, map, mapId, onOpen }: { node: GraphNode; map: AtlasMap; mapId: MapId; onOpen: () => void }) {
  const view = useConceptView(node, map, mapId);
  return (
    <CardShell
      tone={view.tone.color}
      kind={node.kind}
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
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <ConceptHeader view={view} size="card" />
        <ConceptBody view={view} map={map} density="card" showVisual />
      </div>
    </CardShell>
  );
}

function RateButton({
  tone,
  interval,
  shortcut,
  onClick,
}: {
  tone: Rating;
  interval: string;
  shortcut: string;
  onClick: () => void;
}) {
  const label = tone === "again" ? "Again" : tone === "partial" ? "Partial" : "Got it";
  const Icon = tone === "again" ? XIcon : tone === "partial" ? Minus : Check;
  const color =
    tone === "got"
      ? "border-primary/40 bg-primary/10 text-primary-text"
      : tone === "partial"
        ? "border-[color:var(--domain-amber)]/40 bg-[color:var(--domain-amber)]/10 text-foreground"
        : "border-border bg-card text-muted-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-sm border px-1.5 py-1.5 transition-transform active:scale-[0.98] ${color}`}
      title={`${label}; next review in ${interval}`}
    >
      <span className="flex items-center gap-1 text-footnote font-semibold">
        <Icon className="h-3.5 w-3.5" /> {label} <Kbd>{shortcut}</Kbd>
      </span>
      <span className="font-mono text-caption-2 opacity-70">{interval}</span>
    </button>
  );
}

interface SummaryCounts {
  got: number;
  partial: number;
  again: number;
  skipped: number;
}

interface WeaknessSummary {
  domains: { label: string; count: number }[];
  kinds: { label: string; count: number }[];
  prerequisites: { label: string; count: number }[];
}

function ranked(entries: Map<string, number>, label: (id: string) => string): { label: string; count: number }[] {
  return [...entries.entries()]
    .sort((a, b) => b[1] - a[1] || label(a[0]).localeCompare(label(b[0])))
    .slice(0, 3)
    .map(([id, count]) => ({ label: label(id), count }));
}

function summarizeWeaknesses(order: string[], outcomes: Record<string, CardOutcome>, map: AtlasMap): WeaknessSummary {
  const domains = new Map<string, number>();
  const kinds = new Map<string, number>();
  const prerequisites = new Map<string, number>();
  for (const id of order) {
    const outcome = outcomes[id];
    if (!outcome || outcome === "got") continue;
    const node = map.nodeById.get(id);
    if (!node) continue;
    domains.set(node.domain, (domains.get(node.domain) ?? 0) + 1);
    kinds.set(node.kind, (kinds.get(node.kind) ?? 0) + 1);
    for (const prerequisite of node.statementDependencies) {
      prerequisites.set(prerequisite, (prerequisites.get(prerequisite) ?? 0) + 1);
    }
  }
  return {
    domains: ranked(domains, (id) => map.domainById.get(id)?.label ?? id),
    kinds: ranked(kinds, (id) => KIND_LABEL[id]),
    prerequisites: ranked(prerequisites, (id) => map.nodeById.get(id)?.label ?? id),
  };
}

function SummaryCard({
  total,
  counts,
  retryCount,
  summary,
  canUndo,
  onUndo,
  onRestart,
  onReview,
  onClose,
}: {
  total: number;
  counts: SummaryCounts;
  retryCount: number;
  summary: WeaknessSummary;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onReview: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="panel-scrollbar flex flex-1 flex-col items-center overflow-y-auto rounded-2xl border border-border bg-card px-6 py-8 text-center"
      style={{ boxShadow: "var(--shadow-e2)" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary-text">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="mt-4 space-y-1">
        <h2 className="text-title-1 font-semibold text-foreground">Session complete</h2>
        <p className="text-footnote text-muted-foreground">
          {total} cards reviewed. Results describe this session, not mastery.
        </p>
      </div>
      <div className="mt-5 grid w-full max-w-lg grid-cols-4 gap-2">
        {(
          [
            ["Got it", counts.got],
            ["Partial", counts.partial],
            ["Again", counts.again],
            ["Skipped", counts.skipped],
          ] as const
        ).map(([label, count]) => (
          <div key={label} className="rounded-md border border-border bg-muted px-2 py-3">
            <strong className="block font-mono text-title-3 text-foreground">{count}</strong>
            <span className="text-caption-2 text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {(summary.domains.length > 0 || summary.kinds.length > 0 || summary.prerequisites.length > 0) && (
        <div className="mt-5 grid w-full max-w-lg gap-3 text-left sm:grid-cols-3">
          <WeaknessList title="Domains to revisit" items={summary.domains} />
          <WeaknessList title="Card types" items={summary.kinds} />
          <WeaknessList title="Prerequisites" items={summary.prerequisites} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="flex h-11 items-center gap-2 rounded-sm border border-border px-4 text-body font-medium text-foreground hover:bg-secondary"
          >
            <Undo2 className="h-4 w-4" /> Undo last
          </button>
        )}
        {retryCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-body font-semibold text-primary-foreground active:scale-[0.98]"
          >
            Review {retryCount} unfinished
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="flex h-11 items-center gap-2 rounded-sm border border-border px-4 text-body font-medium text-foreground hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Restart
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-sm px-4 text-body font-medium text-muted-foreground hover:bg-secondary"
        >
          Back to atlas
        </button>
      </div>
    </div>
  );
}

function WeaknessList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-md border border-border p-3">
      <h3 className="reading-label text-muted-foreground">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-footnote text-foreground">
        {items.map((item) => (
          <li key={item.label} className="flex justify-between gap-2">
            <MathText text={item.label} /> <span className="font-mono text-muted-foreground">{item.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ scope, onConfigure, onBack }: { scope: DeckScope; onConfigure: () => void; onBack: () => void }) {
  const message =
    scope === "due"
      ? "Nothing is due for review."
      : scope === "learning"
        ? "No cards are marked as learning."
        : scope === "missed"
          ? "No missed or skipped cards yet."
          : "No cards match this deck.";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-8 py-12 text-center">
      <p className="text-callout text-foreground">{message}</p>
      <p className="max-w-85 text-footnote text-muted-foreground">Adjust the deck or return to the atlas.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfigure}
          className="h-10 rounded-sm bg-primary px-5 text-footnote font-semibold text-primary-foreground"
        >
          Configure deck
        </button>
        <button
          type="button"
          onClick={onBack}
          className="h-10 rounded-sm border border-border px-5 text-footnote font-medium text-foreground hover:bg-secondary"
        >
          Back to atlas
        </button>
      </div>
    </div>
  );
}

type GraphDeckScope = "filtered" | "current" | "prerequisites" | "dependents";

function DeckBuilder({
  open,
  onOpenChange,
  map,
  focusId,
  scope,
  sessionSize,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  map: AtlasMap;
  focusId: string | null;
  scope: DeckScope;
  sessionSize: SessionSize;
  onApply: (config: {
    scope: DeckScope;
    size: SessionSize;
    scoped: { title: string; ids: string[] } | null;
    kinds: Set<string>;
    topics: Set<string>;
  }) => void;
}) {
  const activeKinds = useStore((s) => s.kinds);
  const activeTopics = useStore((s) => s.topics);
  const [draftScope, setDraftScope] = useState(scope);
  const [draftSize, setDraftSize] = useState(sessionSize);
  const [graphScope, setGraphScope] = useState<GraphDeckScope>("filtered");
  const [draftKinds, setDraftKinds] = useState(() => new Set(activeKinds));
  const [draftTopics, setDraftTopics] = useState(() => new Set(activeTopics));

  useEffect(() => {
    if (!open) return;
    setDraftScope(scope);
    setDraftSize(sessionSize);
    setGraphScope("filtered");
    setDraftKinds(new Set(activeKinds));
    setDraftTopics(new Set(activeTopics));
  }, [activeKinds, activeTopics, open, scope, sessionSize]);

  const focus = focusId ? (map.nodeById.get(focusId) ?? null) : null;
  const toggle = (source: Set<string>, value: string, update: (next: Set<string>) => void) => {
    const next = new Set(source);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  };

  const apply = () => {
    let nextScoped: { title: string; ids: string[] } | null = null;
    if (graphScope !== "filtered" && focus) {
      if (graphScope === "current") nextScoped = { title: focus.label, ids: [focus.id] };
      if (graphScope === "prerequisites") {
        nextScoped = {
          title: `${focus.label} prerequisites`,
          ids: prerequisiteDeck(focus.id, (id) => map.nodeById.get(id)?.statementDependencies),
        };
      }
      if (graphScope === "dependents") {
        nextScoped = {
          title: `${focus.label} dependents`,
          ids: dependentDeck(focus.id, (id) =>
            map.outgoingEdgesByNodeId
              .get(id)
              ?.filter((edge) => edge.isDependency)
              .map((edge) => edge.to),
          ),
        };
      }
    }
    onApply({ scope: draftScope, size: draftSize, scoped: nextScoped, kinds: draftKinds, topics: draftTopics });
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="inset-0 m-auto h-fit max-h-[88vh] w-[min(680px,94vw)]"
    >
      <Surface material="thick" className="panel-scrollbar max-h-[88vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-title-3 font-semibold text-foreground">Build a study deck</Dialog.Title>
            <Dialog.Description className="mt-1 text-footnote text-muted-foreground">
              Choose what belongs in this sitting. Atlas filters remain the shared source of truth.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close deck builder"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>

        <BuilderSection title="Review state">
          {(["all", "due", "learning", "missed"] as const).map((value) => (
            <Chip key={value} active={draftScope === value} onClick={() => setDraftScope(value)}>
              {SCOPE_LABEL[value]}
            </Chip>
          ))}
        </BuilderSection>

        <BuilderSection title="Graph scope">
          {(["filtered", "current", "prerequisites", "dependents"] as const).map((value) => (
            <Chip
              key={value}
              active={graphScope === value}
              disabled={value !== "filtered" && !focus}
              onClick={() => setGraphScope(value)}
            >
              {value === "filtered" ? "Current filters" : value === "current" ? "Current concept" : KIND_LABEL[value]}
            </Chip>
          ))}
          {!focus && (
            <p className="w-full text-caption-2 text-muted-foreground">Select a concept to use graph-based scopes.</p>
          )}
          {focus && graphScope !== "filtered" && (
            <p className="w-full truncate text-caption-2 text-muted-foreground" title={focus.label}>
              From <MathText text={focus.label} />
            </p>
          )}
        </BuilderSection>

        <BuilderSection title="Session size">
          {([5, 10, 20, "all"] as const).map((value) => (
            <Chip key={value} active={draftSize === value} onClick={() => setDraftSize(value)}>
              {value === "all" ? "All matching" : value}
            </Chip>
          ))}
        </BuilderSection>

        <BuilderSection title="Domains">
          <Chip active={draftTopics.size === 0} onClick={() => setDraftTopics(new Set())}>
            All domains
          </Chip>
          {map.data.domains.map((domain) => (
            <Chip
              key={domain.id}
              active={draftTopics.has(domain.id)}
              onClick={() => toggle(draftTopics, domain.id, setDraftTopics)}
            >
              {domain.label}
            </Chip>
          ))}
        </BuilderSection>

        <BuilderSection title="Concept kinds">
          <Chip active={draftKinds.size === 0} onClick={() => setDraftKinds(new Set())}>
            All kinds
          </Chip>
          {map.kinds.map((kind) => (
            <Chip key={kind} active={draftKinds.has(kind)} onClick={() => toggle(draftKinds, kind, setDraftKinds)}>
              {KIND_LABEL[kind]}
            </Chip>
          ))}
        </BuilderSection>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <Dialog.Close asChild>
            <button
              type="button"
              className="h-10 rounded-sm border border-border px-4 text-footnote font-medium text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </Dialog.Close>
          <button
            type="button"
            onClick={apply}
            className="h-10 rounded-sm bg-primary px-5 text-footnote font-semibold text-primary-foreground"
          >
            Start deck
          </button>
        </div>
      </Surface>
    </ModalShell>
  );
}

function BuilderSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 reading-label text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
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

function Kbd({ children, onAccent = false }: { children: React.ReactNode; onAccent?: boolean }) {
  return (
    <kbd
      className={`ml-0.5 hidden h-5 items-center rounded border px-1.5 font-mono text-caption-2 sm:inline-flex ${
        onAccent ? "border-transparent text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
      }`}
      style={onAccent ? { background: "color-mix(in srgb, var(--card) 25%, transparent)" } : undefined}
    >
      {children}
    </kbd>
  );
}
