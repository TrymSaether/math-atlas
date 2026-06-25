import { useEffect } from "react";
import { useStore } from "../store";

/**
 * The shareable deep link for the current map / concept / surface. Pairs with
 * the URL parsing in the store's init (`readUrlState`) so a copied link reopens
 * the exact same view.
 */
export function shareUrl(): string {
  const { mapId, selectedId, surface } = useStore.getState();
  const p = new URLSearchParams();
  p.set("map", mapId);
  if (surface !== "atlas") p.set("view", surface);
  if (selectedId) p.set("node", selectedId);
  return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
}

/**
 * Keep the address bar in sync with the active map, selected concept, and
 * surface so every view is deep-linkable and shareable. Uses `replaceState`
 * (no history spam) — one call per state change.
 */
export function useUrlSync(): void {
  const mapId = useStore((s) => s.mapId);
  const selectedId = useStore((s) => s.selectedId);
  const surface = useStore((s) => s.surface);

  useEffect(() => {
    const p = new URLSearchParams();
    p.set("map", mapId);
    if (surface !== "atlas") p.set("view", surface);
    if (selectedId) p.set("node", selectedId);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [mapId, selectedId, surface]);
}
