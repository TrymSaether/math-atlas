import { useEffect, useRef, useState } from "react";
import { dist, type SandboxObject, type ToolId } from "./types";

const MATH = { xMin: -12, xMax: 12, yMin: -8, yMax: 8 };

interface PendingPoint {
  x: number;
  y: number;
}

export function SandboxCanvas({
  objects,
  tool,
  pending,
  onPlace,
  showLabels,
}: {
  objects: SandboxObject[];
  tool: ToolId;
  pending: PendingPoint | null;
  onPlace: (x: number, y: number) => void;
  showLabels: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const baseScale = Math.min(
    size.w / (MATH.xMax - MATH.xMin),
    size.h / (MATH.yMax - MATH.yMin),
  );
  const scale = baseScale * zoom;
  const ox = size.w / 2 + pan.x;
  const oy = size.h / 2 + pan.y;
  const mx = (x: number) => ox + x * scale;
  const my = (y: number) => oy - y * scale;
  const toMathX = (px: number) => (px - ox) / scale;
  const toMathY = (py: number) => (oy - py) / scale;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || tool === "select") return;
    const rect = ref.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    onPlace(toMathX(px), toMathY(py));
  };

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 0.94 : 1.06;
    const next = Math.max(0.4, Math.min(4, zoom * factor));
    const rect = ref.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = cx - ox;
    const dy = cy - oy;
    const ratio = next / zoom;
    setPan({ x: pan.x - dx * (ratio - 1), y: pan.y - dy * (ratio - 1) });
    setZoom(next);
  };

  // Gridlines (every 1 unit, major every 5).
  const xs: number[] = [];
  for (let v = Math.ceil(MATH.xMin); v <= Math.floor(MATH.xMax); v++) xs.push(v);
  const ys: number[] = [];
  for (let v = Math.ceil(MATH.yMin); v <= Math.floor(MATH.yMax); v++) ys.push(v);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onWheel={onWheel}
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "var(--bg)",
        cursor: tool === "select" ? "grab" : "crosshair",
      }}
    >
      <svg width={size.w} height={size.h} className="absolute inset-0 block">
        {/* grid */}
        <g pointerEvents="none">
          {xs.map((v) => {
            const px = mx(v);
            if (px < -2 || px > size.w + 2) return null;
            const major = v % 5 === 0;
            return (
              <line
                key={`x${v}`}
                x1={px}
                x2={px}
                y1={0}
                y2={size.h}
                stroke={major ? "var(--border-strong)" : "var(--surface-2)"}
                strokeWidth={major ? 1 : 0.75}
              />
            );
          })}
          {ys.map((v) => {
            const py = my(v);
            if (py < -2 || py > size.h + 2) return null;
            const major = v % 5 === 0;
            return (
              <line
                key={`y${v}`}
                x1={0}
                x2={size.w}
                y1={py}
                y2={py}
                stroke={major ? "var(--border-strong)" : "var(--surface-2)"}
                strokeWidth={major ? 1 : 0.75}
              />
            );
          })}
          {/* axes */}
          <line x1={0} x2={size.w} y1={my(0)} y2={my(0)} stroke="var(--fg-3)" strokeWidth={1.3} />
          <line x1={mx(0)} x2={mx(0)} y1={0} y2={size.h} stroke="var(--fg-3)" strokeWidth={1.3} />
          {showLabels &&
            xs
              .filter((v) => v % 5 === 0 && v !== 0)
              .map((v) => (
                <text key={`xt${v}`} x={mx(v)} y={my(0) + 14} textAnchor="middle" fontSize={10} fill="var(--fg-3)" style={{ fontFamily: "var(--font-mono)" }}>
                  {v}
                </text>
              ))}
          {showLabels &&
            ys
              .filter((v) => v % 5 === 0 && v !== 0)
              .map((v) => (
                <text key={`yt${v}`} x={mx(0) + 6} y={my(v) + 3} fontSize={10} fill="var(--fg-3)" style={{ fontFamily: "var(--font-mono)" }}>
                  {v}
                </text>
              ))}
        </g>

        <defs>
          <marker id="sbx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--blue)" />
          </marker>
        </defs>

        {/* objects */}
        <g>
          {objects.map((o) => (
            <ObjectGlyph key={o.id} o={o} mx={mx} my={my} scale={scale} showLabels={showLabels} />
          ))}
        </g>

        {/* pending first endpoint for two-click tools */}
        {pending && (
          <circle cx={mx(pending.x)} cy={my(pending.y)} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.5} />
        )}
      </svg>
    </div>
  );
}

function ObjectGlyph({
  o,
  mx,
  my,
  scale,
  showLabels,
}: {
  o: SandboxObject;
  mx: (x: number) => number;
  my: (y: number) => number;
  scale: number;
  showLabels: boolean;
}) {
  switch (o.kind) {
    case "point":
      return (
        <g>
          <circle cx={mx(o.x)} cy={my(o.y)} r={5} fill="var(--blue)" stroke="var(--bg)" strokeWidth={2} />
          {showLabels && (
            <text x={mx(o.x) + 9} y={my(o.y) - 5} fontSize={12} fill="var(--blue)" fontStyle="italic" style={{ fontFamily: "var(--font-math)" }}>
              p
            </text>
          )}
        </g>
      );
    case "basepoint":
      return <Star cx={mx(o.x)} cy={my(o.y)} label={showLabels ? "x₀" : undefined} />;
    case "openset":
      return (
        <g>
          <circle
            cx={mx(o.cx)}
            cy={my(o.cy)}
            r={o.r * scale}
            fill="color-mix(in srgb, var(--purple) 16%, transparent)"
            stroke="var(--purple)"
            strokeWidth={1.4}
          />
          {showLabels && (
            <text x={mx(o.cx) + o.r * scale * 0.55} y={my(o.cy) - o.r * scale * 0.55} fontSize={13} fill="var(--purple)" fontStyle="italic" style={{ fontFamily: "var(--font-math)" }}>
              {o.label}
            </text>
          )}
        </g>
      );
    case "path":
      return (
        <g>
          <path
            d={`M ${mx(o.x1)} ${my(o.y1)} Q ${mx((o.x1 + o.x2) / 2)} ${my(Math.max(o.y1, o.y2) + 2.2)}, ${mx(o.x2)} ${my(o.y2)}`}
            stroke="var(--blue)"
            strokeWidth={2.25}
            fill="none"
            markerEnd="url(#sbx-arrow)"
          />
          <circle cx={mx(o.x1)} cy={my(o.y1)} r={4} fill="var(--blue)" stroke="var(--bg)" strokeWidth={1.5} />
        </g>
      );
    case "loop":
      return (
        <g>
          <circle cx={mx(o.cx)} cy={my(o.cy)} r={o.r * scale} fill="none" stroke="var(--blue)" strokeWidth={2.25} markerEnd="url(#sbx-arrow)" />
          <Star cx={mx(o.cx)} cy={my(o.cy + o.r)} label={undefined} small />
          {showLabels && (
            <text x={mx(o.cx) + o.r * scale * 0.7} y={my(o.cy) - o.r * scale * 0.7} fontSize={13} fill="var(--blue)" fontStyle="italic" style={{ fontFamily: "var(--font-math)" }}>
              γ
            </text>
          )}
        </g>
      );
    case "cover": {
      const r = 1.9 * scale;
      const off = 1.1 * scale;
      return (
        <g fill="color-mix(in srgb, var(--teal) 14%, transparent)" stroke="var(--teal)" strokeWidth={1.4}>
          <circle cx={mx(o.cx) - off} cy={my(o.cy) + off} r={r} />
          <circle cx={mx(o.cx) + off} cy={my(o.cy) + off} r={r} />
          <circle cx={mx(o.cx)} cy={my(o.cy) - off} r={r} />
        </g>
      );
    }
    case "quotient": {
      const cx = mx(o.cx);
      const cy = my(o.cy);
      const members = [
        [cx - 34, cy - 28],
        [cx + 36, cy - 26],
        [cx - 8, cy + 38],
      ];
      return (
        <g>
          <g stroke="var(--pink)" strokeWidth={1.2} strokeDasharray="2 3" fill="none">
            {members.map(([x, y], i) => (
              <line key={i} x1={cx} y1={cy} x2={x} y2={y} />
            ))}
          </g>
          {members.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill="var(--pink)" />
          ))}
          <circle cx={cx} cy={cy} r={5.5} fill="var(--pink)" stroke="var(--bg)" strokeWidth={1.5} />
          {showLabels && (
            <text x={cx + 9} y={cy - 6} fontSize={12} fill="var(--pink)" fontStyle="italic" style={{ fontFamily: "var(--font-math)" }}>
              [p]
            </text>
          )}
        </g>
      );
    }
    case "measure": {
      const midx = (mx(o.x1) + mx(o.x2)) / 2;
      const midy = (my(o.y1) + my(o.y2)) / 2;
      const d = dist(o.x1, o.y1, o.x2, o.y2);
      return (
        <g>
          <line x1={mx(o.x1)} y1={my(o.y1)} x2={mx(o.x2)} y2={my(o.y2)} stroke="var(--orange)" strokeWidth={1.4} strokeDasharray="4 3" />
          <circle cx={mx(o.x1)} cy={my(o.y1)} r={4} fill="var(--orange)" stroke="var(--bg)" strokeWidth={1.5} />
          <circle cx={mx(o.x2)} cy={my(o.y2)} r={4} fill="var(--orange)" stroke="var(--bg)" strokeWidth={1.5} />
          <g transform={`translate(${midx - 26}, ${midy - 11})`}>
            <rect width={52} height={22} rx={4} fill="var(--surface-2)" stroke="var(--orange)" strokeWidth={1} />
            <text x={26} y={15} textAnchor="middle" fontSize={11} fill="var(--orange)" style={{ fontFamily: "var(--font-mono)" }}>
              d = {d.toFixed(2)}
            </text>
          </g>
        </g>
      );
    }
    default:
      return null;
  }
}

function Star({ cx, cy, label, small }: { cx: number; cy: number; label?: string; small?: boolean }) {
  const s = small ? 0.8 : 1;
  return (
    <g>
      <path
        d="M0 -10 L3 -3 L10 -2 L5 3 L7 11 L0 7 L-7 11 L-5 3 L-10 -2 L-3 -3 z"
        transform={`translate(${cx} ${cy}) scale(${s})`}
        fill="var(--gold)"
        stroke="var(--bg)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {label && (
        <text x={cx + 11} y={cy + 6} fontSize={12} fill="var(--gold)" fontStyle="italic" style={{ fontFamily: "var(--font-math)" }}>
          {label}
        </text>
      )}
    </g>
  );
}
