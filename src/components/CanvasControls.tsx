import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Crosshair,
  Layers,
  Map,
  Minus,
  Network,
  PanelLeft,
  Plus,
  SlidersHorizontal,
  Waypoints,
} from "lucide-react";
import { useReactFlow } from "reactflow";
import { useStore } from "../store";
import { cn } from "../lib/utils";

/**
 * Floating Apple-Maps-style canvas chrome: one right-side control rail for
 * map modes, navigation tools, overlays, zoom, and visual layers.
 */
export function CanvasControls() {
  const rf = useReactFlow();
  const [layersOpen, setLayersOpen] = useState(false);
  const layersRef = useRef<HTMLDivElement>(null);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);
  const routeMode = useStore((s) => s.routeMode);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const toggleRouteMode = useStore((s) => s.toggleRouteMode);
  const showNodePanel = useStore((s) => s.showNodePanel);
  const toggleNodePanel = useStore((s) => s.toggleNodePanel);
  const showMinimap = useStore((s) => s.showMinimap);
  const toggleMinimap = useStore((s) => s.toggleMinimap);
  const routeActive = routeMode || (routeFrom !== null && routeTo !== null);

  useEffect(() => {
    if (!layersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (layersRef.current && !layersRef.current.contains(e.target as Node)) {
        setLayersOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLayersOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [layersOpen]);

  return (
    <>
      <div className="pointer-events-none absolute bottom-4 left-3 z-30 sm:left-4">
        <FloatButton
          label={showNodePanel ? "Hide concept panel" : "Show concept panel"}
          active={showNodePanel}
          onClick={toggleNodePanel}
        >
          <PanelLeft className="h-[18px] w-[18px]" strokeWidth={2} />
        </FloatButton>
      </div>

      <div className="pointer-events-none absolute right-3 top-[72px] z-30 flex flex-col items-end gap-2.5 sm:right-4">
        <ToolbarStack label="Map modes">
          <FloatButton
            label="Dependency map"
            active={view === "dependency"}
            grouped
            onClick={() => setView("dependency")}
          >
            <Network className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          <FloatButton
            label="Region map"
            active={view === "cluster"}
            grouped
            onClick={() => setView("cluster")}
          >
            <Layers className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
        </ToolbarStack>

        <ToolbarStack label="Navigation tools">
          <FloatButton
            label={routeActive ? "Cancel route" : "Plan route"}
            active={routeActive}
            grouped
            onClick={toggleRouteMode}
          >
            <Waypoints className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          <FloatButton
            label="Focus neighborhood"
            active={focusMode}
            grouped
            onClick={toggleFocusMode}
          >
            <Crosshair className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          {focusMode && <DepthPicker value={focusDepth} onChange={setFocusDepth} />}
        </ToolbarStack>

        <ToolbarStack label="Overlays">
          <FloatButton
            label={showMinimap ? "Hide minimap" : "Show minimap"}
            active={showMinimap}
            grouped
            onClick={toggleMinimap}
          >
            <Map className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
        </ToolbarStack>

        <ToolbarStack label="Zoom">
          <FloatButton
            label="Zoom in"
            grouped
            onClick={() => rf.zoomIn({ duration: 180 })}
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          <FloatButton
            label="Zoom out"
            grouped
            onClick={() => rf.zoomOut({ duration: 180 })}
          >
            <Minus className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
        </ToolbarStack>

        <FloatButton
          label="Fit view"
          onClick={() => rf.fitView({ padding: 0.18, duration: 420 })}
        >
          <Compass />
        </FloatButton>

        <div ref={layersRef} className="pointer-events-auto relative">
          <FloatButton
            label="Map layers"
            active={layersOpen}
            onClick={() => setLayersOpen((o) => !o)}
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
          </FloatButton>
          {layersOpen && <LayersPopover />}
        </div>
      </div>
    </>
  );
}

function ToolbarStack({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="map-chrome-soft pointer-events-auto flex flex-col overflow-hidden rounded-[24px]"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
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

function Divider() {
  return <span className="map-divider mx-2 h-px shrink-0" />;
}

function DepthPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <>
      <div className="flex flex-col items-center gap-1 px-1.5 py-1.5" aria-label="Focus depth">
        {[1, 2, 3].map((depth) => {
          const active = value === depth;
          return (
            <button
              key={depth}
              type="button"
              onClick={() => onChange(depth)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-ui-xs font-semibold tabular-nums transition",
                active && "is-active",
              )}
              style={{
                background: active ? "var(--chrome-active)" : "transparent",
                color: active ? "var(--fg-1)" : "var(--fg-2)",
                boxShadow: active ? "inset 0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent)" : "none",
              }}
              aria-label={`Focus depth ${depth}`}
              aria-pressed={active}
            >
              {depth}
            </button>
          );
        })}
      </div>
    </>
  );
}

const LAYERS: { key: "grid" | "regions" | "soft"; label: string }[] = [
  { key: "grid", label: "Coordinate grid" },
  { key: "regions", label: "Domain regions" },
  { key: "soft", label: "Soft dependencies" },
];

function LayersPopover() {
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showRegions = useStore((s) => s.showRegions);
  const toggleRegions = useStore((s) => s.toggleRegions);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);

  const checked = { grid: showGrid, regions: showRegions, soft: showSoftDeps };
  const toggle = { grid: toggleGrid, regions: toggleRegions, soft: toggleSoftDeps };

  return (
    <div
      className="map-popover pointer-events-auto absolute right-[54px] top-0 w-[270px] rounded-[20px] p-2"
    >
      <div
        className="px-3 pb-1.5 pt-1.5 text-ui-2xs font-semibold uppercase tracking-label"
        style={{ color: "var(--fg-3)" }}
      >
        Map layers
      </div>
      {LAYERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={toggle[key]}
          className="map-text-button flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-ui-control font-medium"
          style={{ color: checked[key] ? "var(--fg-1)" : "var(--fg-2)" }}
          aria-pressed={checked[key]}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
            style={{
              background: checked[key] ? "var(--accent)" : "var(--surface)",
              borderColor: checked[key] ? "var(--accent)" : "var(--border)",
              color: checked[key] ? "var(--fg-on-color)" : "transparent",
            }}
            aria-hidden
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="flex-1">{label}</span>
        </button>
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
