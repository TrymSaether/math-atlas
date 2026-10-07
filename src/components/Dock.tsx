import { Crosshair, Layers, Network, Waypoints } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, type ViewMode } from "../store";

const VIEWS: { id: ViewMode; label: string; icon: typeof Network }[] = [
  { id: "dependency", label: "Dependency", icon: Network },
  { id: "cluster", label: "Cluster", icon: Layers },
];

export function Dock() {
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
  const routeActive = routeMode || (routeFrom !== null && routeTo !== null);

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-4 z-30 flex justify-center px-0 sm:px-3">
      <div
        className="map-chrome dock-scrollbar pointer-events-auto flex h-12 max-w-full items-center gap-1 overflow-x-auto rounded-[26px] p-1.5"
      >
        <div className="flex shrink-0 items-center gap-1">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "map-text-button inline-flex h-9 items-center gap-2 rounded-[18px] px-3.5 text-ui-control font-semibold",
                  active && "is-active",
                )}
                style={{ color: active ? "var(--fg-1)" : "var(--fg-2)" }}
                aria-label={`${label} view`}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <Divider />

        <button
          onClick={toggleFocusMode}
          className={cn(
            "map-text-button inline-flex h-9 shrink-0 items-center gap-2 rounded-[18px] px-3.5 text-ui-control font-semibold",
            focusMode && "is-active",
          )}
          style={{ color: focusMode ? "var(--fg-1)" : "var(--fg-2)" }}
          aria-pressed={focusMode}
          title="Focus on the selected neighborhood"
        >
          <Crosshair className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">Focus</span>
        </button>

        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 rounded-[17px] px-1 transition-opacity",
            !focusMode && "pointer-events-none opacity-40",
          )}
        >
          {[1, 2, 3].map((depth) => {
            const active = focusDepth === depth;
            const activeEnabled = focusMode && active;
            return (
              <button
                key={depth}
                onClick={() => setFocusDepth(depth)}
                className={cn(
                  "map-text-button h-8 w-8 rounded-full text-ui-xs font-semibold tabular-nums",
                  activeEnabled && "is-active",
                )}
                style={{ color: activeEnabled ? "var(--fg-1)" : "var(--fg-2)" }}
                aria-label={`Focus depth ${depth}`}
                aria-pressed={active}
              >
                {depth}
              </button>
            );
          })}
        </div>

        <Divider />

        <button
          onClick={toggleRouteMode}
          className={cn(
            "map-text-button inline-flex h-9 shrink-0 items-center gap-2 rounded-[18px] px-3.5 text-ui-control font-semibold",
            routeActive && "is-active",
          )}
          style={{ color: routeActive ? "var(--fg-1)" : "var(--fg-2)" }}
          aria-pressed={routeMode}
          title="Plan a route between two concepts"
        >
          <Waypoints className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">Route</span>
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="map-divider h-7 w-px shrink-0" />;
}
