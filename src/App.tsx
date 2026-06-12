import { lazy, Suspense, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import { Background } from "./components/Background";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodePanel } from "./components/NodePanel";
import { DictionaryView } from "./components/DictionaryView";
import { FlashcardsView } from "./components/FlashcardsView";
import { CommandPalette } from "./components/CommandPalette";

// The sandbox pulls in mathjs + mafs + mathlive — load it on demand so the
// atlas's initial bundle stays light.
const SandboxView = lazy(() =>
  import("./components/sandbox/SandboxView").then((m) => ({ default: m.SandboxView })),
);
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useStore } from "./store";
import { registerDomainTones } from "./lib/colors";

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

  // Publish the active map's domain tones during render (not in an effect) so
  // the registry is primed before GraphCanvas builds its region nodes, and so a
  // map switch re-points shared domain ids (e.g. "foundations") at the active
  // map's resolved hues. Resolution is deterministic, so this is idempotent.
  useMemo(() => {
    if (map) registerDomainTones(map.data.domains);
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
            ) : surface === "flashcards" ? (
              <FlashcardsView />
            ) : surface === "sandbox" ? (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--fg-3)" }}>
                    Loading sandbox…
                  </div>
                }
              >
                <SandboxView />
              </Suspense>
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
