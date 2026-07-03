/**
 * The plane: a Mafs coordinate view that renders the compiled workspace —
 * plotted functions, geometry constructions, draggable free points, dependent
 * points, and marks.
 *
 * It is intentionally a *pure function of the compiled workspace* so rendering
 * stays separate from expression editing and persistence.
 *
 * Draw order is deliberate: marks (axes/guides) sit behind, then curves and
 * geometry, then points and their labels on top.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Coordinates, LaTeX, Line, MovablePoint, Mafs, Plot, Point, Polygon, Vector } from "mafs";
import type { CompiledWorkspace } from "./engine";
import { asVec2 } from "./engine";
import type { Vec2 } from "./expr";
import type { Computed, GeomShape, Mark, Row, ViewRect } from "./types";

type Pt = [number, number];
const m = (v: Vec2): Pt => [v[0], v[1]];

export interface PlaneViewProps {
  rows: Row[];
  compiled: CompiledWorkspace;
  viewport: ViewRect;
  marks: Mark[];
  /** Drag callback for free points (id → new position). */
  onMovePoint?: (id: string, p: Pt) => void;
  /** Compact mode hides labels/coordinates for small embeds. */
  compact?: boolean;
  height?: number;
  pan?: boolean;
}

export function PlaneView({
  rows,
  compiled,
  viewport,
  marks,
  onMovePoint,
  compact = false,
  height,
  pan = true,
}: PlaneViewProps) {
  const meta = useMemo(() => {
    const map: Record<string, { color: string; visible: boolean; name?: string }> = {};
    for (const r of rows) {
      map[r.id] = { color: r.color, visible: r.visible, name: compiled.byId[r.id]?.name };
    }
    return map;
  }, [rows, compiled]);

  const drawable = compiled.computed.filter((c) => c && !c.error && meta[c.id]?.visible);
  const isPoint = (c: Computed) => c.kind === "freePoint" || c.kind === "point";
  const shapes = drawable.filter((c) => !isPoint(c));
  const points = drawable.filter(isPoint);

  // Remount only when the viewport rect or height changes (not on every
  // recompile), so live panning survives slider/drag-driven recompiles.
  const containerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(height ?? 0);
  useEffect(() => {
    if (height) return; // fixed height (embeds) — no measuring needed
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMeasured(Math.round(e.contentRect.height)));
    ro.observe(el);
    setMeasured(Math.round(el.getBoundingClientRect().height));
    return () => ro.disconnect();
  }, [height]);

  const h = height ?? measured;
  const viewKey = `${viewport.xmin},${viewport.xmax},${viewport.ymin},${viewport.ymax}:${h}`;

  return (
    <div ref={containerRef} className="sandbox-plane h-full w-full">
      {h > 0 && (
        <Mafs
          key={viewKey}
          pan={pan}
          zoom={pan ? { min: 0.05, max: 50 } : false}
          height={h}
          viewBox={{ x: [viewport.xmin, viewport.xmax], y: [viewport.ymin, viewport.ymax] }}
          preserveAspectRatio="contain"
        >
          <Coordinates.Cartesian
            subdivisions={compact ? false : 2}
            xAxis={compact ? { labels: () => "" } : undefined}
            yAxis={compact ? { labels: () => "" } : undefined}
          />

          {marks.map((mk) => (
            <MarkLayer key={mk.id} mark={mk} viewport={viewport} compact={compact} />
          ))}

          {shapes.map((c) => {
            const color = meta[c.id].color;
            if (c.kind === "function" && c.sample) {
              return <Plot.OfX key={c.id} y={c.sample} color={color} />;
            }
            if (c.geom) return <GeomLayer key={c.id} geom={c.geom} color={color} />;
            return null;
          })}

          {points.map((c) => {
            const p = asVec2(c.value);
            if (!p) return null;
            const { color, name } = meta[c.id];
            const label = compact ? undefined : name;
            return c.kind === "freePoint" ? (
              <FreePoint key={c.id} id={c.id} point={m(p)} color={color} name={label} onMove={onMovePoint} />
            ) : (
              <DepPoint key={c.id} point={m(p)} color={color} name={label} />
            );
          })}
        </Mafs>
      )}
    </div>
  );
}

function GeomLayer({ geom, color }: { geom: GeomShape; color: string }) {
  switch (geom.kind) {
    case "segment":
      return <Line.Segment point1={m(geom.a)} point2={m(geom.b)} color={color} />;
    case "line":
      return <Line.ThroughPoints point1={m(geom.a)} point2={m(geom.b)} color={color} />;
    case "circle":
      return <Circle center={m(geom.c)} radius={geom.r} color={color} fillOpacity={0.06} />;
    case "polygon":
      return <Polygon points={geom.pts.map(m)} color={color} fillOpacity={0.1} />;
    case "vector":
      return <Vector tail={m(geom.tail)} tip={m(geom.tip)} color={color} />;
  }
}

const labelTex = (name: string) => `\\mathit{${name}}`;

/** A free point owns its MovablePoint hook; one component instance per point. */
function FreePoint({
  id,
  point,
  color,
  name,
  onMove,
}: {
  id: string;
  point: Pt;
  color: string;
  name?: string;
  onMove?: (id: string, p: Pt) => void;
}) {
  return (
    <>
      <MovablePoint point={point} color={color} onMove={(p) => onMove?.(id, p as Pt)} />
      {name && <LaTeX at={[point[0] + 0.28, point[1] + 0.28]} tex={labelTex(name)} color={color} />}
    </>
  );
}

function DepPoint({ point, color, name }: { point: Pt; color: string; name?: string }) {
  return (
    <>
      <Point x={point[0]} y={point[1]} color={color} />
      {name && <LaTeX at={[point[0] + 0.28, point[1] + 0.28]} tex={labelTex(name)} color={color} />}
    </>
  );
}

function MarkLayer({ mark, viewport, compact }: { mark: Mark; viewport: ViewRect; compact: boolean }) {
  const color = mark.color ?? "var(--muted-foreground)";
  switch (mark.kind) {
    case "label":
      return <LaTeX at={m(mark.at)} tex={`\\textsf{${escapeTex(mark.text)}}`} color={color} />;
    case "segment":
      return (
        <>
          <Line.Segment point1={m(mark.a)} point2={m(mark.b)} color={color} />
          {mark.text && !compact && (
            <LaTeX
              at={[(mark.a[0] + mark.b[0]) / 2, (mark.a[1] + mark.b[1]) / 2]}
              tex={`\\textsf{${escapeTex(mark.text)}}`}
              color={color}
            />
          )}
        </>
      );
    case "vline":
      return <Line.Segment point1={[mark.x, viewport.ymin]} point2={[mark.x, viewport.ymax]} color={color} />;
    case "hline":
      return <Line.Segment point1={[viewport.xmin, mark.y]} point2={[viewport.xmax, mark.y]} color={color} />;
  }
}

const escapeTex = (s: string) => s.replace(/([#$%&_{}])/g, "\\$1");
