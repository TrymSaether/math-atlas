/**
 * Lightweight spaced repetition for flashcards: a classic Leitner system.
 *
 * Every rated card lives in a box 1–5. "Got it" promotes it one box, "Again"
 * demotes it back to box 1. Each box maps to a review interval, and a card is
 * *due* once that interval has elapsed (unrated cards are always due). The
 * whole ledger persists to localStorage, so "due" survives reloads — this is
 * intentionally client-local and separate from the server-synced known/learning
 * progress in `@/progress`.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapId } from "@/maps";

export type SrsRating = "again" | "got";

export interface SrsCard {
  /** Leitner box 1–5; higher means better known, longer interval. */
  box: number;
  /** Epoch ms at which the card becomes due for review again. */
  due: number;
  /** Epoch ms of the most recent review. */
  last: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Review interval per box, indexed by box number (box 1 is due immediately). */
export const BOX_INTERVALS_MS = [0, 0, 1 * DAY_MS, 3 * DAY_MS, 7 * DAY_MS, 21 * DAY_MS];
export const MAX_BOX = 5;

export const srsKey = (mapId: MapId, nodeId: string): string => `${mapId}:${nodeId}`;

export function isDue(card: SrsCard | undefined, now = Date.now()): boolean {
  return !card || card.due <= now;
}

export function nextCard(prev: SrsCard | undefined, rating: SrsRating, now = Date.now()): SrsCard {
  const box = rating === "got" ? Math.min(MAX_BOX, (prev?.box ?? 0) + 1) : 1;
  return { box, due: now + BOX_INTERVALS_MS[box], last: now };
}

interface SrsState {
  cards: Record<string, SrsCard>;
  rate: (mapId: MapId, nodeId: string, rating: SrsRating) => void;
}

export const useSrs = create<SrsState>()(
  persist(
    (set) => ({
      cards: {},
      rate: (mapId, nodeId, rating) =>
        set((s) => {
          const key = srsKey(mapId, nodeId);
          return { cards: { ...s.cards, [key]: nextCard(s.cards[key], rating) } };
        }),
    }),
    { name: "math-atlas-srs-v1" },
  ),
);

/** Ids from `ids` that are due for review (unrated ids are always due). */
export function dueIds(cards: Record<string, SrsCard>, mapId: MapId, ids: string[], now = Date.now()): string[] {
  return ids.filter((id) => isDue(cards[srsKey(mapId, id)], now));
}
