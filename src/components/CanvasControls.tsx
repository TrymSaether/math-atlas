import { useEffect, useRef, useState, type ReactNode } from "react";
import { Layers, Minus, Plus } from "lucide-react";
import { useReactFlow } from "reactflow";
import { useStore } from "../store";
import { cn } from "../lib/utils";

/**
 * Floating Apple-Maps-style canvas chrome: a top-right column of glass button
 * stacks for zoom, fit, and layers. Replaces the Dock's zoom cluster; the Dock
 * keeps the app-specific view/focus controls.
 */
export function CanvasControls() {
  const rf = useReactFlow();
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <>
      {/* Top-right control column. Keep it below the global top bar. */}
      <div className="pointer-events-none absolute right-3 top-[72px] z-30 flex flex-col items-end gap-2.5 sm:right-4">
        <FloatButton
          label="Fit view"
          onClick={() => rf.fitView({ padding: 0.18, duration: 420 })}
        >
          <Compass />
        </FloatButton>
        <div className="map-chrome-soft pointer-events-auto flex flex-col overflow-hidden rounded-[24px]">
          <FloatButton
            label="Zoom in"
            grouped
            onClick={() => rf.zoomIn({ duration: 180 })}
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          <span className="map-divider mx-2 h-px" />
          <FloatButton
            label="Zoom out"
            grouped
            onClick={() => rf.zoomOut({ duration: 180 })}
          >
            <Minus className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
        </div>

        <div className="pointer-events-auto relative">
          <FloatButton
            label="Map layers"
            active={layersOpen}
            onClick={() => setLayersOpen((o) => !o)}
          >
            <Layers className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          {layersOpen && <LayersPopover onClose={() => setLayersOpen(false)} />}
        </div>
      </div>
    </>
  );
}

function FloatButton({
  label,
  onClick,
  active,
  grouped,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  grouped?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pointer-events-auto map-icon-button map-control-button",
        grouped ? "rounded-none" : "map-chrome-soft rounded-full",
        active && "is-active",
      )}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </button>
  );
}

const LAYERS: { key: "grid" | "regions" | "soft"; label: string }[] = [
  { key: "grid", label: "Coordinate grid" },
  { key: "regions", label: "Domain regions" },
  { key: "soft", label: "Soft dependencies" },
];

function LayersPopover({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showRegions = useStore((s) => s.showRegions);
  const toggleRegions = useStore((s) => s.toggleRegions);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);

  const checked = { grid: showGrid, regions: showRegions, soft: showSoftDeps };
  const toggle = { grid: toggleGrid, regions: toggleRegions, soft: toggleSoftDeps };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="map-popover pointer-events-auto absolute right-0 top-[54px] w-64 rounded-[20px] p-2"
    >
      <div
        className="px-3 pb-1.5 pt-1.5 text-ui-2xs font-semibold uppercase tracking-label"
        style={{ color: "var(--fg-3)" }}
      >
        Map layers
      </div>
      {LAYERS.map(({ key, label }) => (
        <label
          key={key}
          className="map-text-button flex cursor-pointer items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-ui-control font-medium"
          style={{ color: "var(--fg-1)" }}
        >
          <input
            type="checkbox"
            checked={checked[key]}
            onChange={toggle[key]}
            className="h-3.5 w-3.5"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="flex-1">{label}</span>
        </label>
      ))}
    </div>
  );
}

/** Compass rose with a red north needle (themes via currentColor). */
function Compass() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.45" opacity="0.86" />
      <path d="M12 4 L14 12 L12 11 L10 12 Z" fill="var(--red)" stroke="none" />
      <path
        d="M12 20 L10 12 L12 13 L14 12 Z"
        fill="currentColor"
        stroke="none"
        opacity="0.6"
      />
    </svg>
  );
}
