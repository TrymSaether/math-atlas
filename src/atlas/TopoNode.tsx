import { memo, useEffect, useRef, type CSSProperties } from "react";
import { Scroll, FlaskConical, LineChart } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { getDomainTone } from "./colors";
import { MathText } from "@/shared/math";
import { CATEGORY_META, categoryOf, kindAbbrev, railBackground, type NodeCategory } from "@shared/maps/nodeCategory";
import { CATEGORY_ICON, KIND_ICON_OVERRIDE } from "./nodeCategoryIcons";
import { cn, prefersReducedMotion } from "@/shared/cn";
import { useStore } from "@/app/store";
import { KIND_LABEL, type TopoNode as TopoNodeT } from "@/maps/types";
import { hasNodeVisual } from "@/study/nodeVisualModel";
import type { NodeEmphasis, NodeLOD } from "./GraphCanvas";

/**
 * Compact "what's inside" affordance: muted glyphs flagging which rich content a
 * concept carries — a worked proof, a worked example, an interactive figure — so
 * the depth of a node reads from the card without opening it. Near LOD only.
 */
function RichnessGlyphs({ node }: { node: TopoNodeT }) {
  const hasProof = (node.proof?.steps?.length ?? 0) > 0;
  const hasExample = node.examples.length > 0;
  const hasFigure = hasNodeVisual(node);
  if (!hasProof && !hasExample && !hasFigure) return null;
  return (
    <span className="flex shrink-0 items-center gap-1" style={{ color: "var(--muted-foreground)" }} aria-hidden>
      {hasProof && <Scroll className="h-3 w-3" />}
      {hasExample && <FlaskConical className="h-3 w-3" />}
      {hasFigure && <LineChart className="h-3 w-3" />}
    </span>
  );
}

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
  [key: string]: unknown;
}

function handleStyle(color?: string): CSSProperties {
  return { "--handle-color": color ?? "var(--edge-ink)" } as CSSProperties;
}

const HANDLE_SIDES = [
  { id: "left", position: Position.Left },
  { id: "right", position: Position.Right },
  { id: "top", position: Position.Top },
  { id: "bottom", position: Position.Bottom },
] as const;

function TopoNodeViewComponent({ data }: NodeProps<Node<Data>>) {
  const { node, dim, isSelected, isRelated, hasIncoming, hasOutgoing, handleColor } = data;
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
    const anim = el.animate([{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }], {
      duration: 380,
      delay: routePulseDelay,
      easing: "cubic-bezier(0.22,0.61,0.36,1)",
    });
    return () => anim.cancel();
  }, [routePulseDelay, routeRunKey]);
  const accented = isSelected || isRelated;
  const emphasis = data.emphasis ?? "normal";
  const category = data.category ?? categoryOf(node.kind);
  const categoryMeta = CATEGORY_META[category];
  // Per-kind glyph override (counterexamples read as "fails", not the example
  // flask) falling back to the category icon — both member lookups so no
  // component is "created" during render.
  const CategoryIcon = KIND_ICON_OVERRIDE[node.kind] ?? CATEGORY_ICON[category];

  const isLandmark = emphasis === "landmark";
  const isMinor = emphasis === "minor";

  const lod = data.lod ?? "near";
  const showMeta = lod === "near" || lod === "mid";
  // At distance the card is just a label — let the title grow and use more lines.
  const titleClass =
    lod === "far" ? (isLandmark ? "text-title-3" : "text-title-3") : isLandmark ? "text-body" : "text-footnote";
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
        "focus-visible:ring-2 focus-visible:ring-[color:color-mix(in srgb, var(--primary) 34%, var(--card))] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
        // Hover affordance: a quiet lift + soft elevation, nothing more. Selected
        // nodes own their own shadow below, so the hover shadow only applies at rest.
        "hover:-translate-y-px",
        !isSelected && !routeEndpoint && "hover:shadow-[var(--shadow-e2)]",
        dim && "opacity-30",
        isMinor && !accented && !dim && "opacity-[0.82]",
      )}
      style={{
        background: "var(--card)",
        borderColor: routeEndpoint
          ? "var(--primary)"
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
          ? "0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent)"
          : isSelected
            ? "var(--shadow-e2)"
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

      {hasIncoming &&
        HANDLE_SIDES.map((side) => (
          <Handle
            key={`target-${side.id}`}
            id={`target-${side.id}`}
            type="target"
            position={side.position}
            className={`graph-node-handle graph-node-handle-${side.id}`}
            style={handleStyle(handleColor)}
          />
        ))}

      {showMeta && (
        <div className="flex min-w-0 items-center gap-1.5">
          {categoryMeta.glyphFilled ? (
            <span
              className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full"
              style={{ background: tone.color }}
              aria-hidden
            >
              <CategoryIcon className="h-[10px] w-[10px]" style={{ color: "var(--primary-foreground)" }} />
            </span>
          ) : (
            <CategoryIcon
              className="h-[13px] w-[13px] shrink-0"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
          )}
          {/* Precise kind (Thm / Lem / …) + reference number. The icon already
              carries the category; this word disambiguates within it, told in
              the same calm title-case voice as the reading vocabulary rather
              than a loud bordered, ALL-CAPS chip. */}
          <span
            className="shrink-0 text-caption-2 font-semibold tracking-tight"
            style={{ color: "var(--muted-foreground)" }}
          >
            {kindAbbrev(node.kind)}
          </span>
          {node.number && (
            <span
              className="min-w-0 truncate font-mono text-caption-1 font-semibold tabular-nums"
              style={{ color: "var(--muted-foreground)" }}
              title={node.id}
            >
              {node.number}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {lod === "near" && <RichnessGlyphs node={node} />}
            {isLandmark && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: tone.color }}
                title="Foundational — many results depend on this"
              />
            )}
          </span>
        </div>
      )}

      <div
        className={cn("overflow-hidden font-semibold leading-[1.28]", showMeta ? "mt-1.5" : "my-auto", titleClass)}
        style={{
          color: "var(--foreground)",
          display: "-webkit-box",
          WebkitLineClamp: titleLineClamp,
          WebkitBoxOrient: "vertical",
        }}
      >
        <MathText text={node.label} />
      </div>

      {hasOutgoing &&
        HANDLE_SIDES.map((side) => (
          <Handle
            key={`source-${side.id}`}
            id={`source-${side.id}`}
            type="source"
            position={side.position}
            className={`graph-node-handle graph-node-handle-${side.id}`}
            style={handleStyle(handleColor)}
          />
        ))}
    </div>
  );
}

export const TopoNodeView = memo(TopoNodeViewComponent);
