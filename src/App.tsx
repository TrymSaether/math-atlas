import { useMemo } from "react";
import { Background } from "../src/components/Background";
import { Sidebar } from "../src/components/Sidebar";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "../src/components/GraphCanvas";
import { NodePanel } from "../src/components/NodePanel";
import { CommandPalette } from "../src/components/CommandPalette";
import { PathPanel } from "../src/components/PathPanel";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useStore } from "../src/store";
import { loadMap } from "./data";

export default function App() {
  const mapId = useStore((s) => s.mapId);
  const loadedMap = useMemo(() => loadMap(mapId), [mapId]);
  const { data, nodeById, incomingEdgesByNodeId, outgoingEdgesByNodeId } = loadedMap;

  useKeyboardNav(data.nodes);

  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);

  const visibleCount = useMemo(() => {
    return data.nodes.filter((n) => {
      if (kinds.size > 0 && !kinds.has(n.kind)) return false;
      if (topics.size > 0 && !topics.has(n.topicCluster)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText} ${n.explanation}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    }).length;
  }, [data.nodes, kinds, topics, search, searchScope]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden p-4">
      <Background />
      <TopBar map={data} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Sidebar data={data} visibleCount={visibleCount} availableKinds={loadedMap.kinds} availableRelations={loadedMap.relations} />
        <main className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--canvas-bg)] shadow-[var(--shadow-1)]">
          <GraphCanvas data={data} />
          <NodePanel nodeById={nodeById} incomingEdgesByNodeId={incomingEdgesByNodeId} outgoingEdgesByNodeId={outgoingEdgesByNodeId} />
          <PathPanel data={data} nodeById={nodeById} />
        </main>
      </div>
      <CommandPalette data={data} />
    </div>
  );
}
