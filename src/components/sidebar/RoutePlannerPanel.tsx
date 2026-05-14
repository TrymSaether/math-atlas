import { useMemo } from "react";
import { Route, X, BookmarkPlus, RotateCcw } from "lucide-react";
import { Button, Section } from "../ui";
import { useStore } from "../../store";
import { findRoute } from "../../lib/route";
import type { GraphData, GraphNode } from "../../types";

function RouteRow({
  label,
  node,
  accent,
  onClear,
}: {
  label: string;
  node: GraphNode | null;
  accent: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">{label}</div>
        <div className="truncate text-[13px] font-semibold text-[var(--text)]">{node ? node.title : "—"}</div>
      </div>
      {node && (
        <button onClick={onClear} aria-label={`Clear ${label}`} className="rounded p-1 text-[var(--faint)] hover:text-[var(--text-soft)]">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function RoutePlannerPanel({ data }: { data: GraphData }) {
  const routeFrom = useStore((s) => s.routeFrom);
  const routeTo = useStore((s) => s.routeTo);
  const routePlanned = useStore((s) => s.routePlanned);
  const setRouteFrom = useStore((s) => s.setRouteFrom);
  const setRouteTo = useStore((s) => s.setRouteTo);
  const planRoute = useStore((s) => s.planRoute);
  const resetRoute = useStore((s) => s.resetRoute);
  const addSavedPath = useStore((s) => s.addSavedPath);

  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);
  const fromNode = routeFrom ? nodeById.get(routeFrom) ?? null : null;
  const toNode = routeTo ? nodeById.get(routeTo) ?? null : null;

  const route = useMemo(
    () => (routePlanned ? findRoute(routeFrom, routeTo, data.edges) : null),
    [routePlanned, routeFrom, routeTo, data.edges]
  );

  const canPlan = Boolean(routeFrom && routeTo);

  return (
    <Section
      title="Route Planner"
      icon={<Route className="h-3 w-3" />}
      aside={
        routePlanned ? (
          <button onClick={resetRoute} className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--text-soft)]">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        ) : null
      }
    >
      <div className="space-y-2">
        <RouteRow label="From" node={fromNode} accent="var(--blue)" onClear={() => setRouteFrom(null)} />
        <RouteRow label="To" node={toNode} accent="var(--teal)" onClear={() => setRouteTo(null)} />

        <Button variant="primary" size="md" onClick={planRoute} disabled={!canPlan} className="w-full justify-center">
          <Route className="h-3.5 w-3.5" />
          {routePlanned ? "Route Drawn" : "Plan Route"}
        </Button>

        {routePlanned && route && route.length > 1 && (
          <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[11px] text-[var(--muted)]">
            <span className="text-[var(--text-soft)]">{route.length}</span> stops ·{" "}
            <span className="text-[var(--text-soft)]">{route.length - 1}</span> connections
          </div>
        )}
        {routePlanned && route === null && (
          <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[11px] text-[var(--muted)]">
            No route connects these concepts in the current view.
          </div>
        )}

        {routePlanned && route && route.length > 1 && fromNode && toNode && (
          <Button
            variant="quiet"
            size="sm"
            className="w-full justify-center"
            onClick={() =>
              addSavedPath({
                title: `${fromNode.title} → ${toNode.title}`,
                fromId: fromNode.id,
                toId: toNode.id,
                nodeIds: route,
              })
            }
          >
            <BookmarkPlus className="h-3.5 w-3.5" /> Save Path
          </Button>
        )}

        <p className="px-0.5 text-[10px] leading-relaxed text-[var(--faint)]">
          Set endpoints from a concept's detail panel, or right-click a node to set it as the destination.
        </p>
      </div>
    </Section>
  );
}
