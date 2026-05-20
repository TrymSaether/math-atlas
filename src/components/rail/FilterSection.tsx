import { LegendPanel } from "../sidebar/LegendPanel";
import { KindFilterPanel, RelationFilterPanel } from "../sidebar/FilterPanels";
import type { LoadedMap } from "../../data/loadMap";

export function FilterSection({ loaded }: { loaded: LoadedMap }) {
  const { data, kinds: availableKinds, relations: availableRelations } = loaded;
  const kindCounts = Object.fromEntries(
    availableKinds.map((k) => [k, data.nodes.filter((n) => n.kind === k).length])
  );

  return (
    <div className="space-y-5">
      <LegendPanel data={data} />
      <div className="border-t border-[var(--border-soft)]" />
      <KindFilterPanel availableKinds={availableKinds} counts={kindCounts} />
      <RelationFilterPanel availableRelations={availableRelations} />
    </div>
  );
}
