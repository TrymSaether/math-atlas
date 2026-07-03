/**
 * Client for the learning-progress API (Phase 3). Progress is per-user and keyed
 * by map slug, so it follows the subject across forks. Requires sign-in; signed
 * out, callers keep ephemeral local-only state.
 */
import {
  OkResponseSchema,
  ProgressResponseSchema,
  PutProgressRequestSchema,
  type ProgressEntry,
  type ProgressStatus,
} from "../../shared/atlas/contracts";
import { apiUrl, authHeaders } from "@/auth/client";
import type { MapId } from "@/maps/registry";

export type { ProgressEntry, ProgressStatus };

const opts = (extra?: RequestInit): RequestInit => ({
  credentials: "omit",
  headers: authHeaders(),
  ...extra,
});

export async function fetchProgress(mapId: MapId): Promise<ProgressEntry[]> {
  const res = await fetch(apiUrl(`/api/progress/${mapId}`), opts());
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`progress fetch failed: ${res.status}`);
  return ProgressResponseSchema.parse(await res.json());
}

export async function putProgress(mapId: MapId, nodeId: string, status: ProgressStatus): Promise<void> {
  const body = PutProgressRequestSchema.parse({ nodeId, status });
  const res = await fetch(apiUrl(`/api/progress/${mapId}`), opts({ method: "PUT", body: JSON.stringify(body) }));
  if (!res.ok) throw new Error(`progress save failed: ${res.status}`);
  OkResponseSchema.parse(await res.json());
}

export async function deleteProgress(mapId: MapId, nodeId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/progress/${mapId}/${nodeId}`), opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`progress delete failed: ${res.status}`);
}
