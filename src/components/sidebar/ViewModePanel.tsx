import { Eye, EyeOff, Layers, Network } from "lucide-react";
import { Button, Section } from "../ui";
import { useStore } from "../../store";

export function ViewModePanel() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const showOrphans = useStore((s) => s.showOrphans);
  const setShowOrphans = useStore((s) => s.setShowOrphans);

  return (
    <Section title="View" icon={<Eye className="h-3 w-3" />}>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={view === "dependency" ? "primary" : "quiet"} onClick={() => setView("dependency")}><Network className="h-3.5 w-3.5" />Dependency</Button>
        <Button variant={view === "cluster" ? "primary" : "quiet"} onClick={() => setView("cluster")}><Layers className="h-3.5 w-3.5" />Cluster</Button>
      </div>
      {view === "dependency" && (
        <Button variant="quiet" onClick={() => setShowOrphans(!showOrphans)} className="mt-2 w-full justify-between">
          <span className="flex items-center gap-1.5">{showOrphans ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{showOrphans ? "Show all items" : "Hide unlinked items"}</span>
          <span className="text-[10px] text-[var(--muted)]">{showOrphans ? "ON" : "OFF"}</span>
        </Button>
      )}
    </Section>
  );
}
