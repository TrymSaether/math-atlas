import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { atlasNodes, atlasNodesById, DEFAULT_SELECTED_ID, NODE_KIND_META } from "../atlas";
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
          <ChipList ids={node.dependencies} />
        </DetailSection>

        <DetailSection title="Illustrated By">
          <ChipList ids={node.illustratedBy} />
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

function ChipList({ ids }: { ids: string[] }) {
  const select = useStore((s) => s.select);

  if (ids.length === 0) {
    return <p className="empty-state">No linked stations.</p>;
  }

  return (
    <div className="chip-list">
      {ids.map((id) => {
        const node = atlasNodesById.get(id);
        if (!node) return null;
        const meta = NODE_KIND_META[node.kind];
        return (
          <button
            key={id}
            className="dependency-chip"
            style={{
              borderColor: colorMix(meta.color, 0.28),
              color: meta.color,
              backgroundColor: colorMix(meta.color, 0.08),
            }}
            onClick={() => select(id)}
          >
            <strong>{node.shortLabel}</strong>
            <span>
              <MathText text={node.title} />
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
