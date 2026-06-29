import { useCallback, useRef, useState } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { PlusIcon, MinusIcon, CornersOutIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { usePopoverDismiss } from "../../hooks/usePopover";
import { Glass, ShellIconButton } from "../primitives";
import { LayersPanel } from "./LayersPanel";

/**
 * Bottom-trailing utility rail: filters, zoom, and fit-to-view in one vertical
 * Liquid Glass island. The layers popover anchors to the rail's leading edge.
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
    <div className="shell-tools" ref={ref}>
      {layersOpen && (
        <div className="shell-tools-popover">
          <LayersPanel onClose={() => setLayersOpen(false)} />
        </div>
      )}
      <Glass variant="regular" interactive className="shell-utility-rail">
        <ShellIconButton
          ref={triggerRef}
          active={layersOpen}
          onClick={() => setLayersOpen((v) => !v)}
          aria-label="Filters"
          aria-pressed={layersOpen}
          title="Filters"
        >
          <FunnelSimpleIcon className="shell-icon" weight="regular" />
        </ShellIconButton>
        <div className="shell-rail-cluster" aria-label="Zoom controls">
          <ShellIconButton aria-label="Zoom in" title="Zoom in" onClick={() => rf.zoomIn({ duration: 200 })}>
            <PlusIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
          <span className="shell-zoom-readout" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>
            {Math.round(zoom * 100)}%
          </span>
          <ShellIconButton aria-label="Zoom out" title="Zoom out" onClick={() => rf.zoomOut({ duration: 200 })}>
            <MinusIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
        </div>
        <ShellIconButton
          aria-label="Fit to view"
          title="Fit to view"
          onClick={() => rf.fitView({ padding: 0.12, duration: 400 })}
        >
          <CornersOutIcon className="shell-icon" weight="regular" />
        </ShellIconButton>
      </Glass>
    </div>
  );
}
