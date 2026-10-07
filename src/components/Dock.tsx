import { useReactFlow, useViewport } from "reactflow";
import {
  CircleDot,
  Crosshair,
  GitBranch,
  Layers,
  LocateFixed,
  Map,
  Minus,
  Plus,
  Route,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, type LayoutMode } from "../store";

const MODES: Array<{ id: LayoutMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: Map },
  { id: "dependency", label: "Dependency", icon: GitBranch },
  { id: "cluster", label: "Cluster", icon: Layers },
];

function shellStyle(active = false): React.CSSProperties {
  return {
    background: active ? "var(--surface-3)" : "transparent",
    color: active ? "var(--fg-1)" : "var(--fg-2)",
  };
}

export function Dock() {
  const layoutMode = useStore((s) => s.layoutMode);
  const setLayoutMode = useStore((s) => s.setLayoutMode);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);
  const selectedId = useStore((s) => s.selectedId);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const setRouteFrom = useStore((s) => s.setRouteFrom);
  const setRouteTo = useStore((s) => s.setRouteTo);
  const planRoute = useStore((s) => s.planRoute);
  const resetRoute = useStore((s) => s.resetRoute);
  const routeReady = Boolean(routeFrom && routeTo);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center">
      <div
        className="pointer-events-auto flex max-w-[calc(100vw-24px)] flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div className="flex gap-0.5 rounded-xl p-0.5" style={{ background: "var(--surface-2)" }}>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const active = layoutMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setLayoutMode(mode.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium transition"
                style={shellStyle(active)}
                aria-pressed={active}
                aria-label={`${mode.label} layout`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <Divider />

        <button
          type="button"
          onClick={toggleFocusMode}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium transition"
          style={shellStyle(focusMode)}
          aria-pressed={focusMode}
          aria-label="Toggle focus mode"
          title="Dim concepts outside the selected neighborhood"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Focus</span>
        </button>
        <div className={cn("flex items-center gap-0.5", !focusMode && "pointer-events-none opacity-40")}>
          {[1, 2, 3].map((depth) => (
            <button
              key={depth}
              type="button"
              onClick={() => setFocusDepth(depth)}
              className="h-7 w-7 rounded-[9px] text-[11px] font-semibold tabular-nums transition"
              style={shellStyle(focusDepth === depth)}
              aria-pressed={focusDepth === depth}
            >
              {depth}
            </button>
          ))}
        </div>

        <Divider />

        <button
          type="button"
          onClick={() => selectedId && setRouteFrom(selectedId)}
          disabled={!selectedId}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium transition disabled:opacity-35"
          style={shellStyle(Boolean(routeFrom))}
          aria-label="Use selected concept as route start"
          title="Use selected concept as route start"
        >
          <CircleDot className="h-3.5 w-3.5" />
          <span className="hidden md:inline">From</span>
        </button>
        <button
          type="button"
          onClick={() => selectedId && setRouteTo(selectedId)}
          disabled={!selectedId}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium transition disabled:opacity-35"
          style={shellStyle(Boolean(routeTo))}
          aria-label="Use selected concept as route end"
          title="Use selected concept as route end"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          <span className="hidden md:inline">To</span>
        </button>
        <button
          type="button"
          onClick={planRoute}
          disabled={!routeReady}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium transition disabled:opacity-35"
          style={{
            background: routeReady ? "var(--accent)" : "transparent",
            color: routeReady ? "var(--fg-on-color)" : "var(--fg-2)",
          }}
          aria-label="Plan route between From and To"
          title="Plan route between From and To"
        >
          <Route className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Plan</span>
        </button>
        <button
          type="button"
          onClick={resetRoute}
          disabled={!routeFrom && !routeTo}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] transition disabled:opacity-35"
          style={shellStyle(false)}
          aria-label="Clear route"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={() => zoomOut()}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] transition"
          style={shellStyle(false)}
          aria-label="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.18, duration: 350 })}
          className="hidden h-8 min-w-12 rounded-[10px] px-2 text-[12px] tabular-nums transition sm:block"
          style={shellStyle(false)}
          aria-label="Fit graph"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomIn()}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] transition"
          style={shellStyle(false)}
          aria-label="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-0.5 hidden h-6 w-px sm:block" style={{ background: "var(--border)" }} />;
}
