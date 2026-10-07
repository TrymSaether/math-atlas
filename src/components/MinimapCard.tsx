import { useMemo } from "react";
import { useReactFlow, useStore as useRFStore, useViewport, type Node } from "reactflow";
import { getKindColor } from "../lib/kindStyle";
import type { DomainRegion } from "../lib/layout";
import type { GraphNode } from "../types";

const W = 200;
const H = 128;
const PAD = 10;
const NODE_W = 200;
const NODE_H = 84;

export function MinimapCard({
  nodes,
  regions,
  routeSet,
  selectedId,
}: {
  nodes: Node[];
  regions: DomainRegion[];
  routeSet: Set<string>;
  selectedId: string | null;
}) {
  const rf = useReactFlow();
  const { x: vx, y: vy, zoom } = useViewport();
  const paneW = useRFStore((s) => s.width);
  const paneH = useRFStore((s) => s.height);

  const points = useMemo(
    () =>
      nodes
        .filter((node) => node.type === "topo")
        .map((node) => ({
          id: node.id,
          cx: node.position.x + NODE_W / 2,
          cy: node.position.y + NODE_H / 2,
          kind: (node.data as { node?: GraphNode })?.node?.kind ?? "definition",
        })),
    [nodes],
  );

  const layout = useMemo(() => {
    if (points.length === 0 && regions.length === 0) return null;
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
    for (const region of regions) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    }
    if (!Number.isFinite(minX)) return null;
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    const offX = PAD + ((W - PAD * 2) - spanX * scale) / 2;
    const offY = PAD + ((H - PAD * 2) - spanY * scale) / 2;
    const toMini = (fx: number, fy: number) => ({
      x: offX + (fx - minX) * scale,
      y: offY + (fy - minY) * scale,
    });
    const toFlow = (mx: number, my: number) => ({
      x: (mx - offX) / scale + minX,
      y: (my - offY) / scale + minY,
    });
    return { toMini, toFlow };
  }, [points, regions]);

  if (!layout) return null;

  const viewTL = layout.toMini(-vx / zoom, -vy / zoom);
  const viewBR = layout.toMini((-vx + paneW) / zoom, (-vy + paneH) / zoom);

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * W;
    const my = ((event.clientY - rect.top) / rect.height) * H;
    const flow = layout.toFlow(mx, my);
    rf.setCenter(flow.x, flow.y, { zoom: rf.getZoom(), duration: 300 });
  };

  return (
    <div
      className="pointer-events-auto absolute top-[68px] z-20 hidden rounded-2xl border p-2 backdrop-blur-xl transition-[right] duration-200 sm:block"
      style={{
        width: W + 16,
        right: selectedId ? "calc(380px + 28px)" : 12,
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--fg-3)" }}>
          Overview
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: "var(--fg-3)" }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
      <svg
        aria-label="Graph overview minimap"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        onClick={handleClick}
        className="block cursor-pointer rounded-xl"
        style={{ background: "var(--surface-2)" }}
      >
        {regions.map((region) => {
          const topLeft = layout.toMini(region.x, region.y);
          const bottomRight = layout.toMini(region.x + region.width, region.y + region.height);
          if (region.shape === "circle") {
            const center = layout.toMini(region.x + region.width / 2, region.y + region.height / 2);
            return (
              <circle
                key={region.id}
                cx={center.x}
                cy={center.y}
                r={(bottomRight.x - topLeft.x) / 2}
                fill={region.tint}
                stroke={region.border}
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.78}
              />
            );
          }
          return (
            <rect
              key={region.id}
              x={topLeft.x}
              y={topLeft.y}
              width={bottomRight.x - topLeft.x}
              height={bottomRight.y - topLeft.y}
              rx={4}
              fill={region.tint}
              stroke={region.border}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.78}
            />
          );
        })}
        {points.map((point) => {
          const { x, y } = layout.toMini(point.cx, point.cy);
          const selected = point.id === selectedId;
          const route = routeSet.has(point.id);
          return (
            <circle
              key={point.id}
              cx={x}
              cy={y}
              r={selected ? 3 : route ? 2.4 : 1.55}
              fill={getKindColor(point.kind)}
              opacity={selected ? 1 : route ? 0.95 : 0.58}
            />
          );
        })}
        <rect
          x={Math.min(viewTL.x, viewBR.x)}
          y={Math.min(viewTL.y, viewBR.y)}
          width={Math.abs(viewBR.x - viewTL.x)}
          height={Math.abs(viewBR.y - viewTL.y)}
          fill="none"
          stroke="var(--fg-3)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}
