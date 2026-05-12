import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import type { TopoEdge as TopoEdgeT } from "../types";
import { useStore } from "../store";
import { getThemePalette } from "../themes";

interface Data {
  edge: TopoEdgeT;
  dim?: boolean;
  highlight?: boolean;
}

export function TopoEdgeView(props: EdgeProps<Data>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const palette = getThemePalette(themeId, colorMode);
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const e = data?.edge;
  const color = e ? palette.routeColors[e.relation] : palette.routeColors.statement;
  // Statement edges are the spine of the dependency graph — keep them
  // readable. Proof and illustration links are supporting context, so they
  // fade into the background unless they're part of the selected path.
  const baseOpacity =
    e?.relation === "statement" ? 0.4 : e?.relation === "proof" ? 0.18 : 0.14;
  const baseWidth = e?.relation === "statement" ? 1.1 : 0.85;
  const opacity = data?.dim ? 0.05 : data?.highlight ? 0.95 : baseOpacity;
  const width = data?.highlight ? 2.6 : baseWidth;
  const dash = e?.relation === "proof" ? "5 4" : e?.relation === "illustration" ? "1 4" : undefined;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: width,
          strokeOpacity: opacity,
          strokeDasharray: dash,
          filter: data?.highlight ? `drop-shadow(0 0 6px ${color})` : undefined,
        }}
      />
      {data?.highlight && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              pointerEvents: "none",
            }}
            className="rounded-full border border-white/15 bg-ink-900/80 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/80 backdrop-blur"
          >
            {e?.relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
