/**
 * Client for the maps API (Stage A — maps as first-class API entities).
 *
 * Maps are loaded from the server (no bundled artifacts). The catalog resolves a
 * stable `slug` (the historical MapId, e.g. "topology") to the best map the
 * caller can access — their own editable fork if they have one, else a shared
 * copy, else the public/system map. Editing a public map forks it first.
 */
import {
  AddCollaboratorRequestSchema,
  ApiErrorSchema,
  CollaboratorsResponseSchema,
  ForkMapRequestSchema,
  ForkMapResponseSchema,
  MapCatalogResponseSchema,
  MapPayloadSchema,
  OkResponseSchema,
  SaveMapConflictResponseSchema,
  SaveMapRequestSchema,
  SaveMapResponseSchema,
  type Collaborator,
  type MapPayload,
  type MapRole,
} from "../../shared/contracts";
import type { MapId } from "./registry";
import { DEV_OFFLINE_FALLBACK, devCatalog, devMap } from "./devFallback";

export type { Collaborator, MapPayload, MapRole };

/** A resolved catalog entry (one per slug, best access wins). */
export interface CatalogEntry {
  slug: MapId;
  title: string;
  /** The map entity id (uuid) to fetch/save. */
  id: string;
  role: MapRole;
  /** Server-side last-modified timestamp (for remote-change detection). */
  updated: string;
}

const ROLE_RANK: Record<string, number> = { owner: 3, editor: 2, viewer: 1, public: 0 };

const opts = (extra?: RequestInit): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  ...extra,
});

/** Fetch the catalog and collapse to one entry per slug (best access wins). */
export async function fetchCatalog(): Promise<CatalogEntry[]> {
  try {
    const res = await fetch("/api/maps/catalog", opts());
    if (!res.ok) throw new Error(`catalog failed: ${res.status}`);
    const rows = MapCatalogResponseSchema.parse(await res.json());

    const bySlug = new Map<string, CatalogEntry>();
    for (const r of rows) {
      const cur = bySlug.get(r.slug);
      if (!cur || ROLE_RANK[r.role] > ROLE_RANK[cur.role]) {
        bySlug.set(r.slug, {
          slug: r.slug,
          title: r.title,
          id: r.id,
          role: r.role,
          updated: r.updated,
        });
      }
    }
    return [...bySlug.values()];
  } catch (err) {
    if (DEV_OFFLINE_FALLBACK) return devCatalog();
    throw err;
  }
}

export async function fetchMap(id: string): Promise<MapPayload> {
  try {
    const res = await fetch(`/api/maps/${id}`, opts());
    if (!res.ok) throw new Error(`map fetch failed: ${res.status}`);
    return MapPayloadSchema.parse(await res.json());
  } catch (err) {
    if (DEV_OFFLINE_FALLBACK) {
      const fallback = await devMap(id);
      if (fallback) return fallback;
    }
    throw err;
  }
}

/** Fork a readable map into the caller's own editable copy; returns the new id. */
export async function forkMap(fromId: string): Promise<{ id: string; slug: string }> {
  const body = ForkMapRequestSchema.parse({ fromId });
  const res = await fetch("/api/maps", opts({ method: "POST", body: JSON.stringify(body) }));
  if (!res.ok) throw new Error(`fork failed: ${res.status} ${await res.text()}`);
  return ForkMapResponseSchema.parse(await res.json());
}

export type SaveResult = { ok: true; updated: string } | { ok: false; conflict: true; updated: string };

export async function saveMapSource(
  id: string,
  baseVersion: number,
  source: unknown,
  baseUpdated?: string,
): Promise<SaveResult> {
  const body = SaveMapRequestSchema.parse({ baseVersion, source, baseUpdated });
  const res = await fetch(`/api/maps/${id}`, opts({ method: "PUT", body: JSON.stringify(body) }));
  if (res.status === 409) {
    const conflict = SaveMapConflictResponseSchema.parse(await res.json());
    return { ok: false, conflict: true, updated: conflict.updated };
  }
  if (!res.ok) throw new Error(`save failed: ${res.status} ${await res.text()}`);
  const saved = SaveMapResponseSchema.parse(await res.json());
  return { ok: true, updated: saved.updated };
}

export async function deleteMap(id: string): Promise<void> {
  const res = await fetch(`/api/maps/${id}`, opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`delete failed: ${res.status}`);
}

// --- Collaborators (Phase 4) ---

export async function listCollaborators(id: string): Promise<Collaborator[]> {
  const res = await fetch(`/api/maps/${id}/collaborators`, opts());
  if (!res.ok) throw new Error(`collaborators failed: ${res.status}`);
  return CollaboratorsResponseSchema.parse(await res.json());
}

export async function addCollaborator(
  id: string,
  email: string,
  role: "editor" | "viewer" = "editor",
): Promise<{ ok?: boolean; error?: string }> {
  const request = AddCollaboratorRequestSchema.parse({ email, role });
  const res = await fetch(`/api/maps/${id}/collaborators`, opts({ method: "POST", body: JSON.stringify(request) }));
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = ApiErrorSchema.safeParse(body);
    return { error: error.success ? error.data.error : `Failed (${res.status})` };
  }
  OkResponseSchema.parse(body);
  return { ok: true };
}

export async function removeCollaborator(id: string, userId: string): Promise<void> {
  const res = await fetch(`/api/maps/${id}/collaborators/${userId}`, opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`remove failed: ${res.status}`);
}
