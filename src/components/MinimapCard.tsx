import { useMemo } from "react";
import type { MouseEvent } from "react";
import { useReactFlow, useStore as useReactFlowStore, useViewport, type Node } from "reactflow";
import { ATLAS_NODE_HEIGHT, ATLAS_NODE_WIDTH, type DomainBounds } from "../lib/atlasLayout";
import { getDomainTone } from "../lib/colors";
import type { GraphNode } from "../types";

const MAX_W = 148;
const MAX_H = 220;
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

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const flowPoint = layout.toFlow(x, y);
    rf.setCenter(flowPoint.x, flowPoint.y, { zoom: rf.getZoom(), duration: 280 });
  };

  return (
    <div
      className="absolute top-[68px] z-20 hidden rounded-[16px] border p-2 shadow-[var(--shadow-2)] md:block"
      style={{
        right: selectedId ? "calc(min(380px, 42vw) + 28px)" : 16,
        background: "color-mix(in srgb, var(--surface) 86%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px) saturate(1.15)",
        transition: "right 0.22s cubic-bezier(0.2,0.7,0.2,1)",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        onClick={handleClick}
        className="block cursor-pointer rounded-[10px]"
        style={{ background: "color-mix(in srgb, var(--bg-deep) 64%, var(--surface))" }}
      >
        {[...regions.entries()].map(([domainId, region]) => {
          const tone = getDomainTone(domainId);
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
                strokeDasharray="2 2"
                strokeWidth={1}
                opacity={0.76}
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
              strokeDasharray="2 2"
              strokeWidth={1}
              opacity={0.76}
            />
          );
        })}
        {points.map((point) => {
          const p = layout.toMini(point.cx, point.cy);
          const selected = point.id === selectedId;
          return (
            <circle
              key={point.id}
              cx={p.x}
              cy={p.y}
              r={selected ? 3.1 : 1.7}
              fill={getDomainTone(point.domainId).color}
              opacity={selected ? 1 : 0.6}
            />
          );
        })}
        <rect
          x={Math.min(topLeft.x, bottomRight.x)}
          y={Math.min(topLeft.y, bottomRight.y)}
          width={Math.abs(bottomRight.x - topLeft.x)}
          height={Math.abs(bottomRight.y - topLeft.y)}
          rx={4}
          fill="color-mix(in srgb, var(--surface) 16%, transparent)"
          stroke="var(--accent)"
          strokeDasharray="3 3"
          strokeWidth={1}
          opacity={0.86}
        />
      </svg>
    </div>
  );
}
