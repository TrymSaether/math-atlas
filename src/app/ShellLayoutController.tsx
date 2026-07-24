import { useEffect } from "react";

/**
 * Measures the shell's occupied columns and publishes one canvas-inset
 * contract. Floating panels remain visually independent, but no canvas camera
 * has to guess how much usable space is left.
 */
export function ShellLayoutController() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let measured = false;
    let occupiedLeft = 0;

    const measure = () => {
      frame = 0;
      const sidebar = document.querySelector<HTMLElement>("[data-shell-sidebar]");
      const panel = document.querySelector<HTMLElement>("[data-shell-context-panel]");
      const sidebarWidth = sidebar?.getBoundingClientRect().width ?? 0;
      const panelWidth = panel?.getBoundingClientRect().width ?? 0;
      const shellGap = Number.parseFloat(getComputedStyle(root).getPropertyValue("--shell-panel-gap")) || 8;
      const sidebarGap = sidebar ? shellGap : 0;
      const panelGap = panel ? shellGap : 0;
      const nextOccupiedLeft = window.matchMedia("(max-width: 820px)").matches
        ? 0
        : sidebarWidth + sidebarGap + panelWidth + panelGap;
      root.style.setProperty("--shell-sidebar-occupied", `${Math.round(sidebarWidth)}px`);
      root.style.setProperty("--shell-sidebar-gap-occupied", `${Math.round(sidebarGap)}px`);
      root.style.setProperty("--shell-panel-occupied", `${Math.round(panelWidth)}px`);
      root.style.setProperty("--shell-panel-gap-occupied", `${Math.round(panelGap)}px`);
      if (measured && Math.abs(nextOccupiedLeft - occupiedLeft) >= 1) {
        window.dispatchEvent(
          new CustomEvent("math-atlas:shell-insets", {
            detail: { deltaLeft: nextOccupiedLeft - occupiedLeft },
          }),
        );
      }
      occupiedLeft = nextOccupiedLeft;
      measured = true;
    };

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observeOccupiedElements = () => {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(schedule);
      const sidebar = document.querySelector<HTMLElement>("[data-shell-sidebar]");
      const panel = document.querySelector<HTMLElement>("[data-shell-context-panel]");
      if (sidebar) resizeObserver.observe(sidebar);
      if (panel) resizeObserver.observe(panel);
      schedule();
    };

    const containsOccupiedElement = (node: Node) =>
      node instanceof Element &&
      (node.matches("[data-shell-sidebar], [data-shell-context-panel]") ||
        Boolean(node.querySelector("[data-shell-sidebar], [data-shell-context-panel]")));
    const mutationObserver = new MutationObserver((records) => {
      const shellChanged = records.some(
        (record) =>
          [...record.addedNodes].some(containsOccupiedElement) ||
          [...record.removedNodes].some(containsOccupiedElement),
      );
      if (shellChanged) observeOccupiedElements();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    observeOccupiedElements();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--shell-sidebar-occupied");
      root.style.removeProperty("--shell-sidebar-gap-occupied");
      root.style.removeProperty("--shell-panel-occupied");
      root.style.removeProperty("--shell-panel-gap-occupied");
    };
  }, []);

  return null;
}
