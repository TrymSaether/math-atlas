import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { PlusIcon, MinusIcon, CornersOutIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";
import { LayersPanel } from "./LayersPanel";

function CtlButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn("shell-btn shell-btn-icon rounded-r-lg", active && "is-active")}
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

  useEffect(() => {
    if (!layersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setLayersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLayersOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [layersOpen]);

  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-end gap-2.5" ref={ref}>
      {layersOpen && (
        <div className="mb-0.5 self-end">
          <LayersPanel onClose={() => setLayersOpen(false)} />
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <Glass material="regular" className="flex flex-col rounded-[14px] p-1">
          <CtlButton label="Filters" active={layersOpen} onClick={() => setLayersOpen((v) => !v)}>
            <FunnelSimpleIcon className="h-[18px] w-[18px]" weight={layersOpen ? "fill" : "regular"} />
          </CtlButton>
        </Glass>
        <Glass material="regular" className="flex flex-col items-center rounded-[14px] p-1">
          <CtlButton label="Zoom in" onClick={() => rf.zoomIn({ duration: 200 })}>
            <PlusIcon className="h-[18px] w-[18px]" weight="bold" />
          </CtlButton>
          <span className="select-none py-0.5 text-center text-ui-2xs font-semibold tabular-nums text-fg-3">
            {Math.round(zoom * 100)}%
          </span>
          <CtlButton label="Zoom out" onClick={() => rf.zoomOut({ duration: 200 })}>
            <MinusIcon className="h-[18px] w-[18px]" weight="bold" />
          </CtlButton>
          <div className="my-1 h-px w-6 self-center bg-border-muted" />
          <CtlButton label="Fit to view" onClick={() => rf.fitView({ padding: 0.12, duration: 400 })}>
            <CornersOutIcon className="h-[18px] w-[18px]" weight="regular" />
          </CtlButton>
        </Glass>
      </div>
    </div>
  );
}
