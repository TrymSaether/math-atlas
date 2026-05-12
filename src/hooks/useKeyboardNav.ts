import { useEffect } from "react";
import { useStore } from "../store";
import { atlasNodes, DEFAULT_SELECTED_ID } from "../atlas";

/** Arrow keys navigate sequentially; Esc clears selection. */
export function useKeyboardNav() {
  useEffect(() => {
    const sorted = [...atlasNodes];
    const indexById = new Map(sorted.map((n, i) => [n.id, i]));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const { selectedId, select } = useStore.getState();
      if (e.key === "Escape") { select(DEFAULT_SELECTED_ID); return; }
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "j", "k"].includes(e.key)) return;
      e.preventDefault();
      const cur = selectedId ? indexById.get(selectedId) ?? -1 : -1;
      const delta = (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") ? 1 : -1;
      const next = (cur + delta + sorted.length) % sorted.length;
      select(sorted[next].id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
