import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  atlasNodes,
  atlasNodesById,
  DEFAULT_SELECTED_ID,
  NODE_KIND_META,
  ROUTE_META,
  type AtlasLink,
} from "../atlas";
import { MathText } from "../lib/katex";
import { useStore } from "../store";

export function NodePanel() {
  const selectedId = useStore((s) => s.selectedId) ?? DEFAULT_SELECTED_ID;
  const select = useStore((s) => s.select);
  const node = atlasNodesById.get(selectedId) ?? atlasNodesById.get(DEFAULT_SELECTED_ID);
  if (!node) return <aside className="right-panel" />;
  const meta = NODE_KIND_META[node.kind];
  const currentIdx = atlasNodes.findIndex((n) => n.id === node.id);
  const step = (delta: number) => {
    const next = (currentIdx + delta + atlasNodes.length) % atlasNodes.length;
    select(atlasNodes[next].id);
  };

  return (
    <aside className="right-panel">
      <header className="detail-nav">
        <div className="detail-counter">
          <button onClick={() => step(-1)} aria-label="Previous concept">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>{currentIdx + 1} of {atlasNodes.length}</span>
          <button onClick={() => step(1)} aria-label="Next concept">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="detail-content">
        <div className="detail-actions">
          <div className="badge-row">
            <span className="kind-badge" style={{ backgroundColor: meta.color }}>
              {meta.label.toUpperCase()}
            </span>
            <span className="id-badge">{node.shortLabel}</span>
          </div>
        </div>

        <h1>
          <MathText text={node.title} />
        </h1>
        <span className="topic-pill">{node.cluster}</span>
        {node.semanticLayer ? <span className="topic-pill ml-2">{node.semanticLayer}</span> : null}
        {node.semanticRole ? <span className="topic-pill ml-2">{node.semanticRole}</span> : null}
        <p className="detail-description">
          <MathText text={node.description} />
        </p>

        <Divider />

        <DetailSection title="Formal Statement">
          <p className="math-note">
            <MathText text={node.formalStatement} />
          </p>
        </DetailSection>

        <DetailSection title="Depends On">
          <LinkList links={node.dependencies} />
        </DetailSection>

        <DetailSection title="Used By">
          <LinkList links={node.dependents} />
        </DetailSection>

        <DetailSection title="Illustrated By">
          <LinkList links={node.illustratedBy} />
        </DetailSection>

        <Divider />

        <section className="notes-section">
          <button>
            <span>Notes</span>
            <strong>{node.notes.length}</strong>
            <ChevronDown className="ml-auto h-4 w-4" />
          </button>
          <div>
            {node.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function LinkList({ links }: { links: AtlasLink[] }) {
  const select = useStore((s) => s.select);

  if (links.length === 0) {
    return <p className="empty-state">No linked stations.</p>;
  }

  return (
    <div className="chip-list">
      {links.map((link) => {
        const node = atlasNodesById.get(link.nodeId);
        if (!node) return null;
        const meta = NODE_KIND_META[node.kind];
        const routeMeta = ROUTE_META[link.relation];
        const label = link.semanticRelation ?? link.label ?? routeMeta.label;
        return (
          <button
            key={link.id}
            className="dependency-chip"
            title={link.rationale}
            style={{
              alignItems: "flex-start",
              borderColor: colorMix(meta.color, link.needsHumanReview ? 0.48 : 0.28),
              color: meta.color,
              backgroundColor: colorMix(meta.color, link.needsHumanReview ? 0.12 : 0.08),
              display: "grid",
              gap: 3,
              height: "auto",
              padding: "7px 8px",
              textAlign: "left",
            }}
            onClick={() => select(link.nodeId)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <strong>{node.shortLabel}</strong>
              <span>
                <MathText text={node.title} />
              </span>
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#5d6670",
                fontSize: 10,
                fontWeight: 650,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: routeMeta.color }}>{label}</span>
              <span>{Math.round(link.confidence * 100)}%</span>
              {link.needsHumanReview ? <span>Review</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Divider() {
  return <div className="detail-divider" />;
}

function colorMix(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
