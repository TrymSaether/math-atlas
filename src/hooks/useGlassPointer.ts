import { useEffect, useRef } from "react";

/**
 * Tracks the pointer across a Liquid Glass surface and writes its position to
 * the element's `--glass-x` / `--glass-y` custom properties, which chrome.css
 * uses to place the specular highlight (the `::after` spotlight).
 *
 * Updates are coalesced into a single rAF tick to avoid layout thrash on
 * pointermove. On leave, the highlight eases back to its top-left rest
 * position. No-ops when the user prefers reduced motion.
 *
 * Returns a ref to attach to the glass element.
 */
export function useGlassPointer<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let nextX = "30%";
    let nextY = "0%";

    const flush = () => {
      frame = 0;
      el.style.setProperty("--glass-x", nextX);
      el.style.setProperty("--glass-y", nextY);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      nextX = `${((e.clientX - rect.left) / rect.width) * 100}%`;
      nextY = `${((e.clientY - rect.top) / rect.height) * 100}%`;
      schedule();
    };

    const onLeave = () => {
      nextX = "30%";
      nextY = "0%";
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
