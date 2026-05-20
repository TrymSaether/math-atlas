import { useMemo } from "react";
import { Panel } from "../ui";
import { AtlasTile } from "./AtlasTile";
import { MAPS, loadMap, type MapId } from "../../data";

export function AtlasView() {
  const tiles = useMemo(
    () =>
      (Object.keys(MAPS) as MapId[]).map((id) => ({
        id,
        meta: MAPS[id],
        loaded: loadMap(id),
      })),
    []
  );

  return (
    <main className="relative flex-1 overflow-auto">
      <Panel className="flex h-full w-full flex-col overflow-auto bg-[var(--canvas-bg)] p-8">
        <header className="mx-auto w-full max-w-[1100px] pb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Atlas
          </div>
          <h1 className="mt-1 font-display text-[34px] leading-[1.1] text-[var(--text)]">
            Choose a map
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[var(--text-soft)]">
            Each map covers a mathematical subject as an explorable concept graph.
            Pick one to drop into the cluster overview, then drill into the
            structure you want to learn.
          </p>
        </header>

        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 pb-10 md:grid-cols-2">
          {tiles.map(({ id, meta, loaded }) => (
            <AtlasTile key={id} mapId={id} meta={meta} loaded={loaded} />
          ))}
        </div>
      </Panel>
    </main>
  );
}
