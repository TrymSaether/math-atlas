import { useMemo } from "react";
import { Maximize2 } from "lucide-react";
import { useReactFlow, useViewport, useStore as useRFStore, type Node } from "reactflow";
import { getKindColor } from "../lib/kindStyle";
import type { DomainRegion } from "../lib/layout";
import type { GraphNode } from "../types";

const W = 200;
const H = 130;
const PAD = 10;
const NODE_W = 200;
const NODE_H = 84;

/** Floating "Overview" minimap — translucent card matching the Atlas design kit. */
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
        .filter((n) => n.type === "topo")
        .map((n) => ({
          id: n.id,
          cx: n.position.x + NODE_W / 2,
          cy: n.position.y + NODE_H / 2,
          kind: (n.data as { node?: GraphNode })?.node?.kind ?? "definition",
        })),
    [nodes]
  );

  const layout = useMemo(() => {
    if (points.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.cx);
      minY = Math.min(minY, p.cy);
      maxX = Math.max(maxX, p.cx);
      maxY = Math.max(maxY, p.cy);
    }
    for (const region of regions) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    }
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

  // Visible viewport rectangle, in flow coordinates -> minimap coordinates.
  const viewTL = layout.toMini(-vx / zoom, -vy / zoom);
  const viewBR = layout.toMini((-vx + paneW) / zoom, (-vy + paneH) / zoom);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    const flow = layout.toFlow(mx, my);
    rf.setCenter(flow.x, flow.y, { zoom: rf.getZoom(), duration: 300 });
  };

  return (
    <div
      className="absolute top-4 z-30 rounded-[12px] border border-[var(--border)] p-2 shadow-[var(--shadow-2)] backdrop-blur-[8px] transition-[right] duration-200"
      style={{
        width: W + 16,
        right: selectedId ? "calc(min(420px, 44vw) + 32px)" : 16,
        background: "var(--minimap-bg)",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        onClick={handleClick}
        className="block cursor-pointer rounded-[6px] bg-[var(--neutral-50)]"
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
              rx={3}
              fill={region.tint}
              stroke={region.border}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.78}
            />
          );
        })}
        {points.map((p) => {
          const { x, y } = layout.toMini(p.cx, p.cy);
          const sel = p.id === selectedId;
          const onRoute = routeSet.has(p.id);
          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r={sel ? 3 : onRoute ? 2.4 : 1.6}
              fill={getKindColor(p.kind)}
              opacity={sel ? 1 : onRoute ? 0.95 : 0.55}
            />
          );
        })}
        <rect
          x={Math.min(viewTL.x, viewBR.x)}
          y={Math.min(viewTL.y, viewBR.y)}
          width={Math.abs(viewBR.x - viewTL.x)}
          height={Math.abs(viewBR.y - viewTL.y)}
          fill="none"
          stroke="var(--neutral-400)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}
