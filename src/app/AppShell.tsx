import { lazy, Suspense, useEffect, useMemo } from "react";
import { CircleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStore } from "./store";
import { registerDomainTones } from "@/atlas/colors";
import { useKeyboardNav } from "./useKeyboardNav";
import { useUrlSync } from "./useUrlSync";
import { Background } from "./Background";
import { GraphCanvas } from "@/atlas/GraphCanvas";
import { DictionaryView } from "@/study/DictionaryView";
import { FlashcardsView } from "@/study/FlashcardsView";
import { CommandPalette } from "./CommandPalette";
import { SessionBridge } from "@/auth/SessionBridge";
import { StaleMapBanner } from "@/maps/StaleMapBanner";
import { TopChrome } from "./TopChrome";
import { Sidebar } from "./Sidebar";
import { ControlCluster } from "./ControlCluster";
import { ConceptCard } from "@/study/concept/ConceptCard";
import { PathsPanel } from "@/atlas/PathsPanel";
import { EditInspector } from "@/authoring/EditInspector";
import { Button } from "@/ui/button";
import { easing, Surface } from "@/design";
import { ShellLayoutController } from "./ShellLayoutController";

// The sandbox pulls in mathjs + mafs + mathlive — load it on demand so the
// atlas's initial bundle stays light.
const SandboxView = lazy(() => import("@/sandbox/SandboxView").then((m) => ({ default: m.SandboxView })));

/** Calm indeterminate loading state. */
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3.5" role="status" aria-live="polite">
      <span
        className="size-[22px] animate-spin rounded-full border-2 border-foreground/15 border-t-muted-foreground [animation-duration:0.7s]"
        aria-hidden
      />
      <p className="text-footnote text-muted-foreground">{label}</p>
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
        <Surface material="thick" className="flex max-w-sm flex-col items-center gap-3 px-7 py-8 text-center">
          <CircleAlert className="size-9 text-destructive" />
          <h2 className="text-title-3 font-semibold text-foreground">Couldn’t load this map</h2>
          <p className="text-footnote leading-relaxed text-muted-foreground">{mapError}</p>
          <Button className="mt-1" onClick={() => void ensureMapLoaded(mapId)}>
            Try again
          </Button>
        </Surface>
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
  const selectedId = useStore((s) => s.selectedId);
  const editMode = useStore((s) => s.editMode);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    void ensureMapLoaded(mapId);
  }, [ensureMapLoaded, mapId]);

  // Prime the domain-tone registry during render (see App history) so the graph
  // builds its regions with the active map's resolved hues.
  useMemo(() => {
    if (map) registerDomainTones(map.data.domains);
  }, [map]);

  return (
    <div
      className="relative h-dvh w-screen overflow-hidden bg-background text-foreground"
      data-surface={surface}
      data-canvas-panel-open={
        surface === "atlas" && (mode === "paths" || selectedId !== null || editMode) ? "" : undefined
      }
    >
      <Background />
      <ShellLayoutController />
      <SessionBridge />
      <StaleMapBanner />

      <main className="absolute inset-0" aria-label={surface === "atlas" ? "Atlas canvas" : undefined}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={map ? surface : "map-status"}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: easing.apple }}
          >
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
                  <AnimatePresence initial={false} mode="popLayout">
                    {mode === "explore" ? (
                      editMode ? (
                        <EditInspector key="edit" />
                      ) : (
                        <ConceptCard key="concept" />
                      )
                    ) : (
                      <PathsPanel key="paths" />
                    )}
                  </AnimatePresence>
                </>
              )
            ) : (
              <MapStatus />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <TopChrome />
      {surface === "atlas" && map && <Sidebar />}
      {surface === "atlas" && map && <ControlCluster />}
      <CommandPalette />
    </div>
  );
}
