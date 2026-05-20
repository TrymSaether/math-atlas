import { RoutePlannerPanel } from "../sidebar/RoutePlannerPanel";
import { HighlightPanel } from "../sidebar/HighlightPanel";
import type { LoadedMap } from "../../data/loadMap";

export function PlanSection({ loaded }: { loaded: LoadedMap }) {
  const { data } = loaded;
  return (
    <div className="space-y-5">
      <RoutePlannerPanel data={data} />
      <div className="border-t border-[var(--border-soft)]" />
      <HighlightPanel />
    </div>
  );
}
