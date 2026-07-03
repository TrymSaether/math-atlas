import { type ReactNode } from "react";
import { ArrowUpDown, Check, ChevronLeft, ChevronRight, Flag, MapPin, Network, Play, Route, X } from "lucide-react";
import { useStore } from "@/app/store";
import { useRouteResult } from "./route";
import { MathText } from "@/math/MathText";
import { getDomainTone } from "./colors";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { Panel } from "@/design";

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
    <div className="flex min-h-[54px] w-full items-center gap-3 px-3 py-2 [&+&]:border-t [&+&]:border-border">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white [&>svg]:size-[15px]"
        style={{ background: tone, boxShadow: "inset 0 0.5px 0 rgb(255 255 255 / 0.28)" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-caption font-medium text-muted-foreground">{label}</div>
        <div className={cn("truncate text-footnote", value ? "text-foreground" : "text-muted-foreground italic")}>
          {value ? <MathText text={value} /> : "Pick on the map"}
        </div>
      </div>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          aria-label={`Clear ${label}`}
          onClick={onClear}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Paths — the guided study mode, in the macOS Maps "Directions" idiom: a bold
 * title, a mode picker, From/To endpoint rows, options, then an itinerary card
 * over the ordered study list. Reuses the dependency-route engine and tour state
 * unchanged; endpoints are picked by clicking concepts on the map.
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
    <Panel material="thick" role="region" aria-label="Paths" className="flex w-[min(360px,calc(100vw-24px))] flex-col">
      <header className="flex items-center justify-between gap-3 pt-3.5 pr-3.5 pb-2.5 pl-[1.125rem]">
        <h2 className="text-title-3 font-semibold text-foreground">Paths</h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => setMode("explore")}
          aria-label="Close paths"
        >
          <X className="size-4" />
        </Button>
      </header>

      {/* Announce tour progress to assistive tech — the visual cue is the map pan. */}
      <div className="sr-only" role="status" aria-live="polite">
        {touring ? `Step ${(tourIndex ?? 0) + 1} of ${ordered.length}: ${labelFor(ordered[tourIndex ?? 0])}` : ""}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-1 pb-4">
        <div className="space-y-1.5">
          <span className="text-caption text-muted-foreground">Route kind</span>
          <ToggleGroup
            type="single"
            value={routeKind}
            onValueChange={(v) => v && setRouteKind(v as typeof routeKind)}
            className="w-full gap-0.5 rounded-lg bg-muted p-0.5"
          >
            <ToggleGroupItem
              value="prereq"
              className="h-9 flex-1 gap-1.5 rounded-md text-footnote data-[state=on]:bg-card data-[state=on]:shadow-sm"
            >
              <Network className="size-4" /> Prerequisites
            </ToggleGroupItem>
            <ToggleGroupItem
              value="path"
              className="h-9 flex-1 gap-1.5 rounded-md text-footnote data-[state=on]:bg-card data-[state=on]:shadow-sm"
            >
              <Route className="size-4" /> Between two
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-muted">
          {isPath && (
            <Endpoint
              icon={<MapPin fill="currentColor" />}
              tone="var(--primary)"
              label="From"
              value={routeFrom ? labelFor(routeFrom) : null}
              onClear={() => setRouteEndpoint("from", null)}
            />
          )}
          <Endpoint
            icon={<Flag fill="currentColor" />}
            tone="var(--destructive)"
            label={isPath ? "To" : "Goal"}
            value={routeTo ? labelFor(routeTo) : null}
            onClear={() => setRouteEndpoint("to", null)}
          />
          {isPath && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 size-8 -translate-y-1/2 bg-card shadow-sm"
              onClick={swapRouteEndpoints}
              aria-label="Swap endpoints"
              disabled={!routeFrom && !routeTo}
            >
              <ArrowUpDown className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={includeProof}
            onClick={() => setIncludeProof(!includeProof)}
            className={cn(
              "inline-flex min-h-[30px] items-center gap-1.5 rounded-full px-3 text-caption font-medium transition-colors",
              includeProof ? "bg-primary/10 text-primary" : "bg-muted text-foreground hover:bg-accent",
            )}
          >
            {includeProof && <Check className="size-3.5" />}
            Proof prerequisites
          </button>
        </div>

        {noPath && (
          <p className="rounded-md bg-muted px-3 py-2.5 text-footnote text-foreground">
            No dependency path connects these two concepts.
          </p>
        )}

        {!hasGoal && !noPath && (
          <p className="text-footnote leading-relaxed text-muted-foreground">
            {isPath
              ? "Pick two concepts on the map to see every dependency path between them."
              : "Click a concept on the map to trace everything you need to understand it first, in study order."}
          </p>
        )}

        {hasGoal && ordered.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 py-2.5 pr-2.5 pl-3.5">
              <div className="flex min-w-0 flex-col">
                <span className="text-headline font-semibold text-foreground">
                  {ordered.length} {ordered.length === 1 ? "concept" : "concepts"}
                </span>
                <span className="text-caption font-medium text-primary">study order</span>
              </div>
              {!touring ? (
                <Button size="sm" className="gap-1.5 rounded-full" onClick={startTour}>
                  <Play className="size-3.5 fill-current" /> Tour
                </Button>
              ) : (
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => tourStep(-1)}
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[40px] text-center font-mono text-caption tabular-nums text-foreground">
                    {(tourIndex ?? 0) + 1}/{ordered.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => tourStep(1)}
                    aria-label="Next step"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button variant="secondary" size="sm" className="rounded-full" onClick={endTour}>
                    Done
                  </Button>
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
                        "flex min-h-[40px] w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-accent",
                      )}
                    >
                      <span className="w-[18px] shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="size-2 shrink-0 rounded-full" style={{ background: tone.color }} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-footnote",
                          active ? "font-medium text-foreground" : "text-foreground/80",
                        )}
                      >
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
    </Panel>
  );
}
