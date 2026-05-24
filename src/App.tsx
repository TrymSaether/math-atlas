import { useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { Background } from "./components/Background";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodePanel } from "./components/NodePanel";
import { CommandPalette } from "./components/CommandPalette";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useStore } from "./store";
import { assignDomainTones } from "./lib/colors";

export default function App() {
  useKeyboardNav();
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const loadingMapId = useStore((s) => s.loadingMapId);
  const mapError = useStore((s) => s.mapError);
  const ensureMapLoaded = useStore((s) => s.ensureMapLoaded);

  useEffect(() => {
    void ensureMapLoaded(mapId);
  }, [ensureMapLoaded, mapId]);

  useEffect(() => {
    if (!map) return;
    assignDomainTones(map.data.domains.map((d) => d.id));
  }, [map]);

  return (
    <ReactFlowProvider>
      <div className="relative h-dvh w-screen overflow-hidden bg-canvas text-ink-900">
        <Background />
        <main className="absolute inset-0">
          {map ? (
            <>
              <GraphCanvas />
              <NodePanel />
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-500">
              {mapError
                ? `Could not load map: ${mapError}`
                : loadingMapId
                  ? "Loading atlas…"
                  : "Preparing atlas…"}
            </div>
          )}
        </main>
        <TopBar />
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}
