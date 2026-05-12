import { useMemo, type ReactNode } from "react";
import { Lock, LockOpen, Pin } from "lucide-react";
import {
  atlasNodes,
  atlasNodesById,
  computeLearningPath,
  DEFAULT_SELECTED_ID,
  NODE_KIND_META,
  ROUTE_META,
} from "../atlas";
import { useStore } from "../store";
import { MathText } from "../lib/katex";
import type { NodeKind, Relation } from "../types";

const KINDS_IN_DATA: NodeKind[] = Array.from(
  new Set(atlasNodes.map((n) => n.kind)),
) as NodeKind[];

export function Sidebar() {
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const relations = useStore((s) => s.relations);
  const toggleRelation = useStore((s) => s.toggleRelation);
  const showOrphans = useStore((s) => s.showOrphans);
  const setShowOrphans = useStore((s) => s.setShowOrphans);
  const pathTargetId = useStore((s) => s.pathTargetId);
  const setPathTarget = useStore((s) => s.setPathTarget);

  const effectiveTarget = pathTargetId ?? selectedId ?? DEFAULT_SELECTED_ID;
  const targetNode = atlasNodesById.get(effectiveTarget);

  const pathIds = useMemo(
    () => computeLearningPath(effectiveTarget, relations),
    [effectiveTarget, relations],
  );

  const startNode = pathIds.length ? atlasNodesById.get(pathIds[0]) : null;
  const isLocked = pathTargetId !== null;

  return (
    <aside className="left-panel">
      <section className="panel-section legend-heading">
        <div>
          <h2>Filters &amp; Path</h2>
        </div>
      </section>

      <section className="panel-section">
        <SectionLabel>Node Types</SectionLabel>
        <div className="legend-list">
          {KINDS_IN_DATA.map((kind) => {
            const meta = NODE_KIND_META[kind];
            const enabled = kinds.has(kind);
            return (
              <button
                key={kind}
                type="button"
                className={`legend-row legend-toggle${enabled ? "" : " is-off"}`}
                onClick={() => toggleKind(kind)}
                aria-pressed={enabled}
              >
                <span className="legend-swatch" style={{ backgroundColor: meta.color }} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel-section">
        <SectionLabel>Dependency Types</SectionLabel>
        <div className="route-legend">
          {(Object.keys(ROUTE_META) as Relation[]).map((rel) => {
            const meta = ROUTE_META[rel];
            const enabled = relations.has(rel);
            return (
              <button
                key={rel}
                type="button"
                className={`route-row legend-toggle${enabled ? "" : " is-off"}`}
                onClick={() => toggleRelation(rel)}
                aria-pressed={enabled}
              >
                <svg viewBox="0 0 54 12" aria-hidden="true">
                  <path
                    d="M2 6 H52"
                    className={`route-sample route-${rel}`}
                    style={{ stroke: meta.color }}
                  />
                </svg>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        <label className="orphan-toggle">
          <input
            type="checkbox"
            checked={showOrphans}
            onChange={(e) => setShowOrphans(e.target.checked)}
          />
          <span>Show unlinked items</span>
        </label>
      </section>

      <section className="panel-section route-planner">
        <SectionLabel>Route Planner</SectionLabel>
        <p className="planner-caption">
          Build a study path of prerequisites for any concept. Click a node on the map to set the
          target, then lock it to keep the path stable as you explore.
        </p>
        <ConceptField label="From" node={startNode ?? null} />
        <ConceptField label="To" node={targetNode ?? null} />
        <button
          type="button"
          className="primary-action"
          onClick={() => setPathTarget(isLocked ? null : (selectedId ?? null))}
          disabled={!selectedId && !isLocked}
        >
          {isLocked ? (
            <>
              <LockOpen className="h-4 w-4" /> Unlock target
            </>
          ) : (
            <>
              <Pin className="h-4 w-4" /> Lock current as target
            </>
          )}
        </button>
      </section>

      <section className="panel-section suggested-path">
        <div className="path-title-row">
          <SectionLabel>Suggested Path</SectionLabel>
          <span>{pathIds.length} steps</span>
        </div>
        {pathIds.length === 0 ? (
          <p className="empty-state-small">No prerequisites under the current filters.</p>
        ) : (
          <ol>
            {pathIds.map((id, index) => {
              const node = atlasNodesById.get(id);
              if (!node) return null;
              const meta = NODE_KIND_META[node.kind];
              const isTarget = id === effectiveTarget;
              return (
                <li key={id}>
                  <button
                    onClick={() => select(id)}
                    className={isTarget ? "is-target" : ""}
                  >
                    <span className="step-index">{index + 1}</span>
                    <span className="step-id" style={{ color: meta.color }}>
                      {node.shortLabel}
                    </span>
                    <span className="step-title">
                      <MathText text={node.title} />
                    </span>
                    {isTarget && <Lock className="h-3 w-3 step-lock-icon" />}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </aside>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="section-label">{children}</h3>;
}

function ConceptField({ label, node }: { label: string; node: { shortLabel: string; title: string } | null }) {
  return (
    <label className="concept-field">
      <span>{label}</span>
      <div>
        <strong>{node?.shortLabel ?? "—"}</strong>
        <em>{node?.title ?? "Select a concept on the map"}</em>
      </div>
    </label>
  );
}
