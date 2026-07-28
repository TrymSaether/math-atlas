/**
 * In-memory flashcard session state. Long-term scheduling lives in `srs.ts`;
 * this store owns the active deck, prompt direction, outcomes, and one-step
 * undo needed to keep a study sitting coherent across surface changes.
 */

import { create } from "zustand";

export type DeckScope = "all" | "due" | "learning" | "missed";
export type CardDirection = "term" | "statement";
export type SessionSize = 5 | 10 | 20 | "all";

export interface ScopedDeck {
  title: string;
  ids: string[];
}

export type Rating = "again" | "partial" | "got";
export type CardOutcome = Rating | "skipped";

interface UndoAction {
  id: string;
  previousOutcome?: CardOutcome;
  pos: number;
  flipped: boolean;
}

export interface DrillRun {
  deckKey: string;
  seed: number;
  order: string[];
  pos: number;
  flipped: boolean;
  ratings: Record<string, CardOutcome>;
  undo: UndoAction | null;
}

interface DrillState {
  scope: DeckScope;
  setScope: (scope: DeckScope) => void;
  direction: CardDirection;
  setDirection: (direction: CardDirection) => void;
  sessionSize: SessionSize;
  setSessionSize: (size: SessionSize) => void;
  scoped: ScopedDeck | null;
  setScoped: (deck: ScopedDeck | null) => void;
  /** Cards that need another pass, retained when the active run changes. */
  missedIds: string[];

  run: DrillRun;
  reset: (deckIds: string[], deckKey: string) => void;
  flip: () => void;
  go: (pos: number) => void;
  rate: (id: string, rating: Rating) => void;
  skip: (id: string) => void;
  undo: () => void;
  reshuffle: (deckIds: string[]) => void;
  review: (ids: string[]) => void;
}

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

export function shuffle(ids: string[], seed: number): string[] {
  const rng = mulberry32(seed);
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sized(ids: string[], size: SessionSize): string[] {
  return size === "all" ? ids : ids.slice(0, size);
}

function advance(run: DrillRun, id: string, outcome: CardOutcome): DrillRun {
  const ratings = { ...run.ratings, [id]: outcome };
  const atEnd = run.pos >= run.order.length - 1;
  return {
    ...run,
    ratings,
    undo: { id, previousOutcome: run.ratings[id], pos: run.pos, flipped: run.flipped },
    pos: atEnd ? run.pos : run.pos + 1,
    flipped: false,
  };
}

export const useDrill = create<DrillState>((set) => ({
  scope: "all",
  setScope: (scope) => set({ scope }),
  direction: "term",
  setDirection: (direction) => set({ direction }),
  sessionSize: 20,
  setSessionSize: (sessionSize) => set({ sessionSize }),
  scoped: null,
  setScoped: (scoped) => set({ scoped }),
  missedIds: [],

  run: { deckKey: "", seed: 1, order: [], pos: 0, flipped: false, ratings: {}, undo: null },

  reset: (deckIds, deckKey) =>
    set((s) => ({
      run: {
        deckKey,
        seed: s.run.seed,
        order: sized(shuffle(deckIds, s.run.seed), s.sessionSize),
        pos: 0,
        flipped: false,
        ratings: {},
        undo: null,
      },
    })),

  flip: () => set((s) => ({ run: { ...s.run, flipped: !s.run.flipped } })),

  go: (pos) =>
    set((s) => ({
      run: {
        ...s.run,
        pos: Math.max(0, Math.min(s.run.order.length - 1, pos)),
        flipped: false,
        undo: null,
      },
    })),

  rate: (id, rating) =>
    set((s) => ({
      run: advance(s.run, id, rating),
      missedIds:
        rating === "got" ? s.missedIds.filter((missedId) => missedId !== id) : [...new Set([...s.missedIds, id])],
    })),

  skip: (id) =>
    set((s) => ({
      run: advance(s.run, id, "skipped"),
      missedIds: [...new Set([...s.missedIds, id])],
    })),

  undo: () =>
    set((s) => {
      const action = s.run.undo;
      if (!action) return s;
      const ratings = { ...s.run.ratings };
      if (action.previousOutcome) ratings[action.id] = action.previousOutcome;
      else delete ratings[action.id];
      const priorWasMissed = action.previousOutcome && action.previousOutcome !== "got";
      return {
        run: {
          ...s.run,
          ratings,
          pos: action.pos,
          flipped: action.flipped,
          undo: null,
        },
        missedIds: priorWasMissed
          ? [...new Set([...s.missedIds, action.id])]
          : s.missedIds.filter((id) => id !== action.id),
      };
    }),

  reshuffle: (deckIds) =>
    set((s) => ({
      run: {
        ...s.run,
        seed: s.run.seed + 1,
        order: sized(shuffle(deckIds, s.run.seed + 1), s.sessionSize),
        pos: 0,
        flipped: false,
        ratings: {},
        undo: null,
      },
    })),

  review: (ids) =>
    set((s) => ({
      run: { ...s.run, order: sized(ids, s.sessionSize), pos: 0, flipped: false, ratings: {}, undo: null },
    })),
}));

function graphClosure(nodeId: string, nextOf: (id: string) => string[] | undefined): string[] {
  const seen = new Set<string>([nodeId]);
  const out = [nodeId];
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const next of nextOf(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      out.push(next);
      queue.push(next);
    }
  }
  return out;
}

export function prerequisiteDeck(nodeId: string, depsOf: (id: string) => string[] | undefined): string[] {
  return graphClosure(nodeId, depsOf);
}

export function dependentDeck(nodeId: string, dependentsOf: (id: string) => string[] | undefined): string[] {
  return graphClosure(nodeId, dependentsOf);
}
