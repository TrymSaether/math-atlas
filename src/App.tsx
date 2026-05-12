import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodePanel } from "./components/NodePanel";
import { CommandPalette } from "./components/CommandPalette";
import { useKeyboardNav } from "./hooks/useKeyboardNav";

export default function App() {
  useKeyboardNav();

  return (
    <div className="atlas-shell flex h-screen w-screen flex-col overflow-hidden">
      <TopBar />
      <div className="atlas-workspace grid min-h-0 flex-1">
        <Sidebar />
        <main className="atlas-main relative min-h-0 overflow-hidden">
          <GraphCanvas />
        </main>
        <NodePanel />
      </div>
      <CommandPalette />
    </div>
  );
}
