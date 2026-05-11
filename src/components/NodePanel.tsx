import type { ReactNode } from "react";
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Star } from "lucide-react";
import { atlasNodesById, NODE_KIND_META } from "../atlas";
import { MathText } from "../lib/katex";
import { useStore } from "../store";

export function NodePanel() {
  const selectedId = useStore((s) => s.selectedId) ?? "P10";
  const node = atlasNodesById.get(selectedId) ?? atlasNodesById.get("P10")!;
  const meta = NODE_KIND_META[node.kind];

  return (
    <aside className="right-panel">
      <header className="detail-nav">
        <button>
          <ChevronLeft className="h-4 w-4" />
          Back to map
        </button>
        <div>
          <ChevronLeft className="h-4 w-4" />
          <span>7 of 48</span>
          <ChevronRight className="h-4 w-4" />
          <MoreVertical className="h-4 w-4" />
        </div>
      </header>

      <div className="detail-content">
        <div className="detail-actions">
          <div className="badge-row">
            <span className="kind-badge" style={{ backgroundColor: meta.color }}>
              {meta.label.toUpperCase()}
            </span>
            <span className="id-badge">{node.id}</span>
          </div>
          <div className="icon-actions">
            <button aria-label="Star concept">
              <Star className="h-4 w-4" />
            </button>
            <button aria-label="Bookmark concept">
              <Bookmark className="h-4 w-4" />
            </button>
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

        <DetailSection title="Proof Sketch">
          <p>
            <MathText text={node.proofSketch} />
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
            <strong>{id}</strong>
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
