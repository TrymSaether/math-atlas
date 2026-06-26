import { type ReactNode } from "react";
import {
  XIcon,
  ArrowsDownUpIcon,
  PlayIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinIcon,
  FlagIcon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { useRouteResult } from "../../lib/route";
import { MathText } from "../../lib/katex";
import { getDomainTone } from "../../lib/colors";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";
import { ShellButton, ShellIconButton, ShellSegmented, ShellSwitch } from "./Controls";

function Slot({
  icon,
  label,
  value,
  onClear,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  onClear: () => void;
}) {
  return (
    <div className="glass-row">
      <span className="shrink-0 text-fg-3">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="glass-field-label">{label}</div>
        <div className={cn("truncate text-footnote", value ? "text-fg-1" : "italic text-fg-3")}>
          {value ? <MathText text={value} /> : "Pick on the map"}
        </div>
      </div>
      {value && (
        <ShellIconButton aria-label={`Clear ${label}`} onClick={onClear}>
          <XIcon className="h-3.5 w-3.5" weight="bold" />
        </ShellIconButton>
      )}
    </div>
  );
}

/**
 * Paths — the guided study mode. Reuses the dependency-route engine
 * (`useRouteResult` over the full DAG) and tour state: pick a goal (its
 * prerequisite cone) or two endpoints (the connecting paths), then walk the
 * ordered itinerary step by step. Endpoints are picked by clicking concepts on
 * the map (the canvas is in route-planning mode here).
 */
export function PathsPanel() {
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const setMode = useStore((s) => s.setMode);
  const routeKind = useStore((s) => s.routeKind);
  const setRouteKind = useStore((s) => s.setRouteKind);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const setRouteEndpoint = useStore((s) => s.setRouteEndpoint);
  const swapRouteEndpoints = useStore((s) => s.swapRouteEndpoints);
  const includeProof = useStore((s) => s.routeIncludeProof);
  const setIncludeProof = useStore((s) => s.setRouteIncludeProof);
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const startTour = useStore((s) => s.startTour);
  const tourStep = useStore((s) => s.tourStep);
  const endTour = useStore((s) => s.endTour);
  const tourIndex = useStore((s) => s.tourIndex);
  const route = useRouteResult();

  if (!map) return null;
  const labelFor = (id: string) => map.nodeById.get(id)?.label ?? id;
  const ordered = route.ordered;
  const touring = tourIndex !== null;
  const hasGoal = routeKind === "prereq" ? Boolean(routeTo) : Boolean(routeFrom && routeTo);
  const noPath = routeKind === "path" && Boolean(routeFrom && routeTo) && !route.found;

  return (
    <aside className="shell-dock shell-dock-left pointer-events-auto">
      <Glass material="thick" className="shell-panel flex h-full w-[min(340px,calc(100vw-24px))] flex-col">
        <header className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="shell-panel-title">Paths</span>
          <ShellIconButton onClick={() => setMode("explore")} aria-label="Close paths">
            <XIcon className="h-4 w-4" weight="bold" />
          </ShellIconButton>
        </header>

        {/* Announce tour progress to assistive tech as the step (and selected
            concept) changes — the visual cue is the map pan, which a screen
            reader can't see. */}
        <div className="sr-only" role="status" aria-live="polite">
          {touring ? `Step ${(tourIndex ?? 0) + 1} of ${ordered.length}: ${labelFor(ordered[tourIndex ?? 0])}` : ""}
        </div>

        <div className="panel-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ShellSegmented
            label="Route kind"
            value={routeKind}
            onChange={setRouteKind}
            className="w-full"
            selectionRole="button"
            options={[
              { id: "prereq", label: "Prerequisites" },
              { id: "path", label: "Between two" },
            ]}
          />

          <div className="glass-group mt-3">
            {routeKind === "path" && (
              <Slot
                icon={<MapPinIcon className="h-4 w-4" />}
                label="From"
                value={routeFrom ? labelFor(routeFrom) : null}
                onClear={() => setRouteEndpoint("from", null)}
              />
            )}
            {routeKind === "path" && (
              <div className="flex justify-center">
                <ShellIconButton
                  onClick={swapRouteEndpoints}
                  aria-label="Swap endpoints"
                  disabled={!routeFrom && !routeTo}
                >
                  <ArrowsDownUpIcon className="h-4 w-4" />
                </ShellIconButton>
              </div>
            )}
            <Slot
              icon={<FlagIcon className="h-4 w-4" />}
              label={routeKind === "prereq" ? "Goal" : "To"}
              value={routeTo ? labelFor(routeTo) : null}
              onClear={() => setRouteEndpoint("to", null)}
            />
          </div>

          <ShellSwitch
            label="Include proof prerequisites"
            on={includeProof}
            onToggle={() => setIncludeProof(!includeProof)}
            className="mt-3"
          />

          {noPath && (
            <p className="mt-4 rounded-[var(--shell-control-radius)] bg-surface-2 px-3 py-2.5 text-footnote text-fg-2">
              No dependency path connects these two concepts.
            </p>
          )}

          {!hasGoal && !noPath && (
            <p className="mt-4 text-footnote leading-relaxed text-fg-3">
              {routeKind === "prereq"
                ? "Click a concept on the map to trace everything you need to understand it first, in study order."
                : "Pick two concepts on the map to see every dependency path between them."}
            </p>
          )}

          {hasGoal && ordered.length > 0 && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-caption-1 font-semibold text-fg-2">
                  {ordered.length} {ordered.length === 1 ? "concept" : "concepts"} · study order
                </span>
                {!touring ? (
                  <ShellButton
                    primary
                    className="min-h-[44px] gap-1 rounded-full px-3 text-caption-1"
                    onClick={startTour}
                  >
                    <PlayIcon className="h-3.5 w-3.5" weight="fill" /> Tour
                  </ShellButton>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <ShellIconButton onClick={() => tourStep(-1)} aria-label="Previous step">
                      <CaretLeftIcon className="h-4 w-4" weight="bold" />
                    </ShellIconButton>
                    <span className="min-w-[44px] text-center font-mono text-caption-1 tabular-nums text-fg-2">
                      {(tourIndex ?? 0) + 1}/{ordered.length}
                    </span>
                    <ShellIconButton onClick={() => tourStep(1)} aria-label="Next step">
                      <CaretRightIcon className="h-4 w-4" weight="bold" />
                    </ShellIconButton>
                    <ShellButton className="min-h-[44px] rounded-full px-3 text-caption-1" onClick={endTour}>
                      Done
                    </ShellButton>
                  </div>
                )}
              </div>

              <ol className="mt-2 space-y-0.5">
                {ordered.map((id, i) => {
                  const active = selectedId === id;
                  const tone = getDomainTone(map.nodeById.get(id)?.domain ?? "");
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => select(id)}
                        className={cn(
                          "flex min-h-[44px] w-full items-center gap-2.5 rounded-[var(--shell-control-radius)] px-2 py-1.5 text-left",
                          active ? "bg-surface-active text-fg-1" : "hover:bg-surface-hover",
                        )}
                      >
                        <span className="w-5 shrink-0 text-right font-mono text-caption-2 tabular-nums text-fg-3">
                          {i + 1}
                        </span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.color }} />
                        <span className={cn("min-w-0 flex-1 truncate text-footnote", active ? "text-fg-1" : "text-fg-2")}>
                          <MathText text={labelFor(id)} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </Glass>
    </aside>
  );
}
