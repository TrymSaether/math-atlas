import { useMemo } from "react";
import { motion } from "framer-motion";
import { Panel, Badge } from "./ui";
import type { GraphData } from "../types";
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
  const { topics, topicCounts, kindCounts } = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    const kindCounts: Record<string, number> = {};
    const firstSeen = new Map<string, number>();

    data.nodes.forEach((node, index) => {
      topicCounts[node.topicCluster] = (topicCounts[node.topicCluster] ?? 0) + 1;
      kindCounts[node.kind] = (kindCounts[node.kind] ?? 0) + 1;
      if (!firstSeen.has(node.topicCluster)) firstSeen.set(node.topicCluster, index);
    });

    const topics = Object.keys(topicCounts).sort((a, b) => (firstSeen.get(a) ?? 0) - (firstSeen.get(b) ?? 0));
    return { topics, topicCounts, kindCounts };
  }, [data.nodes]);

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-[320px] shrink-0"
    >
      <Panel className="flex h-full flex-col overflow-hidden">
        <header className="border-b border-white/8 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-sm font-semibold text-white/88">Explore</div>
              <div className="mt-1 text-xs leading-relaxed text-white/42">Search, filter, and change the graph view.</div>
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

        <footer className="flex items-center justify-between border-t border-white/8 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/34">
          <span>{data.nodes.length} concepts</span>
          <span>{data.edges.length} links</span>
        </footer>
      </Panel>
    </motion.aside>
  );
}
