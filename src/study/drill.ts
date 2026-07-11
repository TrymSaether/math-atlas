/**
 * Flashcard drill state, lifted out of the view so a run survives switching
 * surfaces (peek at the atlas mid-run, come back, continue). Holds the deck
 * scope (everything / due for review / still learning), the card direction,
 * an optional graph-scoped deck (a concept plus its prerequisites, launched
 * from the dictionary), and the current run (order/position/ratings).
 *
 * All of this is intentionally in-memory: a run is a sitting, not a document.
 * Long-term review state lives in the SRS ledger (`./srs`).
 */

import { create } from "zustand";

/** Which cards make up the deck. */
export type DeckScope = "all" | "due" | "learning";

/** `term` shows the concept name first; `statement` shows the statement and asks you to name it. */
export type CardDirection = "term" | "statement";

/** An explicit deck (e.g. a concept + its prerequisites) that overrides the filter-driven deck. */
export interface ScopedDeck {
  title: string;
  ids: string[];
}

export type Rating = "again" | "got";

interface DrillRun {
  /** Identity of the deck this run was built from — a changed deck resets the run. */
  deckKey: string;
  /** Shuffle seed — bumping it reshuffles and resets the run. */
  seed: number;
  /** Ordered ids being studied this run. */
  order: string[];
  pos: number;
  flipped: boolean;
  ratings: Record<string, Rating>;
}

interface DrillState {
  scope: DeckScope;
  setScope: (scope: DeckScope) => void;
  direction: CardDirection;
  setDirection: (direction: CardDirection) => void;
  scoped: ScopedDeck | null;
  setScoped: (deck: ScopedDeck | null) => void;

  run: DrillRun;
  /** Start a fresh run over `deckIds` (called when the deck identity changes). */
  reset: (deckIds: string[], deckKey: string) => void;
  flip: () => void;
  go: (pos: number) => void;
  rate: (id: string, rating: Rating) => void;
  reshuffle: (deckIds: string[]) => void;
  /** Re-run only the given ids (e.g. the ones rated "again"). */
  review: (ids: string[]) => void;
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

export function shuffle(ids: string[], seed: number): string[] {
  const rng = mulberry32(seed);
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const useDrill = create<DrillState>((set) => ({
  scope: "all",
  setScope: (scope) => set({ scope }),
  direction: "term",
  setDirection: (direction) => set({ direction }),
  scoped: null,
  setScoped: (scoped) => set({ scoped }),

  run: { deckKey: "", seed: 1, order: [], pos: 0, flipped: false, ratings: {} },

  reset: (deckIds, deckKey) =>
    set((s) => ({
      run: {
        deckKey,
        seed: s.run.seed,
        order: shuffle(deckIds, s.run.seed),
        pos: 0,
        flipped: false,
        ratings: {},
      },
    })),

  flip: () => set((s) => ({ run: { ...s.run, flipped: !s.run.flipped } })),

  go: (pos) =>
    set((s) => ({
      run: { ...s.run, pos: Math.max(0, Math.min(s.run.order.length - 1, pos)), flipped: false },
    })),

  rate: (id, rating) =>
    set((s) => {
      const ratings = { ...s.run.ratings, [id]: rating };
      const atEnd = s.run.pos >= s.run.order.length - 1;
      return { run: { ...s.run, ratings, pos: atEnd ? s.run.pos : s.run.pos + 1, flipped: false } };
    }),

  reshuffle: (deckIds) =>
    set((s) => ({
      run: {
        ...s.run,
        seed: s.run.seed + 1,
        order: shuffle(deckIds, s.run.seed + 1),
        pos: 0,
        flipped: false,
        ratings: {},
      },
    })),

  review: (ids) =>
    set((s) => ({
      run: { ...s.run, order: ids, pos: 0, flipped: false, ratings: {} },
    })),
}));

/**
 * Transitive prerequisite closure of a node (statement dependencies), for
 * "practice this concept" decks. The node itself comes first; prerequisites
 * follow in BFS order. Only ids present in `depsOf` are traversed.
 */
export function prerequisiteDeck(nodeId: string, depsOf: (id: string) => string[] | undefined): string[] {
  const seen = new Set<string>([nodeId]);
  const out = [nodeId];
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const dep of depsOf(id) ?? []) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      out.push(dep);
      queue.push(dep);
    }
  }
  return out;
}
