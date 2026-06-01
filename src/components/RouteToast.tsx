import { ArrowRight, RotateCcw, X } from "lucide-react";
import { useStore } from "../store";

/**
 * Floating status card for the route planner. Shows planning hints while picking
 * endpoints, then the traced From → To summary with Replay / Clear once a route
 * is drawn. Sits above the Dock.
 */
export function RouteToast({
  fromTitle,
  toTitle,
  count,
  found,
}: {
  fromTitle?: string;
  toTitle?: string;
  count: number;
  found: boolean | null;
}) {
  const routeMode = useStore((s) => s.routeMode);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const toggleRouteMode = useStore((s) => s.toggleRouteMode);
  const replayRoute = useStore((s) => s.replayRoute);
  const clearRoute = useStore((s) => s.clearRoute);

  const planning = routeMode;
  const hasRoute = !routeMode && routeFrom && routeTo;
  if (!planning && !hasRoute) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex justify-center px-3">
      <div
        className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-pill border py-1.5 pl-4 pr-1.5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {planning ? (
          <span className="text-ui-control" style={{ color: "var(--fg-1)" }}>
            {!routeFrom ? (
              <>
                <Eyebrow>Plan route</Eyebrow> pick a start concept
              </>
            ) : (
              <>
                <Eyebrow>From</Eyebrow>
                <strong className="font-semibold">{fromTitle}</strong>
                <span style={{ color: "var(--fg-3)" }}> · pick a destination</span>
              </>
            )}
          </span>
        ) : found ? (
          <span className="flex items-center gap-1.5 text-ui-control" style={{ color: "var(--fg-1)" }}>
            <Eyebrow>Route</Eyebrow>
            <span className="max-w-[140px] truncate font-semibold">{fromTitle}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
            <span className="max-w-[140px] truncate font-semibold">{toTitle}</span>
            <span className="shrink-0 tabular-nums" style={{ color: "var(--fg-3)" }}>
              · {count} concept{count === 1 ? "" : "s"}
            </span>
          </span>
        ) : (
          <span className="text-ui-control" style={{ color: "var(--fg-1)" }}>
            <Eyebrow>Route</Eyebrow> no path between{" "}
            <strong className="font-semibold">{fromTitle}</strong> and{" "}
            <strong className="font-semibold">{toTitle}</strong>
          </span>
        )}

        <div className="flex items-center gap-0.5">
          {hasRoute && found && (
            <ToastButton label="Replay" onClick={replayRoute}>
              <RotateCcw className="h-3.5 w-3.5" />
            </ToastButton>
          )}
          <ToastButton
            label={planning ? "Cancel" : "Clear route"}
            onClick={planning ? toggleRouteMode : clearRoute}
          >
            <X className="h-3.5 w-3.5" />
          </ToastButton>
        </div>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mr-1.5 text-ui-2xs font-semibold uppercase tracking-label"
      style={{ color: "var(--fg-3)" }}
    >
      {children}
    </span>
  );
}

function ToastButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-pill transition-colors hover:bg-[var(--surface-3)]"
      style={{ color: "var(--fg-2)" }}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
