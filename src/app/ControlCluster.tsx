import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Focus, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePopoverDismiss } from "./usePopover";
import { FloatingControlButton, FloatingControlDivider, FloatingControlDock } from "@/ui/floating-controls";
import { spring } from "@/design/motion";
import { LayersPanel } from "./LayersPanel";
import { useMediaQuery } from "./useMediaQuery";

export function ControlCluster() {
  const flow = useReactFlow();
  const { zoom } = useViewport();
  const [layersOpen, setLayersOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 820px)");
  const closeLayers = useCallback(() => {
    setLayersOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  const duration = (milliseconds: number) => (reduceMotion ? 0 : milliseconds);

  usePopoverDismiss({ open: layersOpen, onClose: closeLayers, containerRef: ref, triggerRef });

  useEffect(() => {
    if (!layersOpen) return;
    const frame = requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>("#atlas-filters button")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [layersOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle("atlas-filters-open", layersOpen);
    return () => document.documentElement.classList.remove("atlas-filters-open");
  }, [layersOpen]);

  return (
    <div
      className={`pointer-events-none absolute right-[var(--shell-edge)] bottom-[var(--shell-content-bottom)] flex items-end gap-[var(--shell-panel-gap)] max-[820px]:bottom-[var(--shell-content-bottom)] ${
        layersOpen ? "z-(--z-popover)" : "z-(--z-shell-raised)"
      }`}
      ref={ref}
    >
      <AnimatePresence initial={false}>
        {layersOpen && (
          <motion.div
            className="pointer-events-auto z-(--z-popover) mb-0.5 origin-bottom-right self-end max-[820px]:fixed max-[820px]:right-[var(--shell-edge)] max-[820px]:bottom-[var(--shell-content-bottom)] max-[820px]:left-[var(--shell-edge)]"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6, y: 6, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0.1 } : spring.smooth}
          >
            <LayersPanel onClose={closeLayers} />
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingControlDock
        data-canvas-dock=""
        className="pointer-events-auto"
        aria-label="Canvas controls"
        aria-hidden={mobile && layersOpen ? true : undefined}
      >
        <FloatingControlButton
          ref={triggerRef}
          active={layersOpen}
          onClick={() => setLayersOpen((value) => !value)}
          aria-label="Filters and display"
          aria-pressed={layersOpen}
          aria-expanded={layersOpen}
          aria-haspopup="dialog"
          aria-controls="atlas-filters"
          title="Filters and display"
        >
          <SlidersHorizontal className="size-[18px]" />
        </FloatingControlButton>

        <FloatingControlDivider />

        <FloatingControlButton
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => flow.zoomIn({ duration: duration(180) })}
        >
          <Plus className="size-[18px]" />
        </FloatingControlButton>
        <button
          type="button"
          className="min-h-6 w-10 rounded-full px-0.5 font-mono text-caption-2 font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55"
          aria-label={`Reset zoom from ${Math.round(zoom * 100)} percent to 100 percent`}
          title="Reset zoom to 100%"
          onClick={() => flow.zoomTo(1, { duration: duration(260) })}
        >
          {Math.round(zoom * 100)}%
        </button>
        <FloatingControlButton
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => flow.zoomOut({ duration: duration(180) })}
        >
          <Minus className="size-[18px]" />
        </FloatingControlButton>

        <FloatingControlDivider />

        <FloatingControlButton
          aria-label="Fit map to visible area"
          title="Fit map to visible area"
          onClick={() =>
            flow.fitView({
              padding: mobile ? 0.18 : 0.12,
              duration: duration(360),
            })
          }
        >
          <Focus className="size-[18px]" />
        </FloatingControlButton>
      </FloatingControlDock>
    </div>
  );
}
