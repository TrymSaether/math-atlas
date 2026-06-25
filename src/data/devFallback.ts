/**
 * Dev-only offline maps fallback.
 *
 * Maps normally load from the API (see mapsApi.ts), which needs the Hono server
 * + Postgres running. To keep the SPA runnable for local UI work without a
 * backend, this module serves the bundled authoring sources in
 * `src/data/maps/*.source.json` when an API call fails **in dev only**.
 *
 * The glob is lazy, so the source JSON is emitted as separate chunks that the
 * production bundle never imports (the fallback is gated on `import.meta.env.DEV`).
 * This touches only the read side; the schema and authoring pipeline are unchanged.
 */
import type { CatalogEntry, MapPayload } from "./mapsApi";

type SourceLoader = () => Promise<{ default: unknown }>;

const sourceLoaders = import.meta.glob("./maps/*.source.json") as Record<string, SourceLoader>;

/** `./maps/topology.source.json` → `topology` (the historical map slug). */
function slugFromPath(path: string): string {
  return path.replace(/^.*\//, "").replace(/\.source\.json$/, "");
}

const loaderBySlug = new Map<string, SourceLoader>(
  Object.entries(sourceLoaders).map(([path, load]) => [slugFromPath(path), load]),
);

interface BundledSourceMeta {
  label?: string;
  updated?: string;
}

/** True only in dev — the single gate every fallback call checks. */
export const DEV_OFFLINE_FALLBACK = import.meta.env.DEV;

export async function devCatalog(): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];
  for (const [slug, load] of loaderBySlug) {
    const src = (await load()).default as BundledSourceMeta;
    entries.push({ slug, title: src.label ?? slug, id: slug, role: "public", updated: src.updated ?? "" });
  }
  return entries.sort((a, b) => a.title.localeCompare(b.title));
}

export async function devMap(idOrSlug: string): Promise<MapPayload | null> {
  const load = loaderBySlug.get(idOrSlug);
  if (!load) return null;
  const src = (await load()).default as BundledSourceMeta;
  return {
    id: idOrSlug,
    slug: idOrSlug,
    title: src.label ?? idOrSlug,
    role: "public",
    updated: src.updated ?? "",
    baseVersion: 0,
    source: src,
  };
}
