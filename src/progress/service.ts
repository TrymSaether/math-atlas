import type { MapId } from "@/maps/registry";
import { deleteProgress, fetchProgress, putProgress, type ProgressEntry, type ProgressStatus } from "./api";

export interface ProgressServiceDependencies {
  fetchProgress: typeof fetchProgress;
  putProgress: typeof putProgress;
  deleteProgress: typeof deleteProgress;
}

export function createProgressService(deps: ProgressServiceDependencies) {
  return {
    load(mapId: MapId): Promise<ProgressEntry[]> {
      return deps.fetchProgress(mapId);
    },

    save(mapId: MapId, nodeId: string, status: ProgressStatus | null): Promise<void> {
      return status === null ? deps.deleteProgress(mapId, nodeId) : deps.putProgress(mapId, nodeId, status);
    },
  };
}

export const progressService = createProgressService({ fetchProgress, putProgress, deleteProgress });
