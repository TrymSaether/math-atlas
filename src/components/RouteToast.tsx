import { ArrowRight, ArrowCounterClockwise as RotateCcw, X } from "@phosphor-icons/react";
import { useStore } from "../store";
import { Button } from "./chrome/Button";

/**
 * Floating status card for the route planner. Shows planning hints while picking
 * endpoints, then the traced From → To summary with Replay / Clear once a route
 * is drawn.
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
  const editMode = useStore((s) => s.editMode);

  const planning = routeMode;
  const hasRoute = !routeMode && routeFrom && routeTo;
  if (!planning && !hasRoute) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3 ${editMode ? "bottom-[68px]" : "bottom-4"}`}
    >
      <div
        className="map-chrome-soft pointer-events-auto flex h-11 max-w-full items-center gap-2 rounded-[var(--radius-xl)] p-1 pl-3"
      >
        {planning ? (
          <span className="flex min-w-0 items-center gap-1.5 text-ui-control" style={{ color: "var(--fg-1)" }}>
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
          <span className="flex min-w-0 items-center gap-1.5 text-ui-control" style={{ color: "var(--fg-1)" }}>
            <Eyebrow>Route</Eyebrow>
            <span className="max-w-[140px] truncate font-semibold">{fromTitle}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
            <span className="max-w-[140px] truncate font-semibold">{toTitle}</span>
            <span className="shrink-0 tabular-nums" style={{ color: "var(--fg-3)" }}>
              · {count} concept{count === 1 ? "" : "s"}
            </span>
          </span>
        ) : (
          <span className="min-w-0 text-ui-control" style={{ color: "var(--fg-1)" }}>
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
      className="shrink-0 font-mono text-ui-caption font-semibold uppercase tracking-label-tight"
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
    <Button
      kind="icon"
      onClick={onClick}
      className="h-9 w-9 rounded-[var(--radius-md)]"
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
