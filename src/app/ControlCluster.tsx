import { useCallback, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePopoverDismiss } from "./usePopover";
import { FloatingControlButton, FloatingControlDivider, FloatingControlDock } from "@/ui/floating-controls";
import { spring } from "@/design/motion";
import { LayersPanel } from "./LayersPanel";

/**
 * Bottom-trailing utility stack. Each unrelated action gets its own glass shape;
 * only the tightly related zoom controls share a capsule.
 */
export function ControlCluster() {
  const rf = useReactFlow();
  const { zoom } = useViewport();
  const [layersOpen, setLayersOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const closeLayers = useCallback(() => setLayersOpen(false), []);

  usePopoverDismiss({ open: layersOpen, onClose: closeLayers, containerRef: ref, triggerRef });

  return (
    <div
      className="pointer-events-none absolute bottom-[var(--shell-edge)] right-[var(--shell-edge)] z-(--z-shell-raised) flex items-end gap-[var(--shell-gap-md)]"
      ref={ref}
    >
      <AnimatePresence initial={false}>
        {layersOpen && (
          <motion.div
            className="pointer-events-auto mb-0.5 origin-bottom-right self-end"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6, y: 6, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0.12 } : spring.smooth}
          >
            <LayersPanel onClose={closeLayers} />
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingControlDock className="pointer-events-auto" aria-label="Canvas controls">
        <FloatingControlButton
          ref={triggerRef}
          active={layersOpen}
          onClick={() => setLayersOpen((v) => !v)}
          aria-label="Filters and display"
          aria-pressed={layersOpen}
          aria-expanded={layersOpen}
          title="Filters and display"
        >
          <SlidersHorizontal className="size-[18px]" />
        </FloatingControlButton>

        <FloatingControlDivider />

        <FloatingControlButton aria-label="Zoom in" title="Zoom in" onClick={() => rf.zoomIn({ duration: 180 })}>
          <Plus className="size-[18px]" />
        </FloatingControlButton>
        <button
          type="button"
          className="min-h-6 w-10 rounded-full px-0.5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55"
          aria-label={`Reset zoom from ${Math.round(zoom * 100)} percent to 100 percent`}
          title="Reset zoom to 100%"
          onClick={() => rf.zoomTo(1, { duration: 260 })}
        >
          {Math.round(zoom * 100)}%
        </button>
        <FloatingControlButton aria-label="Zoom out" title="Zoom out" onClick={() => rf.zoomOut({ duration: 180 })}>
          <Minus className="size-[18px]" />
        </FloatingControlButton>

        <FloatingControlDivider />

        <FloatingControlButton
          aria-label="Fit map to view"
          title="Fit map to view"
          onClick={() => rf.fitView({ padding: 0.12, duration: 360 })}
        >
          <Maximize className="size-[18px]" />
        </FloatingControlButton>
      </FloatingControlDock>
    </div>
  );
}
