import { useEffect, useRef } from "react";

/**
 * Tracks pointer position across a Liquid Glass surface and exposes it to CSS
 * as `--glass-x` / `--glass-y` for the specular hover highlight.
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

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      nextX = `${((event.clientX - rect.left) / rect.width) * 100}%`;
      nextY = `${((event.clientY - rect.top) / rect.height) * 100}%`;
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
