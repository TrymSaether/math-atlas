import { lazy, Suspense, useEffect, useMemo } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useStore } from "../../store";
import { registerDomainTones } from "../../lib/colors";
import { authEnabled } from "../../lib/authClient";
import { useKeyboardNav } from "../../hooks/useKeyboardNav";
import { useUrlSync } from "../../hooks/useUrlSync";
import { Background } from "../Background";
import { GraphCanvas } from "../GraphCanvas";
import { DictionaryView } from "../DictionaryView";
import { FlashcardsView } from "../FlashcardsView";
import { CommandPalette } from "../CommandPalette";
import { SessionBridge } from "../auth/SessionBridge";
import { StaleMapBanner } from "../StaleMapBanner";
import { TopChrome } from "./TopChrome";
import { Sidebar } from "./Sidebar";
import { ControlCluster } from "./ControlCluster";
import { ConceptCard } from "./ConceptCard";
import { PathsPanel } from "./PathsPanel";
import { EditInspector } from "./EditInspector";
import { Material, ShellButton } from "../primitives";

// The sandbox pulls in mathjs + mafs + mathlive — load it on demand so the
// atlas's initial bundle stays light.
const SandboxView = lazy(() => import("../sandbox/SandboxView").then((m) => ({ default: m.SandboxView })));

/** Calm indeterminate loading state. */
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3.5" role="status" aria-live="polite">
      <span className="shell-spinner" aria-hidden />
      <p className="text-footnote text-fg-3">{label}</p>
    </div>
  );
}

/** Map loading / failure state for the whole shell. */
function MapStatus() {
  const mapId = useStore((s) => s.mapId);
  const mapError = useStore((s) => s.mapError);
  const loadingMapId = useStore((s) => s.loadingMapId);
  const ensureMapLoaded = useStore((s) => s.ensureMapLoaded);
  const title = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title);

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Material
          thickness="thick"
          className="shell-panel flex max-w-sm flex-col items-center gap-3 px-7 py-8 text-center"
        >
          <WarningCircleIcon className="h-9 w-9 text-danger" weight="regular" />
          <h2 className="text-lg text-fg-1">Couldn’t load this map</h2>
          <p className="text-footnote leading-relaxed text-fg-3">{mapError}</p>
          <ShellButton primary className="mt-1" onClick={() => void ensureMapLoaded(mapId)}>
            Try again
          </ShellButton>
        </Material>
      </div>
    );
  }
  return <LoadingState label={loadingMapId ? `Loading ${title ?? "atlas"}…` : "Preparing…"} />;
}

/**
 * The application shell — the content layer (graph / index / study / sandbox)
 * with the floating Liquid Glass control layer above it. Replaces the
 * prototype's TopBar + CanvasControls chrome.
 */
export function AppShell() {
  useKeyboardNav();
  useUrlSync();
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const ensureMapLoaded = useStore((s) => s.ensureMapLoaded);
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const editMode = useStore((s) => s.editMode);

  useEffect(() => {
    void ensureMapLoaded(mapId);
  }, [ensureMapLoaded, mapId]);

  // Prime the domain-tone registry during render (see App history) so the graph
  // builds its regions with the active map's resolved hues.
  useMemo(() => {
    if (map) registerDomainTones(map.data.domains);
  }, [map]);

  const onAtlas = surface === "atlas";

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-bg text-fg-1">
      <Background />
      {authEnabled && <SessionBridge />}
      {authEnabled && <StaleMapBanner />}

      <main className="absolute inset-0">
        {map ? (
          surface === "dictionary" ? (
            <DictionaryView />
          ) : surface === "flashcards" ? (
            <FlashcardsView />
          ) : surface === "sandbox" ? (
            <Suspense fallback={<LoadingState label="Loading sandbox…" />}>
              <SandboxView />
            </Suspense>
          ) : (
            <>
              <GraphCanvas />
              {mode === "explore" ? editMode ? <EditInspector /> : <ConceptCard /> : <PathsPanel />}
            </>
          )
        ) : (
          <MapStatus />
        )}
      </main>

      {!onAtlas && <TopChrome />}
      {onAtlas && map && <Sidebar />}
      {onAtlas && map && <ControlCluster />}
      <CommandPalette />
    </div>
  );
}
