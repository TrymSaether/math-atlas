import { Compass, ArrowRight } from "lucide-react";
import { Section } from "../ui";
import { SearchPanel } from "../sidebar/SearchPanel";
import { SavedPathsPanel } from "../sidebar/SavedPathsPanel";
import { useStore } from "../../store";
import { suggestedStarts } from "../../lib/suggestedStarts";
import { MathText } from "../../lib/katex";
import type { LoadedMap } from "../../data/loadMap";
import { getKindAbbrev } from "../../lib/kindStyle";

export function ExploreSection({ loaded }: { loaded: LoadedMap }) {
  const { data } = loaded;
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  const visibleCount = data.nodes.length;
  const starts = suggestedStarts(loaded);

  return (
    <div className="space-y-5">
      {!selectedId && starts.length > 0 && (
        <Section title="Start here" icon={<Compass className="h-3 w-3" />}>
          <p className="text-[11px] leading-relaxed text-[var(--muted)]">
            Concepts at the foot of the dependency tree — good entry points.
          </p>
          <ul className="mt-2 space-y-1.5">
            {starts.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => select(node.id)}
                  className={`kind-${node.kind} group flex w-full items-start justify-between gap-2 rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-left transition hover:border-[rgba(var(--c),0.4)] hover:bg-[var(--surface-hover)]`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-[var(--text)]">
                      <MathText text={node.title} />
                    </span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-[0.08em] text-[rgba(var(--c),1)]">
                      {getKindAbbrev(node.kind)} · {node.topicCluster}
                    </span>
                  </span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--faint)] transition group-hover:text-[var(--text-soft)]" />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <SearchPanel visibleCount={visibleCount} totalCount={data.nodes.length} />

      <div className="border-t border-[var(--border-soft)]" />

      <SavedPathsPanel data={data} />
    </div>
  );
}
