import type { SourceGraph } from "@shared/maps/source";
import { buildLoadedMapFromSource, type LoadedMap } from "./load";
import {
  deleteMap,
  fetchCatalog,
  fetchMap,
  forkMap,
  saveMapSource,
  type CatalogEntry,
  type MapPayload,
  type MapRole,
} from "./api";
import { clearCachedMap, getCachedCatalog, getCachedMap, setCachedCatalog, setCachedMap } from "./cache";
import type { MapId } from "./registry";

export interface MapMeta {
  id: string;
  role: MapRole;
  baseVersion: number;
  updated: string;
}

export interface MapServiceDependencies {
  fetchCatalog: typeof fetchCatalog;
  fetchMap: typeof fetchMap;
  forkMap: typeof forkMap;
  saveMapSource: typeof saveMapSource;
  deleteMap: typeof deleteMap;
  getCachedCatalog: typeof getCachedCatalog;
  setCachedCatalog: typeof setCachedCatalog;
  getCachedMap: typeof getCachedMap;
  setCachedMap: typeof setCachedMap;
  clearCachedMap: typeof clearCachedMap;
}

export type CatalogLoadResult =
  | { ok: true; catalog: CatalogEntry[] }
  | { ok: false; cached: CatalogEntry[] | null; error: unknown };

export type SaveMapOutcome = { status: "skipped" } | { status: "conflict" } | { status: "saved"; meta: MapMeta };

export interface SaveMapInput {
  slug: MapId;
  source: SourceGraph;
  meta: MapMeta | undefined;
  catalog: CatalogEntry[];
  onForked: (meta: MapMeta, entry: CatalogEntry) => void;
}

export function createMapService(deps: MapServiceDependencies) {
  return {
    cachedCatalog(): CatalogEntry[] | null {
      return deps.getCachedCatalog();
    },

    async loadCatalog(): Promise<CatalogLoadResult> {
      try {
        const catalog = await deps.fetchCatalog();
        deps.setCachedCatalog(catalog);
        return { ok: true, catalog };
      } catch (error) {
        return { ok: false, cached: deps.getCachedCatalog(), error };
      }
    },

    async loadMap(id: string): Promise<{ map: LoadedMap; payload: MapPayload }> {
      const cached = deps.getCachedMap(id);
      if (cached) {
        void deps
          .fetchMap(id)
          .then(deps.setCachedMap)
          .catch(() => {
            /* offline / backend asleep — keep serving cache */
          });
        const built = buildLoadedMapFromSource(cached.source);
        if (built.ok) return { map: built.map, payload: cached };
      }

      const payload = await deps.fetchMap(id);
      deps.setCachedMap(payload);
      const built = buildLoadedMapFromSource(payload.source);
      if (!built.ok) throw new Error(built.error);
      return { map: built.map, payload };
    },

    async saveMap(input: SaveMapInput): Promise<SaveMapOutcome> {
      let meta = input.meta;
      if (!meta || (meta.role !== "owner" && meta.role !== "editor")) {
        const fromId = meta?.id ?? input.catalog.find((entry) => entry.slug === input.slug)?.id;
        if (!fromId) return { status: "skipped" };
        const fork = await deps.forkMap(fromId);
        meta = { id: fork.id, role: "owner", baseVersion: input.source.version, updated: "" };
        const title = input.catalog.find((entry) => entry.slug === input.slug)?.title ?? input.slug;
        input.onForked(meta, {
          slug: input.slug,
          id: fork.id,
          role: "owner",
          title,
          updated: "",
        });
      }

      const result = await deps.saveMapSource(meta.id, input.source.version, input.source, meta.updated || undefined);
      if (!result.ok) return { status: "conflict" };

      const saved = { ...meta, baseVersion: input.source.version, updated: result.updated };
      const title = input.catalog.find((entry) => entry.slug === input.slug)?.title ?? input.slug;
      deps.setCachedMap({
        id: meta.id,
        slug: input.slug,
        title,
        role: meta.role,
        updated: result.updated,
        baseVersion: input.source.version,
        source: input.source,
      });
      return { status: "saved", meta: saved };
    },

    clearMapCache(id: string): void {
      deps.clearCachedMap(id);
    },

    async revertOwnedMap(meta: MapMeta | undefined): Promise<void> {
      if (meta?.role !== "owner") return;
      deps.clearCachedMap(meta.id);
      await deps.deleteMap(meta.id);
    },

    async hasRemoteUpdate(slug: MapId, meta: MapMeta): Promise<boolean> {
      const entry = (await deps.fetchCatalog()).find(
        (candidate) => candidate.slug === slug && candidate.id === meta.id,
      );
      return Boolean(entry && meta.updated && new Date(entry.updated) > new Date(meta.updated));
    },
  };
}

export const mapService = createMapService({
  fetchCatalog,
  fetchMap,
  forkMap,
  saveMapSource,
  deleteMap,
  getCachedCatalog,
  setCachedCatalog,
  getCachedMap,
  setCachedMap,
  clearCachedMap,
});

/** Compatibility entry point retained for callers of the former data-layer helper. */
export const fetchAndBuildMap = (id: string) => mapService.loadMap(id);
