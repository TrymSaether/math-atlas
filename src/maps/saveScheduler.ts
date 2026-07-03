import type { MapId } from "./registry";

export interface SaveScheduler {
  schedule(slug: MapId, work: () => void | Promise<void>, delayMs?: number): void;
  cancel(slug: MapId): void;
}

export function createSaveScheduler(): SaveScheduler {
  const timers = new Map<MapId, ReturnType<typeof setTimeout>>();

  return {
    schedule(slug, work, delayMs = 800) {
      const existing = timers.get(slug);
      if (existing) clearTimeout(existing);
      timers.set(
        slug,
        setTimeout(() => {
          timers.delete(slug);
          void work();
        }, delayMs),
      );
    },

    cancel(slug) {
      const existing = timers.get(slug);
      if (!existing) return;
      clearTimeout(existing);
      timers.delete(slug);
    },
  };
}

export const mapSaveScheduler = createSaveScheduler();
