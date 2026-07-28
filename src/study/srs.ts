/** Lightweight, client-local Leitner scheduling for flashcard reviews. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapId } from "@/maps";

export type SrsRating = "again" | "partial" | "got";

export interface SrsCard {
  box: number;
  due: number;
  last: number;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Box 1 is relearn soon; a successful first recall begins at box 3. */
export const BOX_INTERVALS_MS = [0, 10 * MINUTE_MS, 1 * DAY_MS, 3 * DAY_MS, 7 * DAY_MS, 21 * DAY_MS];
export const MAX_BOX = 5;

export const srsKey = (mapId: MapId, nodeId: string): string => `${mapId}:${nodeId}`;

export function isDue(card: SrsCard | undefined, now = Date.now()): boolean {
  return !card || card.due <= now;
}

export function nextCard(prev: SrsCard | undefined, rating: SrsRating, now = Date.now()): SrsCard {
  const previousBox = prev?.box ?? 0;
  const box =
    rating === "again"
      ? 1
      : rating === "partial"
        ? Math.max(2, previousBox - 1)
        : previousBox === 0
          ? 3
          : Math.min(MAX_BOX, previousBox + 1);
  return { box, due: now + BOX_INTERVALS_MS[box], last: now };
}

export function intervalFor(prev: SrsCard | undefined, rating: SrsRating): number {
  return nextCard(prev, rating, 0).due;
}

export function formatInterval(ms: number): string {
  if (ms < 60 * MINUTE_MS) return `${Math.round(ms / MINUTE_MS)} min`;
  const days = Math.round(ms / DAY_MS);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

interface SrsState {
  cards: Record<string, SrsCard>;
  rate: (mapId: MapId, nodeId: string, rating: SrsRating) => void;
  restore: (mapId: MapId, nodeId: string, card: SrsCard | undefined) => void;
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
      restore: (mapId, nodeId, card) =>
        set((s) => {
          const key = srsKey(mapId, nodeId);
          const cards = { ...s.cards };
          if (card) cards[key] = card;
          else delete cards[key];
          return { cards };
        }),
    }),
    { name: "math-atlas-srs-v1" },
  ),
);

export function dueIds(cards: Record<string, SrsCard>, mapId: MapId, ids: string[], now = Date.now()): string[] {
  return ids.filter((id) => isDue(cards[srsKey(mapId, id)], now));
}
