import { useEffect, useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import { Background } from "./components/Background";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodePanel } from "./components/NodePanel";
import { DictionaryView } from "./components/DictionaryView";
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
  const surface = useStore((s) => s.surface);

  useEffect(() => {
    void ensureMapLoaded(mapId);
  }, [ensureMapLoaded, mapId]);

  // Assign domain tones during render (not in an effect) so the ordered palette
  // is in the cache before GraphCanvas builds its region nodes. Otherwise the
  // region tones get baked from getDomainTone's hash fallback on first paint —
  // producing duplicate/colliding hues that never match the nodes or minimap.
  useMemo(() => {
    if (map) assignDomainTones(map.data.domains.map((d) => d.id));
  }, [map]);

  return (
    <ReactFlowProvider>
      <div
        className="relative h-dvh w-screen overflow-hidden"
        style={{ background: "var(--bg)", color: "var(--fg-1)" }}
      >
        <Background />
        <main className="absolute inset-0">
          {map ? (
            surface === "dictionary" ? (
              <DictionaryView />
            ) : (
              <>
                <GraphCanvas />
                <NodePanel />
              </>
            )
          ) : (
            <div
              className="flex h-full items-center justify-center px-6 text-center text-sm"
              style={{ color: "var(--fg-2)" }}
            >
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
