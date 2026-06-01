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
      <div className="pointer-events-none absolute right-3 top-16 z-30 flex flex-col items-end gap-2">
        <Stack>
          <FloatButton
            label="Fit view"
            onClick={() => rf.fitView({ padding: 0.18, duration: 420 })}
          >
            <Compass />
          </FloatButton>
        </Stack>
        <Stack>
          <FloatButton
            label="Zoom in"
            onClick={() => rf.zoomIn({ duration: 180 })}
          >
            <Plus className="h-[17px] w-[17px]" strokeWidth={1.8} />
          </FloatButton>
          <span className="h-px w-full" style={{ background: "var(--border)" }} />
          <FloatButton
            label="Zoom out"
            onClick={() => rf.zoomOut({ duration: 180 })}
          >
            <Minus className="h-[17px] w-[17px]" strokeWidth={1.8} />
          </FloatButton>
        </Stack>

        <div className="relative">
          <Stack>
            <FloatButton
              label="Map layers"
              active={layersOpen}
              onClick={() => setLayersOpen((o) => !o)}
            >
              <Layers className="h-[17px] w-[17px]" strokeWidth={1.8} />
            </FloatButton>
          </Stack>
          {layersOpen && <LayersPopover onClose={() => setLayersOpen(false)} />}
        </div>
      </div>
    </>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return (
    <div
      className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        backdropFilter: "saturate(140%) blur(12px)",
        WebkitBackdropFilter: "saturate(140%) blur(12px)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      {children}
    </div>
  );
}

function FloatButton({
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
      onClick={onClick}
      className={cn(
        "flex h-[38px] w-[38px] items-center justify-center transition-colors",
        !active && "hover:bg-[var(--surface-3)]",
      )}
      style={{
        background: active ? "var(--surface-3)" : "transparent",
        color: active ? "var(--fg-1)" : "var(--fg-2)",
      }}
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
      className="pointer-events-auto absolute right-0 top-12 w-60 rounded-2xl border p-1.5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-3)",
      }}
    >
      <div
        className="px-3 pb-1.5 pt-1 text-ui-2xs font-semibold uppercase tracking-label"
        style={{ color: "var(--fg-3)" }}
      >
        Map layers
      </div>
      {LAYERS.map(({ key, label }) => (
        <label
          key={key}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-ui-control transition-colors hover:bg-[var(--surface-2)]"
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4" />
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
