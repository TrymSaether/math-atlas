import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, X } from "lucide-react";
import { activePathIds, atlasNodesById, NODE_KIND_META, ROUTE_META } from "../atlas";
import { useStore } from "../store";
import { MathText } from "../lib/katex";

export function Sidebar() {
  const select = useStore((s) => s.select);

  return (
    <aside className="left-panel">
      <section className="panel-section legend-heading">
        <div>
          <h2>Legend</h2>
        </div>
      </section>

      <section className="panel-section">
        <SectionLabel>Node Types</SectionLabel>
        <div className="legend-list">
          {Object.entries(NODE_KIND_META).map(([kind, meta]) => (
            <div key={kind} className="legend-row">
              <span className="legend-swatch" style={{ backgroundColor: meta.color }} />
              <span>{meta.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <SectionLabel>Dependency Types</SectionLabel>
        <div className="route-legend">
          {Object.entries(ROUTE_META).map(([kind, meta]) => (
            <div key={kind} className="route-row">
              <svg viewBox="0 0 54 12" aria-hidden="true">
                <path
                  d="M2 6 H52"
                  className={`route-sample route-${kind}`}
                  style={{ stroke: meta.color }}
                />
              </svg>
              <span>{meta.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section route-planner">
        <SectionLabel>Route Planner</SectionLabel>
        <p className="planner-caption">Find a path between concepts</p>
        <ConceptField label="From" id="D2" title="Topological Space" />
        <ArrowDown className="planner-arrow h-5 w-5" />
        <ConceptField label="To" id="P10" title="Schauder Fixed Point Proposition" />
        <button className="primary-action" onClick={() => select("P10")}>
          Find Path
        </button>
      </section>

      <section className="panel-section suggested-path">
        <div className="path-title-row">
          <SectionLabel>Suggested Path</SectionLabel>
          <span>{activePathIds.length} steps</span>
        </div>
        <ol>
          {activePathIds.map((id, index) => {
            const node = atlasNodesById.get(id);
            if (!node) return null;
            const meta = NODE_KIND_META[node.kind];
            return (
              <li key={id}>
                <button onClick={() => select(id)}>
                  <span className="step-index">{index + 1}</span>
                  <span className="step-id" style={{ color: meta.color }}>
                    {id}
                  </span>
                  <span className="step-title">
                    <MathText text={node.title} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <button className="secondary-action">
        View Full Path <ArrowRight className="h-4 w-4" />
      </button>
    </aside>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="section-label">{children}</h3>;
}

function ConceptField({ label, id, title }: { label: string; id: string; title: string }) {
  return (
    <label className="concept-field">
      <span>{label}</span>
      <div>
        <strong>{id}</strong>
        <em>{title}</em>
        <X className="h-3.5 w-3.5" />
      </div>
    </label>
  );
}
