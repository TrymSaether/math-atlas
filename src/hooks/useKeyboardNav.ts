import { useEffect } from "react";
import { useStore } from "../store";
import { data } from "../data";
import { cmpNum } from "../lib/graph";

/** Arrow keys navigate sequentially; Esc clears selection. */
export function useKeyboardNav() {
  useEffect(() => {
    const sorted = [...data.nodes].sort(cmpNum);
    const indexById = new Map(sorted.map((n, i) => [n.id, i]));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const { selectedId, select } = useStore.getState();
      if (e.key === "Escape") { select(null); return; }
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
