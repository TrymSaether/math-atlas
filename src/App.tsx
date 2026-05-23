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

export default function App() {
  useKeyboardNav();
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const loadingMapId = useStore((s) => s.loadingMapId);
  const mapError = useStore((s) => s.mapError);
  const ensureMapLoaded = useStore((s) => s.ensureMapLoaded);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const search = useStore((s) => s.search).toLowerCase().trim();
  const searchScope = useStore((s) => s.searchScope);

  useEffect(() => {
    void ensureMapLoaded(mapId);
  }, [ensureMapLoaded, mapId]);

  const visibleCount = useMemo(() => {
    if (!map) return 0;
    return map.data.nodes.filter((n) => {
      if (!kinds.has(n.kind)) return false;
      if (topics.size && !topics.has(n.domainId)) return false;
      if (search) {
        const hay =
          searchScope === "title"
            ? `${n.title} ${n.number} ${n.kind}`.toLowerCase()
            : `${n.title} ${n.number} ${n.kind} ${n.tags.join(" ")} ${n.formalStatement} ${n.originalText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    }).length;
  }, [map, kinds, topics, search, searchScope]);

  return (
    <div className="relative flex h-dvh w-screen flex-col overflow-hidden p-2 md:p-3">
      <Background />
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row md:gap-3">
          <Sidebar visibleCount={visibleCount} />
          <main className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-ink-950/30 md:rounded-2xl">
          {map ? (
            <>
              <GraphCanvas />
              <NodePanel />
              <PathPanel />
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/55">
              {mapError ? `Could not load map: ${mapError}` : loadingMapId ? "Loading map..." : "Preparing map..."}
            </div>
          )}
          </main>
      </div>
      <CommandPalette />
    </div>
  );
}
