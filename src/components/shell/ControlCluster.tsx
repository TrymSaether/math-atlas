import { useCallback, useRef, useState, type ReactNode, type RefObject } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { PlusIcon, MinusIcon, CornersOutIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { usePopoverDismiss } from "../../hooks/usePopover";
import { Glass } from "./Glass";
import { LayersPanel } from "./LayersPanel";

function CtlButton({
  label,
  onClick,
  active,
  btnRef,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  btnRef?: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      className={cn("shell-tool-button", active && "is-active")}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </button>
  );
}

/**
 * Bottom-trailing control cluster, Apple-Maps style: zoom, fit-to-view, and the
 * Map-layers toggle in one vertical Liquid Glass stack. The layers popover
 * anchors to its leading edge.
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
      <div className="shell-tools-stack">
        <Glass material="regular" className="shell-tool-bubble">
          <CtlButton label="Filters" active={layersOpen} onClick={() => setLayersOpen((v) => !v)} btnRef={triggerRef}>
            <FunnelSimpleIcon className="h-[18px] w-[18px]" weight={layersOpen ? "fill" : "regular"} />
          </CtlButton>
        </Glass>
        <Glass material="regular" className="shell-zoom-rail">
          <CtlButton label="Zoom in" onClick={() => rf.zoomIn({ duration: 200 })}>
            <PlusIcon className="h-[18px] w-[18px]" weight="bold" />
          </CtlButton>
          <span className="shell-zoom-readout" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>
            {Math.round(zoom * 100)}%
          </span>
          <CtlButton label="Zoom out" onClick={() => rf.zoomOut({ duration: 200 })}>
            <MinusIcon className="h-[18px] w-[18px]" weight="bold" />
          </CtlButton>
          <div className="shell-tool-divider" />
          <CtlButton label="Fit to view" onClick={() => rf.fitView({ padding: 0.12, duration: 400 })}>
            <CornersOutIcon className="h-[18px] w-[18px]" weight="regular" />
          </CtlButton>
        </Glass>
      </div>
    </div>
  );
}
