import { memo, useEffect, useRef, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { getDomainTone } from "../lib/colors";
import { MathText } from "../lib/katex";
import { CATEGORY_META, categoryOf, kindAbbrev, railBackground, type NodeCategory } from "../lib/nodeCategory";
import { cn, prefersReducedMotion } from "../lib/utils";
import { useStore } from "../store";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "../types";
import type { NodeEmphasis, NodeLOD } from "./GraphCanvas";

interface Data {
  node: TopoNodeT;
  category?: NodeCategory;
  emphasis?: NodeEmphasis;
  lod?: NodeLOD;
  dim?: boolean;
  isSelected?: boolean;
  isRelated?: boolean;
  hasIncoming?: boolean;
  hasOutgoing?: boolean;
  handleColor?: string;
  routePulseDelay?: number;
  routeRunKey?: number;
  routeEndpoint?: "from" | "to";
}

function handleStyle(color?: string): CSSProperties {
  return { "--handle-color": color ?? "var(--edge-ink)" } as CSSProperties;
}

function TopoNodeViewComponent({ data }: NodeProps<Data>) {
  const {
    node,
    dim,
    isSelected,
    isRelated,
    hasIncoming,
    hasOutgoing,
    handleColor,
  } = data;
  const select = useStore((s) => s.select);
  const routeMode = useStore((s) => s.routeMode);
  const pickRoutePoint = useStore((s) => s.pickRoutePoint);
  const activate = () => (routeMode ? pickRoutePoint(node.id) : select(node.id));
  const tone = getDomainTone(node.domain);

  // Route traversal: pulse this node as the path's head passes it.
  const rootRef = useRef<HTMLDivElement>(null);
  const { routePulseDelay, routeRunKey, routeEndpoint } = data;
  useEffect(() => {
    const el = rootRef.current;
    if (!el || routePulseDelay === undefined || prefersReducedMotion()) return;
    const anim = el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }],
      { duration: 380, delay: routePulseDelay, easing: "cubic-bezier(0.22,0.61,0.36,1)" },
    );
    return () => anim.cancel();
  }, [routePulseDelay, routeRunKey]);
  const accented = isSelected || isRelated;
  const emphasis = data.emphasis ?? "normal";
  const category = data.category ?? categoryOf(node.kind);
  const categoryMeta = CATEGORY_META[category];
  const CategoryIcon = categoryMeta.icon;

  const isLandmark = emphasis === "landmark";
  const isMinor = emphasis === "minor";

  const lod = data.lod ?? "near";
  const showMeta = lod === "near" || lod === "mid";
  // At distance the card is just a label — let the title grow and use more lines.
  const titleClass =
    lod === "far"
      ? isLandmark
        ? "text-atlas-card"
        : "text-atlas-brand"
      : isLandmark
        ? "text-ui-body"
        : "text-ui-sm";
  const titleLineClamp = lod === "far" ? 3 : 2;

  return (
    <div
      ref={rootRef}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${KIND_LABEL[node.kind]}: ${node.label}`}
      className={cn(
        "group relative flex min-h-[80px] w-[200px] cursor-pointer flex-col overflow-hidden rounded-[var(--radius-lg)] border px-3 py-2 outline-none transition-[transform,box-shadow,border-color] duration-150",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
        // Hover affordance: a quiet lift + soft elevation, nothing more. Selected
        // nodes own their own shadow below, so the hover shadow only applies at rest.
        "hover:-translate-y-px",
        !isSelected && !routeEndpoint && "hover:shadow-[var(--shadow-2)]",
        dim && "opacity-30",
        isMinor && !accented && !dim && "opacity-[0.82]",
      )}
      style={{
        background: "var(--surface)",
        borderColor: routeEndpoint
          ? "var(--accent)"
          : isSelected
            ? tone.color
            : isRelated
              ? tone.border
              : isLandmark
                ? tone.border
                : "var(--border)",
        borderWidth: routeEndpoint || isSelected || isLandmark ? 1.5 : 1,
        // Selected: domain-hue border + a soft neutral lift, no ring. Related
        // neighbours stay quiet (border tint only) so the focus reads clearly.
        boxShadow: routeEndpoint
          ? "0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)"
          : isSelected
            ? "var(--shadow-2)"
            : undefined,
      }}
    >
      {/* Lane rail — color says which domain, texture says which kind. */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: railBackground(tone.color, categoryMeta.rail),
          opacity: isLandmark || accented ? 1 : 0.55,
        }}
      />

      {hasIncoming && (
        <Handle
          type="target"
          position={Position.Left}
          className="graph-node-handle graph-node-handle-left"
          style={handleStyle(handleColor)}
        />
      )}

      {showMeta && (
        <div className="flex min-w-0 items-center gap-1.5">
          {categoryMeta.glyphFilled ? (
            <span
              className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full"
              style={{ background: tone.color }}
              aria-hidden
            >
              <CategoryIcon
                className="h-[10px] w-[10px]"
                weight="bold"
                style={{ color: "var(--fg-on-color)" }}
              />
            </span>
          ) : (
            <CategoryIcon
              className="h-[13px] w-[13px] shrink-0"
              weight="regular"
              style={{ color: "var(--fg-3)" }}
              aria-hidden
            />
          )}
          {/* Short kind pill (THM / DEF / …) + reference number. */}
          <span
            className="inline-flex h-[18px] shrink-0 items-center rounded-md border px-1.5 text-ui-tiny font-bold uppercase tracking-label-tight"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--fg-2)",
            }}
          >
            {kindAbbrev(node.kind)}
          </span>
          {node.number && (
            <span
              className="min-w-0 truncate font-mono text-ui-caption font-semibold tabular-nums"
              style={{ color: "var(--fg-3)" }}
              title={node.id}
            >
              {node.number}
            </span>
          )}
          {isLandmark && (
            <span
              className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone.color }}
              title="Foundational — many results depend on this"
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden font-semibold leading-[1.28]",
          showMeta ? "mt-1.5" : "my-auto",
          titleClass,
        )}
        style={{
          color: "var(--fg-1)",
          display: "-webkit-box",
          WebkitLineClamp: titleLineClamp,
          WebkitBoxOrient: "vertical",
        }}
      >
        <MathText text={node.label} />
      </div>

      {hasOutgoing && (
        <Handle
          type="source"
          position={Position.Right}
          className="graph-node-handle graph-node-handle-right"
          style={handleStyle(handleColor)}
        />
      )}
    </div>
  );
}

export const TopoNodeView = memo(TopoNodeViewComponent);
