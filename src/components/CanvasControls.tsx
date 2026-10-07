import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Crosshair,
  Stack,
  MapTrifold,
  CornersOut,
  Minus,
  Plus,
  Shapes,
  Path,
  Graph,
  type Icon,
} from "@phosphor-icons/react";
import { useReactFlow, useViewport } from "reactflow";
import { useStore, type EdgeLabelStyle, type EdgeStyle, type ViewMode } from "../store";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, kindsByCategory } from "../lib/nodeCategory";
import { DomainGlyph, getDomainGlyphId } from "./DomainGlyph";
import { Pill, DockButton } from "./chrome/Pill";

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
export function CanvasControls() {
  const rf = useReactFlow();
  const [mapPanelOpen, setMapPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const mapButtonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);
  const routeMode = useStore((s) => s.routeMode);
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const toggleRouteMode = useStore((s) => s.toggleRouteMode);
  const showMinimap = useStore((s) => s.showMinimap);
  const toggleMinimap = useStore((s) => s.toggleMinimap);
  const routeActive = routeMode || (routeFrom !== null && routeTo !== null);

  useEffect(() => {
    if (!mapPanelOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mapButtonRef.current &&
        !mapButtonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setMapPanelOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapPanelOpen(false);
    };
    const onResize = () => {
      if (mapButtonRef.current) setPanelPosition(panelPositionFor(mapButtonRef.current));
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [mapPanelOpen]);

  return (
    <div className="pointer-events-none absolute right-3 top-[72px] z-30 flex flex-col items-end gap-2 sm:right-4">
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
            <Stack className="h-[17px] w-[17px]" weight="regular" />
          </DockButton>
        </Pill>
      </div>

      {/* Navigation tools */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton
          label={routeActive ? "Cancel route" : "Plan route"}
          active={routeActive}
          onClick={toggleRouteMode}
        >
          <Path className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
        <DockButton label="Focus neighborhood" active={focusMode} onClick={toggleFocusMode}>
          <Crosshair className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
        {focusMode && <DepthPicker value={focusDepth} onChange={setFocusDepth} />}
      </Pill>

      {/* Minimap overlay */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton
          label={showMinimap ? "Hide minimap" : "Show minimap"}
          active={showMinimap}
          onClick={toggleMinimap}
        >
          <MapTrifold className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
      </Pill>

      {/* Zoom */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton label="Zoom in" onClick={() => rf.zoomIn({ duration: 180 })}>
          <Plus className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
        <ZoomReadout />
        <DockButton label="Zoom out" onClick={() => rf.zoomOut({ duration: 180 })}>
          <Minus className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
      </Pill>

      {/* Fit view */}
      <Pill orientation="vertical" className="canvas-dock">
        <DockButton
          label="Fit view"
          onClick={() => rf.fitView({ padding: 0.18, duration: 420 })}
        >
          <CornersOut className="h-[17px] w-[17px]" weight="regular" />
        </DockButton>
      </Pill>

      {mapPanelOpen && panelPosition && (
        <MapPanel panelRef={panelRef} position={panelPosition} />
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
      className="zoom-readout pointer-events-auto flex items-center justify-center rounded-[var(--radius-sm)] font-semibold tabular-nums transition-colors"
      aria-label="Reset zoom to 100%"
      title="Reset zoom to 100%"
    >
      {Math.round(zoom * 100)}%
    </button>
  );
}

function DepthPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1" aria-label="Focus depth">
      {[1, 2, 3].map((depth) => {
        const active = value === depth;
        return (
          <button
            key={depth}
            type="button"
            onClick={() => onChange(depth)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-ui-2xs font-semibold tabular-nums transition-colors",
              active
                ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent-border"
                : "text-fg-2",
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
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-accent" : "bg-surface-3 ring-1 ring-inset ring-border",
      )}
    >
      <span
        className="absolute h-[17px] w-[17px] rounded-full transition-transform"
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
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid w-full gap-0.5 rounded-[var(--radius-md)] bg-surface-2 p-0.5 ring-1 ring-inset ring-border"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1.5 text-ui-meta font-semibold transition-colors",
              active ? "bg-accent text-fg-on-color" : "text-fg-2",
            )}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Apple-Maps "Map Modes" panel ---------------------------------- */

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
        {title}
      </div>
      {children}
    </div>
  );
}

const MODES: { id: ViewMode; label: string; hint: string; icon: Icon }[] = [
  { id: "dependency", label: "Dependency", hint: "Logical graph", icon: Graph },
  { id: "cluster", label: "Regions", hint: "Domain clusters", icon: Shapes },
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
      className={cn(
        "group relative flex flex-col gap-2 rounded-[var(--radius-lg)] border p-2 text-left transition-colors",
        active
          ? "border-accent bg-accent-soft ring-1 ring-inset ring-accent"
          : "border-border bg-surface",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-[var(--radius-md)]",
          active ? "bg-accent text-fg-on-color" : "bg-surface-2 text-fg-2",
        )}
        aria-hidden
      >
        <IconComponent className="h-6 w-6" weight={active ? "bold" : "regular"} />
      </span>

      <span className="px-0.5">
        <span
          className={cn(
            "block text-ui-control font-semibold leading-tight",
            active ? "text-accent" : "text-fg-1",
          )}
        >
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

function MapPanel({
  panelRef,
  position,
}: {
  panelRef: RefObject<HTMLDivElement>;
  position: PanelPosition;
}) {
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
      className="map-popover pointer-events-auto fixed z-50 flex w-[min(320px,calc(100vw-24px))] flex-col gap-4 overflow-y-auto rounded-[var(--radius-2xl)] p-4"
      style={{
        top: position.top,
        right: position.right,
        maxHeight: `calc(100vh - ${position.top + 16}px)`,
      }}
      role="dialog"
      aria-label="Map view"
    >
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

      <div className="h-px bg-border" />

      <PanelSection title="Layers">
        <div className="flex flex-col gap-0.5">
          {LAYERS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3 py-1">
              <span className="text-ui-control font-medium text-fg-1">{label}</span>
              <Switch label={label} checked={checked[key]} onClick={toggle[key]} />
            </div>
          ))}
        </div>
      </PanelSection>

      <div className="h-px bg-border" />

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

      <div className="h-px bg-border" />

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
          <div className="h-px bg-border" />
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
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 text-ui-meta font-medium transition-colors",
                      !active && "bg-surface border-border text-fg-3",
                    )}
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
              <button
                onClick={resetTopics}
                className="mt-2 text-ui-hint text-accent hover:underline"
              >
                Reset domains
              </button>
            )}
          </PanelSection>

          <div className="h-px bg-border" />

          <PanelSection title="Categories">
            <div className="flex flex-wrap gap-1.5">
              {kindsByCategory(map.kinds).map(({ category, kinds: groupKinds }) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                const active = groupKinds.every((k) => kinds.has(k));
                return (
                  <button
                    key={category}
                    onClick={() => groupKinds.forEach((k) => kinds.has(k) === active && toggleKind(k))}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 text-ui-meta font-medium transition-colors",
                      active
                        ? "bg-accent-soft border-accent-border text-accent"
                        : "bg-surface border-border text-fg-3",
                    )}
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
    </div>,
    document.body,
  );
}
