import type { StoreApi } from "zustand";

import type { State } from "@/app/store";
import type { RouteKind } from "./route";

export type AtlasMode = "explore" | "paths";

export interface AtlasSlice {
  /**
   * Directions. Two build modes over the dependency DAG:
   *   • prereq — upstream cone of a single goal (`routeTo`); `routeFrom` unused.
   *   • path   — every dependency path between `routeFrom` and `routeTo`.
   */
  routeKind: RouteKind;
  setRouteKind: (kind: RouteKind) => void;
  /** When true, routes also include proof-only prerequisites (the proof overlay). */
  routeIncludeProof: boolean;
  setRouteIncludeProof: (on: boolean) => void;
  routeMode: boolean;
  routeFrom: string | null;
  routeTo: string | null;
  /** Bumped to replay the traversal animation. */
  routeRunKey: number;
  /** Enter/cancel route planning (clears any in-progress pick). */
  toggleRouteMode: () => void;
  /** Click handler while planning: prereq sets the goal; path picks start→stop. */
  pickRoutePoint: (id: string) => void;
  setRouteEndpoint: (endpoint: "from" | "to", id: string | null) => void;
  swapRouteEndpoints: () => void;
  clearRoute: () => void;
  replayRoute: () => void;
  /** Current route's study order, mirrored here so the tour can walk it. */
  routeSequence: string[];
  setRouteSequence: (ids: string[]) => void;
  /** Guided tour: index into `routeSequence`, or null when not touring. */
  tourIndex: number | null;
  startTour: () => void;
  tourStep: (delta: number) => void;
  endTour: () => void;

  /** Atlas mode: free Explore vs guided Paths (the hybrid exploration model). */
  mode: AtlasMode;
  setMode: (mode: AtlasMode) => void;
}

export function createAtlasSlice(
  set: StoreApi<State>["setState"],
  initial: { routeKind: RouteKind; routeIncludeProof: boolean; mode: AtlasMode },
): AtlasSlice {
  return {
    routeKind: initial.routeKind,
    setRouteKind: (routeKind) =>
      set((s) => ({
        routeKind,
        // Switching modes invalidates an in-progress pick and any active tour.
        routeMode: true,
        routeFrom: null,
        routeTo: routeKind === "prereq" ? s.selectedId : null,
        tourIndex: null,
        routeRunKey: s.routeRunKey + 1,
      })),
    routeIncludeProof: initial.routeIncludeProof,
    setRouteIncludeProof: (routeIncludeProof) =>
      set((s) => ({ routeIncludeProof, tourIndex: null, routeRunKey: s.routeRunKey + 1 })),
    routeMode: false,
    routeFrom: null,
    routeTo: null,
    routeRunKey: 0,
    toggleRouteMode: () =>
      set((s) =>
        s.routeMode
          ? { routeMode: false, routeFrom: null, routeTo: null, tourIndex: null }
          : s.routeKind === "prereq"
            ? { routeMode: true, routeFrom: null, routeTo: s.selectedId, tourIndex: null }
            : { routeMode: true, routeFrom: s.selectedId, routeTo: null, tourIndex: null },
      ),
    pickRoutePoint: (id) =>
      set((s) => {
        if (s.routeKind === "prereq") {
          // One pick = the goal; its prerequisite cone resolves immediately.
          return {
            routeTo: id,
            routeFrom: null,
            routeMode: false,
            tourIndex: null,
            routeRunKey: s.routeRunKey + 1,
          };
        }
        if (!s.routeFrom) {
          if (s.routeTo && id !== s.routeTo) {
            return {
              routeFrom: id,
              routeMode: false,
              tourIndex: null,
              routeRunKey: s.routeRunKey + 1,
            };
          }
          return { routeFrom: id, routeTo: null };
        }
        if (id === s.routeFrom) return {};
        return { routeTo: id, routeMode: false, tourIndex: null, routeRunKey: s.routeRunKey + 1 };
      }),
    setRouteEndpoint: (endpoint, id) =>
      set((s) => {
        const nextFrom = endpoint === "from" ? id : s.routeFrom;
        const nextTo = endpoint === "to" ? id : s.routeTo;
        const dedupedTo = nextFrom && nextTo === nextFrom ? null : nextTo;
        const complete = Boolean(nextFrom && dedupedTo);
        return {
          routeFrom: nextFrom,
          routeTo: dedupedTo,
          routeMode: !complete,
          tourIndex: null,
          routeRunKey: complete ? s.routeRunKey + 1 : s.routeRunKey,
        };
      }),
    swapRouteEndpoints: () =>
      set((s) => {
        const complete = Boolean(s.routeFrom && s.routeTo);
        return {
          routeFrom: s.routeTo,
          routeTo: s.routeFrom,
          routeMode: !complete,
          tourIndex: null,
          routeRunKey: complete ? s.routeRunKey + 1 : s.routeRunKey,
        };
      }),
    clearRoute: () => set({ routeMode: false, routeFrom: null, routeTo: null, tourIndex: null, routeSequence: [] }),
    replayRoute: () => set((s) => ({ routeRunKey: s.routeRunKey + 1 })),

    routeSequence: [],
    setRouteSequence: (ids) =>
      set((s) => {
        // Keep an active tour in bounds when the underlying sequence changes.
        if (s.tourIndex === null) return { routeSequence: ids };
        if (ids.length === 0) return { routeSequence: ids, tourIndex: null };
        return { routeSequence: ids, tourIndex: Math.min(s.tourIndex, ids.length - 1) };
      }),
    tourIndex: null,
    startTour: () =>
      set((s) => {
        if (s.routeSequence.length === 0) return {};
        return { tourIndex: 0, selectedId: s.routeSequence[0] };
      }),
    tourStep: (delta) =>
      set((s) => {
        if (s.tourIndex === null || s.routeSequence.length === 0) return {};
        const next = Math.max(0, Math.min(s.routeSequence.length - 1, s.tourIndex + delta));
        return { tourIndex: next, selectedId: s.routeSequence[next] };
      }),
    endTour: () => set({ tourIndex: null }),

    mode: initial.mode,
    setMode: (mode) =>
      set((s) =>
        mode === "paths"
          ? // Enter Paths: begin planning unless a complete route is already set.
            { mode, routeMode: !(s.routeFrom && s.routeTo) }
          : // Back to Explore: clear the route overlay and any tour.
            { mode: "explore", routeMode: false, routeFrom: null, routeTo: null, routeSequence: [], tourIndex: null },
      ),
  };
}
