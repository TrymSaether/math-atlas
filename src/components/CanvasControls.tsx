import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  CrosshairIcon,
  StackIcon,
  MapTrifoldIcon,
  CornersOutIcon,
  MinusIcon,
  PlusIcon,
  PathIcon,
  ArrowCounterClockwiseIcon,
  ArrowsDownUpIcon,
  XIcon,
  GraduationCapIcon,
  CaretLeftIcon,
  CaretRightIcon,
  GitBranchIcon,
  CirclesThreeIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useReactFlow, useViewport } from "reactflow";
import { useStore, type EdgeLabelStyle, type EdgeStyle, type ViewMode } from "../store";
import type { RouteKind } from "../lib/route";
import { MathText } from "../lib/katex";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, kindsByCategory } from "../lib/nodeCategory";
import { CATEGORY_ICON } from "../lib/nodeCategoryIcons";
import { DomainGlyph, getDomainGlyphId } from "./DomainGlyph";
import { Pill, DockButton } from "./chrome/Pill";
import { Button } from "./chrome/Button";

interface PanelPosition {
  top: number;
  right: number;
}

/** Anchor a portal panel to the LEFT of a right-rail dock control. */
function panelPositionFor(el: HTMLElement): PanelPosition {
  const rect = el.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    right: Math.round(window.innerWidth - rect.left + 10),
  };
}

/**
 * Floating Apple-Maps-style canvas chrome: a stack of separate glass pills on the
 * right rail. The top "Map" pill opens an Apple-Maps "Map Modes"-style card that
 * consolidates view modes, layers, edge style, and filters.
 */
export interface RouteSummary {
  fromTitle?: string;
  toTitle?: string;
  count: number;
  found: boolean | null;
  /** Study order of the resolved route — drives the list and the tour. */
  ordered: string[];
  /** Shortest dependency chain between endpoints (path mode); inclusive. */
  spine?: string[];
}

export function CanvasControls({ routeSummary }: { routeSummary?: RouteSummary }) {
  const rf = useReactFlow();
  const [mapPanelOpen, setMapPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [directionsPosition, setDirectionsPosition] = useState<PanelPosition | null>(null);
  const mapButtonRef = useRef<HTMLDivElement>(null);
  const routeButtonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const directionsRef = useRef<HTMLDivElement>(null);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);
  const routeKind = useStore((s) => s.routeKind);
  const routeMode = useStore((s) => s.routeMode);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const toggleRouteMode = useStore((s) => s.toggleRouteMode);
  const clearRoute = useStore((s) => s.clearRoute);
  const showMinimap = useStore((s) => s.showMinimap);
  const toggleMinimap = useStore((s) => s.toggleMinimap);
  // Prereq resolves from a single goal (`routeTo`); path needs both endpoints.
  const routeResolved = routeKind === "prereq" ? routeTo !== null : routeFrom !== null && routeTo !== null;
  const routeActive = routeMode || routeResolved;
  const directionsOpen = routeActive;

  useEffect(() => {
    if (!mapPanelOpen && !directionsOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mapPanelOpen &&
        mapButtonRef.current &&
        !mapButtonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setMapPanelOpen(false);
      }
      if (
        directionsOpen &&
        routeButtonRef.current &&
        !routeButtonRef.current.contains(target) &&
        directionsRef.current &&
        !directionsRef.current.contains(target)
      ) {
        if (!routeResolved) clearRoute();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMapPanelOpen(false);
      if (directionsOpen && !routeResolved) clearRoute();
    };
    const onResize = () => {
      if (mapButtonRef.current) setPanelPosition(panelPositionFor(mapButtonRef.current));
      if (routeButtonRef.current) setDirectionsPosition(panelPositionFor(routeButtonRef.current));
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [clearRoute, directionsOpen, mapPanelOpen, routeResolved]);

  useEffect(() => {
    if (directionsOpen && routeButtonRef.current) {
      setDirectionsPosition(panelPositionFor(routeButtonRef.current));
    }
  }, [directionsOpen, routeFrom, routeTo]);

  return (
    <div className="pointer-events-none absolute right-3 top-18 z-30 flex flex-col items-end gap-2.5 sm:right-4 sm:top-19">
      {/* Map view — modes, layers, edge style & filters */}
      <div ref={mapButtonRef}>
        <Pill orientation="vertical" className="canvas-dock">
          <DockButton
            label="Map view"
            active={mapPanelOpen}
            onClick={() => {
              if (mapButtonRef.current) setPanelPosition(panelPositionFor(mapButtonRef.current));
              setMapPanelOpen((o) => !o);
            }}
          >
            <StackIcon className="h-4.25 w-4.25" weight="regular" />
          </DockButton>
        </Pill>
      </div>

      {/* Navigation tools */}
      <Pill orientation="vertical" className="canvas-dock">
        <div ref={routeButtonRef} className="mb-0.75">
          <DockButton
            label={routeActive ? "Directions" : "Plan route"}
            active={routeActive}
            onClick={() => {
              if (routeButtonRef.current) {
                setDirectionsPosition(panelPositionFor(routeButtonRef.current));
              }
              if (!routeActive) toggleRouteMode();
            }}
          >
            <PathIcon className="h-4.25 w-4.25" weight="regular" />
          </DockButton>
        </div>
        <DockButton label="Focus neighborhood" active={focusMode} onClick={toggleFocusMode}>
          <CrosshairIcon className="h-4.25 w-4.25" weight="regular" />
        </DockButton>
        {focusMode && <DepthPicker value={focusDepth} onChange={setFocusDepth} />}
      </Pill>

      {/* Minimap overlay */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton label={showMinimap ? "Hide minimap" : "Show minimap"} active={showMinimap} onClick={toggleMinimap}>
          <MapTrifoldIcon className="h-4.25 w-4.25" weight="regular" />
        </DockButton>
      </Pill>

      {/* Zoom */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton label="Zoom in" onClick={() => rf.zoomIn({ duration: 180 })}>
          <PlusIcon className="h-4.25 w-4.25" weight="regular" />
        </DockButton>
        <ZoomReadout />
        <DockButton label="Zoom out" onClick={() => rf.zoomOut({ duration: 180 })}>
          <MinusIcon className="h-4.25 w-4.25" weight="regular" />
        </DockButton>
      </Pill>

      {/* Fit view */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton label="Fit view" onClick={() => rf.fitView({ padding: 0.18, duration: 420 })}>
          <CornersOutIcon className="h-4.25 w-4.25" weight="regular" />
        </DockButton>
      </Pill>

      {mapPanelOpen && panelPosition && <MapPanel panelRef={panelRef} position={panelPosition} />}
      {directionsOpen && directionsPosition && (
        <DirectionsPanel
          panelRef={directionsRef}
          position={directionsPosition}
          summary={routeSummary ?? { count: 0, found: null, ordered: [] }}
        />
      )}
    </div>
  );
}

function DirectionsPanel({
  panelRef,
  position,
  summary,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  position: PanelPosition;
  summary: RouteSummary;
}) {
  const routeKind = useStore((s) => s.routeKind);
  const setRouteKind = useStore((s) => s.setRouteKind);
  const routeIncludeProof = useStore((s) => s.routeIncludeProof);
  const setRouteIncludeProof = useStore((s) => s.setRouteIncludeProof);
  const routeMode = useStore((s) => s.routeMode);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const selectedId = useStore((s) => s.selectedId);
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const setRouteEndpoint = useStore((s) => s.setRouteEndpoint);
  const swapRouteEndpoints = useStore((s) => s.swapRouteEndpoints);
  const clearRoute = useStore((s) => s.clearRoute);
  const replayRoute = useStore((s) => s.replayRoute);
  const select = useStore((s) => s.select);
  const tourIndex = useStore((s) => s.tourIndex);
  const startTour = useStore((s) => s.startTour);
  const tourStep = useStore((s) => s.tourStep);
  const endTour = useStore((s) => s.endTour);

  const isPrereq = routeKind === "prereq";
  const ordered = summary.ordered;
  const resolved = isPrereq ? Boolean(routeTo) : Boolean(routeFrom && routeTo);
  const goalLabel = (id: string | null) => (id ? map?.nodeById.get(id)?.label : undefined);

  const selectedTitle = selectedId ? map?.nodeById.get(selectedId)?.label : undefined;
  const fromTitle = summary.fromTitle ?? goalLabel(routeFrom);
  const toTitle = summary.toTitle ?? goalLabel(routeTo);
  const showSelectedShortcut = Boolean(routeMode && selectedId && selectedTitle);

  const [fromQuery, setFromQuery] = useState(fromTitle ?? "");
  const [toQuery, setToQuery] = useState(toTitle ?? "");
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);

  // Mirror the canonical titles into the editable query fields, except while the
  // user is editing that field. Tracked during render instead of via effects.
  const [fromSync, setFromSync] = useState({ activeField, fromTitle });
  if (fromSync.activeField !== activeField || fromSync.fromTitle !== fromTitle) {
    setFromSync({ activeField, fromTitle });
    if (activeField !== "from") setFromQuery(fromTitle ?? "");
  }
  const [toSync, setToSync] = useState({ activeField, toTitle });
  if (toSync.activeField !== activeField || toSync.toTitle !== toTitle) {
    setToSync({ activeField, toTitle });
    if (activeField !== "to") setToQuery(toTitle ?? "");
  }

  const nodes = map?.data.nodes ?? [];
  const fromResults = useRouteSearchResults(nodes, fromQuery, routeTo);
  const toResults = useRouteSearchResults(nodes, toQuery, routeFrom);

  return createPortal(
    <div
      ref={panelRef}
      className="canvas-control-panel panel-scrollbar pointer-events-auto fixed z-40 flex w-[min(340px,calc(100vw-24px))] flex-col gap-2.5 overflow-auto rounded-xl p-3"
      style={{
        top: position.top,
        right: position.right,
        maxHeight: `calc(100vh - ${position.top + 16}px)`,
      }}
      role="dialog"
      aria-label="Directions"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">Directions</div>
        <button
          type="button"
          onClick={clearRoute}
          className="rounded-sm p-1.5 text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg-1"
          aria-label={routeMode ? "Cancel directions" : "Clear directions"}
          title={routeMode ? "Cancel directions" : "Clear directions"}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <Segmented<RouteKind>
        value={routeKind}
        onChange={setRouteKind}
        options={[
          { value: "prereq", label: "Prerequisites" },
          { value: "path", label: "Path" },
        ]}
      />

      {isPrereq ? (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[inset_0_1px_0_var(--chrome-highlight)]">
          <RouteSearchField
            label="Goal"
            value={toQuery}
            placeholder="Pick a concept"
            selected={Boolean(routeTo)}
            active={activeField === "to"}
            results={toResults}
            onFocus={() => setActiveField("to")}
            onChange={(value) => {
              setToQuery(value);
              if (routeTo) setRouteEndpoint("to", null);
            }}
            onClear={() => {
              setToQuery("");
              setRouteEndpoint("to", null);
              setActiveField("to");
            }}
            onSelect={(id, label) => {
              setToQuery(label);
              setRouteEndpoint("to", id);
              setActiveField(null);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_34px] gap-2">
          <div className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[inset_0_1px_0_var(--chrome-highlight)]">
            <RouteSearchField
              label="From"
              value={fromQuery}
              placeholder="What you know"
              selected={Boolean(routeFrom)}
              active={activeField === "from"}
              results={fromResults}
              onFocus={() => setActiveField("from")}
              onChange={(value) => {
                setFromQuery(value);
                if (routeFrom) setRouteEndpoint("from", null);
              }}
              onClear={() => {
                setFromQuery("");
                setRouteEndpoint("from", null);
                setActiveField("from");
              }}
              onSelect={(id, label) => {
                setFromQuery(label);
                setRouteEndpoint("from", id);
                setActiveField(null);
              }}
            />
            <div className="mx-3 h-px bg-border" />
            <RouteSearchField
              label="Goal"
              value={toQuery}
              placeholder="What you want"
              selected={Boolean(routeTo)}
              active={activeField === "to"}
              results={toResults}
              onFocus={() => setActiveField("to")}
              onChange={(value) => {
                setToQuery(value);
                if (routeTo) setRouteEndpoint("to", null);
              }}
              onClear={() => {
                setToQuery("");
                setRouteEndpoint("to", null);
                setActiveField("to");
              }}
              onSelect={(id, label) => {
                setToQuery(label);
                setRouteEndpoint("to", id);
                setActiveField(null);
              }}
            />
          </div>
          <button
            type="button"
            onClick={swapRouteEndpoints}
            disabled={!routeFrom && !routeTo}
            className="flex h-full min-h-21.5 w-8.5 items-center justify-center rounded-lg border border-border bg-surface text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg-1 disabled:cursor-default disabled:opacity-35"
            aria-label="Swap endpoints"
            title="Swap endpoints"
          >
            <ArrowsDownUpIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {showSelectedShortcut && (
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="min-w-0 truncate text-ui-meta text-fg-3">{selectedTitle}</span>
          <button
            type="button"
            onClick={() => {
              const endpoint = isPrereq || !routeFrom ? (isPrereq ? "to" : "from") : "to";
              setRouteEndpoint(endpoint, selectedId);
              if (endpoint === "from") setFromQuery(selectedTitle ?? "");
              else setToQuery(selectedTitle ?? "");
            }}
            disabled={selectedId === routeFrom || selectedId === routeTo}
            className="shrink-0 rounded-sm px-2 py-1 text-ui-meta font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-45"
          >
            Use
          </button>
        </div>
      )}

      {resolved && (
        <div className="flex items-center justify-between gap-3 px-1 py-0.5">
          <span className="min-w-0 text-ui-meta text-fg-2">
            Include proof prerequisites
            <span className="block text-ui-meta text-fg-3">
              {routeIncludeProof ? "enough to prove it" : "enough to understand it"}
            </span>
          </span>
          <Switch
            label="Include proof prerequisites"
            checked={routeIncludeProof}
            onClick={() => setRouteIncludeProof(!routeIncludeProof)}
          />
        </div>
      )}

      {resolved && summary.found === false && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 truncate text-ui-meta font-semibold text-fg-1">No dependency path</div>
            <Button
              kind="text"
              onClick={clearRoute}
              className="flex h-8 items-center rounded-md px-2.5 text-ui-meta font-semibold text-fg-2"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {resolved && summary.found && ordered.length > 0 && (
        <RouteSequence
          map={map}
          ordered={ordered}
          spine={summary.spine}
          isPrereq={isPrereq}
          tourIndex={tourIndex}
          onPick={(id) => select(id)}
          onStartTour={startTour}
          onStep={tourStep}
          onEndTour={endTour}
          onReplay={replayRoute}
        />
      )}
    </div>,
    document.body,
  );
}

/** The resolved route as an ordered study list, with tour controls. */
function RouteSequence({
  map,
  ordered,
  spine,
  isPrereq,
  tourIndex,
  onPick,
  onStartTour,
  onStep,
  onEndTour,
  onReplay,
}: {
  map: import("../data").LoadedMap | undefined;
  ordered: string[];
  spine?: string[];
  isPrereq: boolean;
  tourIndex: number | null;
  onPick: (id: string) => void;
  onStartTour: () => void;
  onStep: (delta: number) => void;
  onEndTour: () => void;
  onReplay: () => void;
}) {
  const touring = tourIndex !== null;
  // Prereq count excludes the goal itself (last in study order).
  const prereqCount = Math.max(0, ordered.length - 1);
  // Hops along the shortest dependency chain (path mode); spine includes both ends.
  const spineSteps = !isPrereq && spine && spine.length > 1 ? spine.length - 1 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 text-ui-meta tabular-nums text-fg-3">
          <span className="font-semibold text-fg-1">{isPrereq ? prereqCount : ordered.length}</span>{" "}
          {isPrereq ? `prerequisite${prereqCount === 1 ? "" : "s"}` : `concept${ordered.length === 1 ? "" : "s"}`}
          {spineSteps > 0 && (
            <span className="text-fg-3">
              {" · "}
              <span className="font-semibold text-fg-1">{spineSteps}</span> step
              {spineSteps === 1 ? "" : "s"} via shortest path
            </span>
          )}
        </div>
        {!touring ? (
          <div className="flex items-center gap-1">
            <Button
              kind="text"
              accent
              onClick={onStartTour}
              className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-ui-meta font-semibold"
            >
              <GraduationCapIcon className="h-4 w-4" weight="fill" />
              Start tour
            </Button>
            <Button
              kind="text"
              onClick={onReplay}
              className="flex h-8 w-8 items-center justify-center rounded-md text-fg-2"
              aria-label="Replay animation"
            >
              <ArrowCounterClockwiseIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onStep(-1)}
              disabled={tourIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg-1 disabled:opacity-35"
              aria-label="Previous concept"
            >
              <CaretLeftIcon className="h-4 w-4" />
            </button>
            <span className="min-w-11 text-center text-ui-meta tabular-nums font-semibold text-fg-1">
              {tourIndex + 1} / {ordered.length}
            </span>
            <button
              type="button"
              onClick={() => onStep(1)}
              disabled={tourIndex >= ordered.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg-1 disabled:opacity-35"
              aria-label="Next concept"
            >
              <CaretRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEndTour}
              className="ml-1 rounded-sm px-2 py-1 text-ui-meta font-semibold text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg-1"
            >
              End
            </button>
          </div>
        )}
      </div>

      <ol className="panel-scrollbar flex max-h-[42vh] flex-col gap-0.5 overflow-y-auto rounded-lg border border-border bg-surface p-1">
        {ordered.map((id, i) => {
          const node = map?.nodeById.get(id);
          const current = touring && i === tourIndex;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                  current ? "bg-accent-soft" : "hover:bg-surface-2",
                )}
                aria-current={current ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ui-2xs font-semibold tabular-nums",
                    current ? "bg-accent text-fg-on-color" : "bg-surface-3 text-fg-3",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn("block truncate text-ui-meta font-semibold", current ? "text-accent" : "text-fg-1")}
                  >
                    <MathText text={node?.label ?? id} />
                  </span>
                  {node && <span className="block truncate text-ui-hint text-fg-3">{node.kind}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function useRouteSearchResults(nodes: import("../types").GraphNode[], query: string, excludedId: string | null) {
  return useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const ranked = nodes
      .filter((node) => node.id !== excludedId)
      .map((node) => {
        const label = node.label.toLowerCase();
        const kind = node.kind.toLowerCase();
        const domain = node.topicCluster.toLowerCase();
        const haystack = `${label} ${kind} ${domain}`;
        if (normalized && !haystack.includes(normalized)) return null;
        const rank = !normalized ? 2 : label === normalized ? 0 : label.startsWith(normalized) ? 1 : 2;
        return { node, rank };
      })
      .filter((item): item is { node: import("../types").GraphNode; rank: number } => Boolean(item))
      .sort((a, b) => a.rank - b.rank || a.node.label.localeCompare(b.node.label));
    return ranked.slice(0, 5).map(({ node }) => node);
  }, [excludedId, nodes, query]);
}

function RouteSearchField({
  label,
  value,
  placeholder,
  selected,
  active,
  results,
  onFocus,
  onChange,
  onClear,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  selected: boolean;
  active: boolean;
  results: import("../types").GraphNode[];
  onFocus: () => void;
  onChange: (value: string) => void;
  onClear: () => void;
  onSelect: (id: string, label: string) => void;
}) {
  const showResults = active && value.trim().length > 0 && results.length > 0;
  return (
    <div className="relative">
      <label className="flex min-h-10.75 min-w-0 items-center gap-2 px-3 py-1.5">
        <span className="w-9 shrink-0 text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
          {label}
        </span>
        <input
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-ui-control font-medium text-fg-1 outline-none placeholder:text-fg-3"
          aria-label={`${label} concept`}
          autoComplete="off"
          spellCheck={false}
        />
        {selected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-xs p-1 text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg-1"
            aria-label={`Clear ${label.toLowerCase()}`}
            title={`Clear ${label.toLowerCase()}`}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
      {showResults && (
        <div className="mx-2 mb-2 overflow-hidden rounded-md border border-border bg-surface-2">
          {results.map((node) => (
            <button
              key={node.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(node.id, node.label)}
              className="flex w-full min-w-0 items-center justify-between gap-3 px-2.5 py-1.5 text-left transition-colors hover:bg-surface"
            >
              <span className="min-w-0">
                <span className="block truncate text-ui-meta font-semibold text-fg-1">{node.label}</span>
                <span className="block truncate text-ui-hint text-fg-3">{node.kind}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Live zoom percentage; click to reset to 100%. */
function ZoomReadout() {
  const { zoom } = useViewport();
  const rf = useReactFlow();
  return (
    <button
      type="button"
      onClick={() => rf.zoomTo(1, { duration: 180 })}
      className="zoom-readout pointer-events-auto flex items-center justify-center rounded-sm font-semibold tabular-nums transition-colors"
      aria-label="Reset zoom to 100%"
      title="Reset zoom to 100%"
    >
      {Math.round(zoom * 100)}%
    </button>
  );
}

function DepthPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1" aria-label="Focus depth">
      {[1, 2, 3].map((depth) => {
        const active = value === depth;
        return (
          <button
            key={depth}
            type="button"
            onClick={() => onChange(depth)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-xs text-ui-2xs font-semibold tabular-nums transition-colors",
              active ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent-border" : "text-fg-2",
            )}
            aria-label={`Focus depth ${depth}`}
            aria-pressed={active}
          >
            {depth}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Shared controls ----------------------------------------------- */

/** iOS-style switch used for layer toggles. */
function Switch({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-pill transition-[box-shadow,filter,background-color]",
        checked
          ? "bg-accent hover:brightness-105"
          : "bg-surface-3 ring-1 ring-inset ring-border hover:bg-surface-2 hover:ring-border-strong",
      )}
    >
      <span
        className="absolute h-4.25 w-4.25 rounded-pill transition-transform"
        style={{
          left: 2,
          background: "var(--surface)",
          transform: checked ? "translateX(16px)" : "translateX(0)",
          boxShadow: "var(--shadow-1)",
        }}
      />
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: Icon }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="map-segmented grid w-full gap-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        const IconComponent = o.icon;

        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn("map-segmented-option", active && "is-active")}
            aria-label={o.label}
            title={o.label}
            aria-pressed={active}
          >
            {IconComponent ? <IconComponent className="h-4 w-4" weight={active ? "bold" : "regular"} /> : o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Apple-Maps "Map Modes" panel ---------------------------------- */

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="map-panel-section-title">{title}</div>
      {children}
    </section>
  );
}

const MODES: { id: ViewMode; label: string; hint: string; icon: Icon }[] = [
  { id: "dependency", label: "Dependency", hint: "Logical graph", icon: GitBranchIcon },
  { id: "cluster", label: "Regions", hint: "Domain clusters", icon: CirclesThreeIcon },
];

function ModeTile({
  active,
  label,
  hint,
  icon: IconComponent,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: Icon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("map-mode-tile group relative", active && "is-active")}
      aria-pressed={active}
    >
      <span
        className={cn("map-mode-tile-preview", active ? "bg-accent text-fg-on-color" : "bg-surface-2 text-fg-2")}
        aria-hidden
      >
        <IconComponent className="h-6 w-6" weight={active ? "bold" : "regular"} />
      </span>

      <span className="px-0.5">
        <span className={cn("block text-ui-control font-semibold leading-tight", active ? "text-accent" : "text-fg-1")}>
          {label}
        </span>
        <span className="block text-ui-hint text-fg-3">{hint}</span>
      </span>
    </button>
  );
}

const LAYERS: { key: "grid" | "regions" | "soft"; label: string }[] = [
  { key: "grid", label: "Coordinate grid" },
  { key: "regions", label: "Domain regions" },
  { key: "soft", label: "Soft dependencies" },
];

function MapPanel({ panelRef, position }: { panelRef: RefObject<HTMLDivElement | null>; position: PanelPosition }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showRegions = useStore((s) => s.showRegions);
  const toggleRegions = useStore((s) => s.toggleRegions);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);
  const edgeStyle = useStore((s) => s.edgeStyle);
  const setEdgeStyle = useStore((s) => s.setEdgeStyle);
  const edgeLabelStyle = useStore((s) => s.edgeLabelStyle);
  const setEdgeLabelStyle = useStore((s) => s.setEdgeLabelStyle);
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);

  const checked = { grid: showGrid, regions: showRegions, soft: showSoftDeps };
  const toggle = { grid: toggleGrid, regions: toggleRegions, soft: toggleSoftDeps };

  return createPortal(
    <div
      ref={panelRef}
      className="canvas-control-panel map-panel pointer-events-auto fixed z-40 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-xl"
      style={{
        top: position.top,
        right: position.right,
        maxHeight: `calc(100vh - ${position.top + 16}px)`,
      }}
      role="dialog"
      aria-label="Map view"
    >
      <div className="map-panel-scroll panel-scrollbar flex flex-col gap-3.5 overflow-y-auto p-3.5">
        <PanelSection title="Map Modes">
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <ModeTile
                key={m.id}
                active={view === m.id}
                label={m.label}
                hint={m.hint}
                icon={m.icon}
                onClick={() => setView(m.id)}
              />
            ))}
          </div>
        </PanelSection>

        <div className="map-panel-divider" />

        <PanelSection title="Layers">
          <div className="flex flex-col gap-1">
            {LAYERS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 py-1">
                <span className="text-ui-control font-medium text-fg-1">{label}</span>
                <Switch label={label} checked={checked[key]} onClick={toggle[key]} />
              </div>
            ))}
          </div>
        </PanelSection>

        <div className="map-panel-divider" />

        <PanelSection title="Edge style">
          <Segmented<EdgeStyle>
            value={edgeStyle}
            onChange={setEdgeStyle}
            options={[
              { value: "smooth", label: "Step" },
              { value: "bezier", label: "Curve" },
              { value: "straight", label: "Line" },
            ]}
          />
        </PanelSection>

        <div className="map-panel-divider" />

        <PanelSection title="Edge labels">
          <Segmented<EdgeLabelStyle>
            value={edgeLabelStyle}
            onChange={setEdgeLabelStyle}
            options={[
              { value: "prose", label: "Prose" },
              { value: "terse", label: "Verb" },
            ]}
          />
        </PanelSection>

        {map && (
          <>
            <div className="map-panel-divider" />
            <PanelSection title="Domains">
              <div className="flex flex-wrap gap-1.5">
                {map.data.domains.map((d) => {
                  const active = topics.size === 0 || topics.has(d.id);
                  const tone = getDomainTone(d.id);
                  const glyphId = getDomainGlyphId({ mapId, domainId: d.id });
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleTopic(d.id)}
                      className={cn("map-chip", !active && "is-muted")}
                      // Active domain chips carry the data-derived domain tone, which
                      // has no static utility equivalent.
                      style={active ? { background: tone.tint, borderColor: tone.border, color: tone.text } : undefined}
                    >
                      {glyphId ? (
                        <DomainGlyph id={glyphId} size={12} />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "currentColor" }} />
                      )}
                      {d.label}
                    </button>
                  );
                })}
              </div>
              {topics.size > 0 && (
                <button onClick={resetTopics} className="mt-2 text-ui-hint text-accent hover:underline">
                  Reset domains
                </button>
              )}
            </PanelSection>

            <div className="map-panel-divider" />

            <PanelSection title="Categories">
              <div className="flex flex-wrap gap-1.5">
                {kindsByCategory(map.kinds).map(({ category, kinds: groupKinds }) => {
                  const meta = CATEGORY_META[category];
                  const Icon = CATEGORY_ICON[category];
                  const active = groupKinds.every((k) => kinds.has(k));
                  return (
                    <button
                      key={category}
                      onClick={() => groupKinds.forEach((k) => kinds.has(k) === active && toggleKind(k))}
                      className={cn("map-chip", active ? "is-accent" : "is-muted")}
                    >
                      <Icon className="h-3 w-3" weight={active ? "bold" : "regular"} aria-hidden />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </PanelSection>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
