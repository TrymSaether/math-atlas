import { useMemo } from "react";
import { CollapsibleRail } from "./rail/CollapsibleRail";
import { GraphCanvas } from "./GraphCanvas";
import { NodePanel } from "./NodePanel";
import { PathPanel } from "./PathPanel";
import { FilterChipBar } from "./FilterChipBar";
import { useStore } from "../store";
import { loadMap } from "../data";
import { useKeyboardNav } from "../hooks/useKeyboardNav";

export function WorkspaceView() {
  const mapId = useStore((s) => s.mapId);
  const loaded = useMemo(() => loadMap(mapId), [mapId]);
  const { data, nodeById, incomingEdgesByNodeId, outgoingEdgesByNodeId } = loaded;

  useKeyboardNav(data.nodes);

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <CollapsibleRail loaded={loaded} />
      <div className="flex min-h-0 flex-1 flex-col">
        <FilterChipBar data={data} />
        <main className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--canvas-bg)] shadow-[var(--shadow-1)]">
          <GraphCanvas data={data} />
          <NodePanel
            nodeById={nodeById}
            incomingEdgesByNodeId={incomingEdgesByNodeId}
            outgoingEdgesByNodeId={outgoingEdgesByNodeId}
          />
          <PathPanel data={data} nodeById={nodeById} />
        </main>
      </div>
    </div>
  );
}
