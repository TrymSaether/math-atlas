/**
 * Client for the maps API (Stage A — maps as first-class API entities).
 *
 * Maps are loaded from the server (no bundled artifacts). The catalog resolves a
 * stable `slug` (the historical MapId, e.g. "topology") to the best map the
 * caller can access — their own editable fork if they have one, else a shared
 * copy, else the public/system map. Editing a public map forks it first.
 */
import { apiUrl, authHeaders } from "../lib/authClient";
import type { MapId } from "./mapRegistry";

export type MapRole = "owner" | "editor" | "viewer" | "public";

/** A catalog row as the server returns it (one per map entity). */
interface ServerCatalogRow {
  id: string;
  slug: string;
  title: string;
  visibility: "private" | "unlisted" | "public";
  role: "owner" | "editor" | "public";
  updated: string;
}

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

export interface MapPayload {
  id: string;
  slug: MapId;
  title: string;
  role: MapRole;
  updated: string;
  baseVersion: number;
  source: unknown;
}

const ROLE_RANK: Record<string, number> = { owner: 3, editor: 2, viewer: 1, public: 0 };

const opts = (extra?: RequestInit): RequestInit => ({
  credentials: "omit",
  headers: authHeaders(),
  ...extra,
});

/** Fetch the catalog and collapse to one entry per slug (best access wins). */
export async function fetchCatalog(): Promise<CatalogEntry[]> {
  const res = await fetch(apiUrl("/api/maps/catalog"), opts());
  if (!res.ok) throw new Error(`catalog failed: ${res.status}`);
  const rows: ServerCatalogRow[] = await res.json();

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
}

export async function fetchMap(id: string): Promise<MapPayload> {
  const res = await fetch(apiUrl(`/api/maps/${id}`), opts());
  if (!res.ok) throw new Error(`map fetch failed: ${res.status}`);
  return res.json();
}

/** Fork a readable map into the caller's own editable copy; returns the new id. */
export async function forkMap(fromId: string): Promise<{ id: string; slug: string }> {
  const res = await fetch(apiUrl("/api/maps"), opts({ method: "POST", body: JSON.stringify({ fromId }) }));
  if (!res.ok) throw new Error(`fork failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export type SaveResult = { ok: true; updated: string } | { ok: false; conflict: true; updated: string };

export async function saveMapSource(
  id: string,
  baseVersion: number,
  source: unknown,
  baseUpdated?: string,
): Promise<SaveResult> {
  const res = await fetch(
    apiUrl(`/api/maps/${id}`),
    opts({ method: "PUT", body: JSON.stringify({ baseVersion, source, baseUpdated }) }),
  );
  if (res.status === 409) {
    const body = await res.json();
    return { ok: false, conflict: true, updated: body.updated };
  }
  if (!res.ok) throw new Error(`save failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return { ok: true, updated: body.updated };
}

export async function deleteMap(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/maps/${id}`), opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`delete failed: ${res.status}`);
}

// --- Collaborators (Phase 4) ---

export interface Collaborator {
  userId: string;
  role: "editor" | "viewer";
  email: string;
  name: string;
}

export async function listCollaborators(id: string): Promise<Collaborator[]> {
  const res = await fetch(apiUrl(`/api/maps/${id}/collaborators`), opts());
  if (!res.ok) throw new Error(`collaborators failed: ${res.status}`);
  return res.json();
}

export async function addCollaborator(
  id: string,
  email: string,
  role: "editor" | "viewer" = "editor",
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(
    apiUrl(`/api/maps/${id}/collaborators`),
    opts({ method: "POST", body: JSON.stringify({ email, role }) }),
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { error: body.error ?? `Failed (${res.status})` };
  return { ok: true };
}

export async function removeCollaborator(id: string, userId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/maps/${id}/collaborators/${userId}`), opts({ method: "DELETE" }));
  if (!res.ok && res.status !== 404) throw new Error(`remove failed: ${res.status}`);
}
