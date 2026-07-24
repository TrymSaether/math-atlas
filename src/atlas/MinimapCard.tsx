import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useReactFlow, useStore as useReactFlowStore, useViewport, type Node } from "@xyflow/react";
import { ATLAS_NODE_HEIGHT, ATLAS_NODE_WIDTH, type DomainBounds } from "./layout";
import { getMutedDomainTone } from "./colors";
import { spring, Surface } from "@/design";
import type { GraphNode } from "@/maps/types";
import { Button } from "@/ui/button";

const MAX_W = 148;
const MAX_H = 204;
const PAD = 8;

interface MiniPoint {
  id: string;
  cx: number;
  cy: number;
  domainId: string;
}

export function MinimapCard({
  nodes,
  regions,
  selectedId,
}: {
  nodes: Node[];
  regions: Map<string, DomainBounds>;
  selectedId: string | null;
}) {
  const rf = useReactFlow();
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const paneW = useReactFlowStore((s) => s.width);
  const paneH = useReactFlowStore((s) => s.height);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("atlas-minimap-open", mobileOpen);
    if (!mobileOpen) {
      return () => document.documentElement.classList.remove("atlas-minimap-open");
    }
    const frame = requestAnimationFrame(() => mobileCloseRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("atlas-minimap-open");
      requestAnimationFrame(() => mobileTriggerRef.current?.focus());
    };
  }, [mobileOpen]);

  const points = useMemo<MiniPoint[]>(
    () =>
      nodes
        .filter((node) => node.type === "topo")
        .map((node) => {
          const graphNode = (node.data as { node?: GraphNode }).node;
          return {
            id: node.id,
            cx: node.position.x + ATLAS_NODE_WIDTH / 2,
            cy: node.position.y + ATLAS_NODE_HEIGHT / 2,
            domainId: graphNode?.domain ?? "",
          };
        }),
    [nodes],
  );

  const layout = useMemo(() => {
    if (points.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.cx);
      minY = Math.min(minY, point.cy);
      maxX = Math.max(maxX, point.cx);
      maxY = Math.max(maxY, point.cy);
    }

    for (const region of regions.values()) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    }

    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const scale = Math.min((MAX_W - PAD * 2) / spanX, (MAX_H - PAD * 2) / spanY);
    const W = Math.ceil(spanX * scale + PAD * 2);
    const H = Math.ceil(spanY * scale + PAD * 2);
    const offX = PAD;
    const offY = PAD;

    return {
      W,
      H,
      toMini: (x: number, y: number) => ({
        x: offX + (x - minX) * scale,
        y: offY + (y - minY) * scale,
      }),
      toFlow: (x: number, y: number) => ({
        x: (x - offX) / scale + minX,
        y: (y - offY) / scale + minY,
      }),
    };
  }, [points, regions]);

  if (!layout) return null;

  const { W, H } = layout;
  const topLeft = layout.toMini(-viewportX / zoom, -viewportY / zoom);
  const bottomRight = layout.toMini((-viewportX + paneW) / zoom, (-viewportY + paneH) / zoom);
  const viewX = Math.max(0, Math.min(W, Math.min(topLeft.x, bottomRight.x)));
  const viewY = Math.max(0, Math.min(H, Math.min(topLeft.y, bottomRight.y)));
  const viewRight = Math.max(0, Math.min(W, Math.max(topLeft.x, bottomRight.x)));
  const viewBottom = Math.max(0, Math.min(H, Math.max(topLeft.y, bottomRight.y)));
  const viewW = Math.max(0.5, viewRight - viewX);
  const viewH = Math.max(0.5, viewBottom - viewY);

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const flowPoint = layout.toFlow(x, y);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rf.setCenter(flowPoint.x, flowPoint.y, { zoom: rf.getZoom(), duration: reduceMotion ? 0 : 280 });
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const stepX = (paneW / zoom) * 0.22;
    const stepY = (paneH / zoom) * 0.22;
    let deltaX = 0;
    let deltaY = 0;
    if (event.key === "ArrowLeft") deltaX = -stepX;
    else if (event.key === "ArrowRight") deltaX = stepX;
    else if (event.key === "ArrowUp") deltaY = -stepY;
    else if (event.key === "ArrowDown") deltaY = stepY;
    else return;
    event.preventDefault();
    const currentCenterX = (-viewportX + paneW / 2) / zoom;
    const currentCenterY = (-viewportY + paneH / 2) / zoom;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rf.setCenter(currentCenterX + deltaX, currentCenterY + deltaY, {
      zoom: rf.getZoom(),
      duration: reduceMotion ? 0 : 180,
    });
  };

  const overview = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Map overview. Click to recenter or use arrow keys to move the viewport."
      className="block cursor-pointer rounded-[16px] bg-muted shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--border)_68%,transparent)]"
    >
      {[...regions.entries()].map(([domainId, region]) => {
        const tone = getMutedDomainTone(domainId);
        const a = layout.toMini(region.x, region.y);
        const b = layout.toMini(region.x + region.width, region.y + region.height);
        if (region.shape === "circle") {
          const center = layout.toMini(region.x + region.width / 2, region.y + region.height / 2);
          return (
            <circle
              key={domainId}
              cx={center.x}
              cy={center.y}
              r={Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2}
              fill={tone.tint}
              stroke={tone.border}
              strokeWidth={0.75}
              opacity={0.38}
            />
          );
        }
        return (
          <rect
            key={domainId}
            x={a.x}
            y={a.y}
            width={b.x - a.x}
            height={b.y - a.y}
            rx={4}
            fill={tone.tint}
            stroke={tone.border}
            strokeWidth={0.75}
            opacity={0.38}
          />
        );
      })}
      <rect
        x={viewX}
        y={viewY}
        width={viewW}
        height={viewH}
        rx={5}
        fill="color-mix(in srgb, var(--primary) 4%, transparent)"
        stroke="color-mix(in srgb, var(--primary) 72%, var(--card))"
        strokeWidth={0.95}
        opacity={0.84}
      />
      {points.map((point) => {
        const p = layout.toMini(point.cx, point.cy);
        const selected = point.id === selectedId;
        const tone = getMutedDomainTone(point.domainId);
        return selected ? (
          <g key={point.id}>
            <circle cx={p.x} cy={p.y} r={3.4} fill="var(--card)" opacity={0.94} />
            <circle cx={p.x} cy={p.y} r={2.2} fill={tone.color} opacity={0.96} />
            <circle cx={p.x} cy={p.y} r={4.2} fill="none" stroke={tone.color} strokeWidth={0.8} opacity={0.78} />
          </g>
        ) : (
          <circle key={point.id} cx={p.x} cy={p.y} r={1.35} fill={tone.color} opacity={0.66} />
        );
      })}
    </svg>
  );

  return (
    <>
      <Surface
        material="regular"
        data-atlas-minimap-control=""
        className="absolute right-[72px] bottom-[var(--shell-edge)] z-(--z-shell) hidden rounded-[22px] p-1.5 md:block"
      >
        {overview}
      </Surface>

      {!mobileOpen && (
        <Surface
          material="regular"
          data-atlas-minimap-control=""
          className="absolute right-[58px] bottom-[var(--shell-edge)] z-(--z-shell) flex size-12 items-center justify-center rounded-full md:hidden"
        >
          <Button
            ref={mobileTriggerRef}
            variant="ghost"
            size="icon"
            className="size-10 rounded-full text-muted-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open map overview"
            title="Overview"
          >
            <MapIcon className="size-[18px]" />
          </Button>
        </Surface>
      )}

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-(--z-shell-raised) max-h-full md:hidden"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
            transition={reduceMotion ? { duration: 0.1 } : spring.smooth}
          >
            <Surface
              material="thick"
              elevation="overlay"
              role="dialog"
              aria-label="Map overview"
              className="flex max-h-full flex-col overflow-hidden rounded-t-[28px] p-3"
            >
              <span
                aria-hidden
                className="absolute top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-muted-foreground/35"
              />
              <header className="flex items-center justify-between gap-3 px-1 pb-2">
                <div>
                  <h2 className="text-headline font-semibold text-foreground">Overview</h2>
                  <p className="text-caption text-muted-foreground">Tap the map to recenter</p>
                </div>
                <Button
                  ref={mobileCloseRef}
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close overview"
                >
                  <X className="size-4" />
                </Button>
              </header>
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-[20px] bg-muted/60 p-4">
                {overview}
              </div>
            </Surface>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
