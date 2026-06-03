import { useMemo } from "react";
import type { MouseEvent } from "react";
import { useReactFlow, useStore as useReactFlowStore, useViewport, type Node } from "reactflow";
import { ATLAS_NODE_HEIGHT, ATLAS_NODE_WIDTH, type DomainBounds } from "../lib/atlasLayout";
import { getMutedDomainTone } from "../lib/colors";
import type { GraphNode } from "../types";

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
            domainId: graphNode?.domainId ?? "",
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
    rf.setCenter(flowPoint.x, flowPoint.y, { zoom: rf.getZoom(), duration: 280 });
  };

  return (
    <div
      className="atlas-minimap-card absolute bottom-4 right-4 z-20 hidden rounded-[var(--radius-lg)] border p-1.5 md:block"
      style={{
        background: "color-mix(in srgb, var(--surface) 90%, transparent)",
        borderColor: "color-mix(in srgb, var(--border) 82%, transparent)",
        boxShadow: "var(--shadow-2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        onClick={handleClick}
        className="block cursor-pointer rounded-[var(--radius-md)]"
        style={{
          background: "color-mix(in srgb, var(--surface-2) 78%, var(--bg))",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--border) 68%, transparent)",
        }}
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
          fill="color-mix(in srgb, var(--accent) 4%, transparent)"
          stroke="color-mix(in srgb, var(--accent) 72%, var(--surface))"
          strokeWidth={0.95}
          opacity={0.84}
        />
        {points.map((point) => {
          const p = layout.toMini(point.cx, point.cy);
          const selected = point.id === selectedId;
          const tone = getMutedDomainTone(point.domainId);
          return selected ? (
            <g key={point.id}>
              <circle cx={p.x} cy={p.y} r={3.4} fill="var(--surface)" opacity={0.94} />
              <circle cx={p.x} cy={p.y} r={2.2} fill={tone.color} opacity={0.96} />
              <circle cx={p.x} cy={p.y} r={4.2} fill="none" stroke={tone.color} strokeWidth={0.8} opacity={0.78} />
            </g>
          ) : (
            <circle
              key={point.id}
              cx={p.x}
              cy={p.y}
              r={1.35}
              fill={tone.color}
              opacity={0.66}
            />
          );
        })}
      </svg>
    </div>
  );
}
