import { type ReactNode } from "react";
import {
  XIcon,
  ArrowsDownUpIcon,
  PlayIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinIcon,
  FlagIcon,
  TreeStructureIcon,
  PathIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { useRouteResult } from "../../lib/route";
import { MathText } from "../../lib/katex";
import { getDomainTone } from "../../lib/colors";
import { cn } from "../../lib/utils";
import { Material, ShellButton, ShellIconButton, ShellSegmented } from "../primitives";

/** A From / To / Goal endpoint row — leading toned glyph, label + value. */
function Endpoint({
  icon,
  tone,
  label,
  value,
  onClear,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string | null;
  onClear: () => void;
}) {
  return (
    <div className="paths-endpoint">
      <span className="paths-endpoint-glyph" style={{ background: tone }}>
        {icon}
      </span>
      <div className="paths-endpoint-text">
        <div className="paths-endpoint-label">{label}</div>
        <div className={cn("paths-endpoint-value", !value && "is-placeholder")}>
          {value ? <MathText text={value} /> : "Pick on the map"}
        </div>
      </div>
      {value && (
        <ShellIconButton className="paths-endpoint-clear" aria-label={`Clear ${label}`} onClick={onClear}>
          <XIcon className="shell-icon-sm" weight="regular" />
        </ShellIconButton>
      )}
    </div>
  );
}

/**
 * Paths — the guided study mode, presented in the macOS Maps "Directions"
 * idiom: a bold title, an icon mode picker, From/To endpoint rows, route
 * options, then a primary itinerary card over the ordered study list. Reuses
 * the dependency-route engine (`useRouteResult`) and tour state unchanged;
 * endpoints are picked by clicking concepts on the map.
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
  const isPath = routeKind === "path";
  const hasGoal = isPath ? Boolean(routeFrom && routeTo) : Boolean(routeTo);
  const noPath = isPath && Boolean(routeFrom && routeTo) && !route.found;

  return (
    <aside className="shell-dock shell-dock-left pointer-events-auto">
      <Material thickness="thick" className="shell-panel flex h-full w-[min(360px,calc(100vw-24px))] flex-col">
        <header className="paths-head">
          <h2 className="paths-title">Paths</h2>
          <ShellIconButton className="apple-head-btn" onClick={() => setMode("explore")} aria-label="Close paths">
            <XIcon className="shell-icon" weight="regular" />
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
            size="large"
            className="w-full"
            options={[
              { id: "prereq", label: "Prerequisites", icon: <TreeStructureIcon weight="bold" /> },
              { id: "path", label: "Between two", icon: <PathIcon weight="bold" /> },
            ]}
          />

          <div className="paths-endpoints">
            {isPath && (
              <Endpoint
                icon={<MapPinIcon weight="fill" />}
                tone="var(--accent)"
                label="From"
                value={routeFrom ? labelFor(routeFrom) : null}
                onClear={() => setRouteEndpoint("from", null)}
              />
            )}
            <Endpoint
              icon={<FlagIcon weight="fill" />}
              tone="var(--danger)"
              label={isPath ? "To" : "Goal"}
              value={routeTo ? labelFor(routeTo) : null}
              onClear={() => setRouteEndpoint("to", null)}
            />
            {isPath && (
              <ShellIconButton
                className="paths-reorder apple-head-btn"
                onClick={swapRouteEndpoints}
                aria-label="Swap endpoints"
                disabled={!routeFrom && !routeTo}
              >
                <ArrowsDownUpIcon className="shell-icon" />
              </ShellIconButton>
            )}
          </div>

          <div className="paths-options">
            <button
              type="button"
              className={cn("paths-pill", includeProof && "is-on")}
              aria-pressed={includeProof}
              onClick={() => setIncludeProof(!includeProof)}
            >
              {includeProof && <CheckIcon className="shell-icon-sm" weight="bold" />}
              Proof prerequisites
            </button>
          </div>

          {noPath && <p className="paths-hint paths-hint-card">No dependency path connects these two concepts.</p>}

          {!hasGoal && !noPath && (
            <p className="paths-hint">
              {isPath
                ? "Pick two concepts on the map to see every dependency path between them."
                : "Click a concept on the map to trace everything you need to understand it first, in study order."}
            </p>
          )}

          {hasGoal && ordered.length > 0 && (
            <>
              <div className="paths-summary">
                <div className="paths-summary-text">
                  <span className="paths-summary-count">
                    {ordered.length} {ordered.length === 1 ? "concept" : "concepts"}
                  </span>
                  <span className="paths-summary-sub">study order</span>
                </div>
                {!touring ? (
                  <ShellButton primary shape="pill" className="gap-1.5" onClick={startTour}>
                    <PlayIcon className="shell-icon-sm" weight="fill" /> Tour
                  </ShellButton>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <ShellIconButton onClick={() => tourStep(-1)} aria-label="Previous step">
                      <CaretLeftIcon className="shell-icon" weight="regular" />
                    </ShellIconButton>
                    <span className="min-w-[40px] text-center font-mono text-caption-1 tabular-nums text-fg-2">
                      {(tourIndex ?? 0) + 1}/{ordered.length}
                    </span>
                    <ShellIconButton onClick={() => tourStep(1)} aria-label="Next step">
                      <CaretRightIcon className="shell-icon" weight="regular" />
                    </ShellIconButton>
                    <ShellButton shape="pill" onClick={endTour}>
                      Done
                    </ShellButton>
                  </div>
                )}
              </div>

              <ol className="paths-steps">
                {ordered.map((id, i) => {
                  const active = selectedId === id;
                  const tone = getDomainTone(map.nodeById.get(id)?.domain ?? "");
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => select(id)}
                        className={cn("paths-step", active && "is-active")}
                      >
                        <span className="paths-step-index">{i + 1}</span>
                        <span className="paths-step-dot" style={{ background: tone.color }} />
                        <span className="paths-step-label">
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
      </Material>
    </aside>
  );
}
