import { useCallback, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { usePopoverDismiss } from "./usePopover";
import { cn } from "@/shared/cn";
import { Button } from "@/ui/button";
import { Surface } from "@/design";
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
  const closeLayers = useCallback(() => setLayersOpen(false), []);

  usePopoverDismiss({ open: layersOpen, onClose: closeLayers, containerRef: ref, triggerRef });

  return (
    <div
      className="pointer-events-auto absolute bottom-[var(--shell-edge)] right-[var(--shell-edge)] z-(--z-shell-raised) flex items-end gap-2.5"
      ref={ref}
    >
      {layersOpen && (
        <div className="mr-0.5 self-end">
          <LayersPanel onClose={() => setLayersOpen(false)} />
        </div>
      )}
      <div className="inline-flex w-12 flex-col items-center gap-2.5">
        <Surface material="regular" className="rounded-full">
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className={cn("size-11 rounded-full", layersOpen ? "text-primary" : "text-foreground")}
            onClick={() => setLayersOpen((v) => !v)}
            aria-label="Filters"
            aria-pressed={layersOpen}
            title="Filters"
          >
            <SlidersHorizontal className="size-[18px]" />
          </Button>
        </Surface>

        <Surface material="regular" className="flex flex-col items-center rounded-full py-1" aria-label="Zoom controls">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-foreground"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => rf.zoomIn({ duration: 200 })}
          >
            <Plus className="size-[18px]" />
          </Button>
          <span
            className="py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground"
            aria-label={`Zoom ${Math.round(zoom * 100)} percent`}
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-foreground"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => rf.zoomOut({ duration: 200 })}
          >
            <Minus className="size-[18px]" />
          </Button>
        </Surface>

        <Surface material="regular" className="rounded-full">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full text-foreground"
            aria-label="Fit to view"
            title="Fit to view"
            onClick={() => rf.fitView({ padding: 0.12, duration: 400 })}
          >
            <Maximize className="size-[18px]" />
          </Button>
        </Surface>
      </div>
    </div>
  );
}
