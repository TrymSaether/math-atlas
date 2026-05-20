import { useMemo } from "react";
import { Background } from "./components/Background";
import { TopBar } from "./components/TopBar";
import { CommandPalette } from "./components/CommandPalette";
import { AtlasView } from "./components/atlas/AtlasView";
import { WorkspaceView } from "./components/WorkspaceView";
import { useStore } from "./store";
import { loadMap } from "./data";

export default function App() {
  const appView = useStore((s) => s.appView);
  const mapId = useStore((s) => s.mapId);
  // Loaded once for the command palette regardless of view.
  const loaded = useMemo(() => loadMap(mapId), [mapId]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden p-4">
      <Background />
      <TopBar />
      {appView === "atlas" ? <AtlasView /> : <WorkspaceView />}
      <CommandPalette data={loaded.data} />
    </div>
  );
}
