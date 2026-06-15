import { useEffect } from "react";
import { useStore } from "../store";
import { cmpNum } from "../lib/graph";

/** Arrow keys navigate sequentially; Esc clears selection. */
export function useKeyboardNav() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);

  useEffect(() => {
    if (!map) return;
    const { data } = map;
    const sorted = [...data.nodes].sort(cmpNum);
    const indexById = new Map(sorted.map((n, i) => [n.id, i]));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;
      const { selectedId, select, surface, routeMode, routeFrom, routeTo, clearRoute } =
        useStore.getState();
      // The flashcard and sandbox surfaces own their own keyboard shortcuts.
      if (surface === "flashcards" || surface === "sandbox") return;
      if (e.key === "Escape") {
        // Cancel route planning first, then fall back to clearing selection.
        if (routeMode || (routeFrom && routeTo)) clearRoute();
        else select(null);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "j", "k"].includes(e.key)) return;
      e.preventDefault();
      const cur = selectedId ? (indexById.get(selectedId) ?? -1) : -1;
      const delta = e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j" ? 1 : -1;
      const next = (cur + delta + sorted.length) % sorted.length;
      select(sorted[next].id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [map]);
}
