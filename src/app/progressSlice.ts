import type { StoreApi } from "zustand";
import { progressService } from "@/progress/service";
import type { MapId } from "@/maps";
import type { ProgressStatus } from "@/progress/api";
import type { State } from "./store";

export interface ProgressSlice {
  progress: Partial<Record<MapId, Record<string, ProgressStatus>>>;
  loadProgress: (mapId: MapId) => Promise<void>;
  setNodeProgress: (mapId: MapId, nodeId: string, status: ProgressStatus | null) => void;
}

export function createProgressSlice(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  service = progressService,
): ProgressSlice {
  return {
    progress: {},

    loadProgress: async (mapId) => {
      if (!get().userId) return;
      try {
        const rows = await service.load(mapId);
        const byNode: Record<string, ProgressStatus> = {};
        for (const row of rows) byNode[row.nodeId] = row.status;
        set((state) => ({ progress: { ...state.progress, [mapId]: byNode } }));
      } catch (error) {
        console.warn(`[math-atlas] progress load failed for "${mapId}":`, error);
      }
    },

    setNodeProgress: (mapId, nodeId, status) => {
      set((state) => {
        const forMap = { ...(state.progress[mapId] ?? {}) };
        if (status === null) delete forMap[nodeId];
        else forMap[nodeId] = status;
        return { progress: { ...state.progress, [mapId]: forMap } };
      });
      if (!get().userId) return;
      service
        .save(mapId, nodeId, status)
        .catch((error) => console.warn(`[math-atlas] progress save failed for "${nodeId}":`, error));
    },
  };
}
