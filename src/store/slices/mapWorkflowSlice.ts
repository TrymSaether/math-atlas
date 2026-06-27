import type { StoreApi } from "zustand";
import type { PersistedMapState } from "../../infrastructure/storage/appStateStorage";
import { mapService, type MapMeta } from "../../application/maps/mapService";
import type { CatalogEntry, LoadedMap, MapId } from "../../data";
import type { NodeKind, Relation } from "../../types";
import type { State } from "../../store";

export interface RestoredMapState {
  search: string;
  kinds: Set<NodeKind>;
  topics: Set<string>;
  relations: Set<Relation>;
  selectedId: string | null;
  routeMode: false;
  routeFrom: null;
  routeTo: null;
}

export interface MapWorkflowSlice {
  setMap: (mapId: MapId) => void;
  ensureMapLoaded: (mapId?: MapId) => Promise<void>;
  loadCatalog: () => Promise<void>;
  onSessionChange: () => Promise<void>;
  reloadActiveMap: () => Promise<void>;
  checkRemoteUpdate: () => Promise<void>;
}

interface MapWorkflowSliceOptions {
  persistedMaps: Partial<Record<MapId, PersistedMapState>>;
  rememberMapState: (state: State) => void;
  mapStateForLoadedMap: (map: LoadedMap, saved: PersistedMapState | undefined) => RestoredMapState;
}

function editableSlugs(catalog: CatalogEntry[]): Set<MapId> {
  return new Set(
    catalog.filter((entry) => entry.role === "owner" || entry.role === "editor").map((entry) => entry.slug),
  );
}

export function createMapWorkflowSlice(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  options: MapWorkflowSliceOptions,
  service = mapService,
): MapWorkflowSlice {
  return {
    ensureMapLoaded: async (mapId = get().mapId) => {
      if (get().loadedMaps[mapId]) return;

      set({ loadingMapId: mapId, mapError: null });
      try {
        if (get().catalog.length === 0) await get().loadCatalog();
        const entry = get().catalog.find((candidate) => candidate.slug === mapId);
        if (!entry) throw new Error(`Map not available: ${mapId}`);
        const { map, payload } = await service.loadMap(entry.id);
        set((state) => {
          const loadedMaps = { ...state.loadedMaps, [mapId]: map };
          const mapMeta = {
            ...state.mapMeta,
            [mapId]: {
              id: payload.id,
              role: payload.role,
              baseVersion: payload.baseVersion,
              updated: payload.updated,
            },
          };
          if (state.mapId !== mapId) {
            return {
              loadedMaps,
              mapMeta,
              loadingMapId: state.loadingMapId === mapId ? null : state.loadingMapId,
            };
          }
          return {
            loadedMaps,
            mapMeta,
            loadingMapId: null,
            mapError: null,
            ...options.mapStateForLoadedMap(map, options.persistedMaps[mapId]),
          };
        });
        if (get().userId && !get().progress[mapId]) void get().loadProgress(mapId);
      } catch (error) {
        set({
          loadingMapId: null,
          mapError: error instanceof Error ? error.message : String(error),
        });
      }
    },

    setMap: (mapId) => {
      options.rememberMapState(get());
      const map = get().loadedMaps[mapId];
      set({
        mapId,
        ...(map
          ? options.mapStateForLoadedMap(map, options.persistedMaps[mapId])
          : {
              search: options.persistedMaps[mapId]?.search ?? "",
              kinds: new Set<NodeKind>(),
              topics: new Set<string>(),
              relations: new Set<Relation>(),
              selectedId: null,
              routeFrom: null,
              routeTo: null,
            }),
        routeMode: false,
        tourIndex: null,
        routeSequence: [],
      });
      void get().ensureMapLoaded(mapId);
    },

    reloadActiveMap: async () => {
      const slug = get().mapId;
      const meta = get().mapMeta[slug];
      if (meta) service.clearMapCache(meta.id);
      set((state) => {
        const loadedMaps = { ...state.loadedMaps };
        delete loadedMaps[slug];
        const mapMeta = { ...state.mapMeta };
        delete mapMeta[slug];
        const editSources = { ...state.editSources };
        delete editSources[slug];
        const editedMaps = new Set(state.editedMaps);
        editedMaps.delete(slug);
        return { loadedMaps, mapMeta, editSources, editedMaps, staleMap: null };
      });
      await get().loadCatalog();
      await get().ensureMapLoaded(slug);
    },

    checkRemoteUpdate: async () => {
      const slug = get().mapId;
      const meta: MapMeta | undefined = get().mapMeta[slug];
      if (!meta || !get().userId || get().staleMap) return;
      try {
        if (await service.hasRemoteUpdate(slug, meta)) set({ staleMap: slug });
      } catch {
        /* offline — ignore */
      }
    },

    loadCatalog: async () => {
      const result = await service.loadCatalog();
      if (result.ok) {
        set({ catalog: result.catalog, editedMaps: editableSlugs(result.catalog) });
        return;
      }
      if (result.cached && get().catalog.length === 0) set({ catalog: result.cached });
      console.warn("[math-atlas] catalog load failed:", result.error);
    },

    onSessionChange: async () => {
      await get().loadCatalog();
      const mapId = get().mapId;
      set((state) => {
        const loadedMaps = { ...state.loadedMaps };
        delete loadedMaps[mapId];
        const mapMeta = { ...state.mapMeta };
        delete mapMeta[mapId];
        const editSources = { ...state.editSources };
        delete editSources[mapId];
        return { loadedMaps, mapMeta, editSources };
      });
      if (get().userId) await get().loadProgress(mapId);
      else set({ progress: {} });
      await get().ensureMapLoaded(mapId);
    },
  };
}
