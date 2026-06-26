import { useEffect, type RefObject } from "react";

/**
 * The standard popover dismissal + focus contract for a trigger/panel pair that
 * lives inside a single `containerRef`:
 *  - a pointer press outside the container closes it;
 *  - Escape closes it and returns focus to the trigger.
 *
 * Returning focus to the trigger is the part hand-rolled popovers usually miss
 * (WCAG 2.4.3 Focus Order; the HIG popover pattern) — without it a keyboard user
 * who dismisses the panel is dropped at the top of the document. Pass a stable
 * `onClose` (e.g. `useCallback`) so the listeners only re-bind when `open` flips.
 */
export function usePopoverDismiss({
  open,
  onClose,
  containerRef,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
}): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
      triggerRef?.current?.focus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, containerRef, triggerRef]);
}
