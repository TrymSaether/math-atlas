import { motion } from "framer-motion";
import { Panel, Badge } from "./ui";
import { type GraphData } from "../types";
import { SearchPanel } from "./sidebar/SearchPanel";
import { ViewModePanel } from "./sidebar/ViewModePanel";
import { HighlightPanel } from "./sidebar/HighlightPanel";
import { KindFilterPanel, RelationFilterPanel, TopicFilterPanel } from "./sidebar/FilterPanels";

export function Sidebar({
  data,
  visibleCount,
  availableKinds,
  availableRelations,
}: {
  data: GraphData;
  visibleCount: number;
  availableKinds: string[];
  availableRelations: string[];
}) {
  const topics = Array.from(new Set(data.nodes.map((n) => n.topicCluster).filter(Boolean))).sort();
  const topicCounts = Object.fromEntries(topics.map((t) => [t, data.nodes.filter((n) => n.topicCluster === t).length]));
  const kindCounts = Object.fromEntries(availableKinds.map((k) => [k, data.nodes.filter((n) => n.kind === k).length]));

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className="h-full w-[320px] shrink-0"
    >
      <Panel className="flex h-full flex-col overflow-hidden">
        <header className="border-b border-[var(--border-soft)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-sm font-semibold text-[var(--text)]">Explore</div>
              <div className="mt-1 text-xs leading-relaxed text-[var(--muted)]">Search, filter, and change the graph view.</div>
            </div>
            <Badge tone="cyan">{visibleCount}</Badge>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <SearchPanel visibleCount={visibleCount} totalCount={data.nodes.length} />
          <ViewModePanel />
          <HighlightPanel />
          <KindFilterPanel availableKinds={availableKinds} counts={kindCounts} />
          <RelationFilterPanel availableRelations={availableRelations} />
          <TopicFilterPanel data={data} topics={topics} topicCounts={topicCounts} />
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--border-soft)] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          <span>{data.nodes.length} concepts</span>
          <span>{data.edges.length} links</span>
        </footer>
      </Panel>
    </motion.aside>
  );
}
