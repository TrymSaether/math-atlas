import { useEffect, useMemo } from "react";
import { Background } from "./components/Background";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodePanel } from "./components/NodePanel";
import { CommandPalette } from "./components/CommandPalette";
import { PathPanel } from "./components/PathPanel";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useStore } from "./store";
import { data } from "./data";

export default function App() {
  useKeyboardNav();
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeId;
    root.dataset.colorMode = colorMode;
    root.classList.toggle("dark", colorMode === "dark");
  }, [themeId, colorMode]);

  const visibleCount = useMemo(() => {
    return data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
      if (topics.size && !topics.has(n.topicCluster)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    }).length;
  }, [kinds, topics, search, searchScope]);

  return (
    <div className="atlas-shell relative flex h-screen w-screen flex-col p-3">
      <Background />
      <TopBar />
      <div className="flex min-h-0 flex-1 gap-3">
        <Sidebar visibleCount={visibleCount} />
        <main className="atlas-main relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-ink-950/30">
          <GraphCanvas />
          <NodePanel />
          <PathPanel />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
