/**
 * Client for the learning-progress API (Phase 3). Progress is per-user and keyed
 * by map slug, so it follows the subject across forks. Requires sign-in; signed
 * out, callers keep ephemeral local-only state.
 */
import { apiUrl, authHeaders } from "../lib/authClient";
import type { MapId } from "./mapRegistry";

export type ProgressStatus = "learning" | "known";

export interface ProgressEntry {
  nodeId: string;
  status: ProgressStatus;
}

const opts = (extra?: RequestInit): RequestInit => ({
  credentials: "omit",
  headers: authHeaders(),
  ...extra,
});

export async function fetchProgress(mapId: MapId): Promise<ProgressEntry[]> {
  const res = await fetch(apiUrl(`/api/progress/${mapId}`), opts());
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`progress fetch failed: ${res.status}`);
  return res.json();
}

export async function putProgress(mapId: MapId, nodeId: string, status: ProgressStatus): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/progress/${mapId}`),
    opts({ method: "PUT", body: JSON.stringify({ nodeId, status }) }),
  );
  if (!res.ok) throw new Error(`progress save failed: ${res.status}`);
}

export async function deleteProgress(mapId: MapId, nodeId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/progress/${mapId}/${nodeId}`), opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`progress delete failed: ${res.status}`);
}
