import { Sigma, Command as CommandIcon, Compass } from "lucide-react";
import { MAPS, isMapId } from "../data";
import { useStore } from "../store";

export function TopBar() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const view = useStore((s) => s.view);
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const activeMap = useStore((s) => s.loadedMaps[mapId]);

  return (
    <header className="glass scanlines mx-auto mb-2 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 md:mb-3 md:rounded-2xl md:px-4">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <Sigma className="h-4 w-4 shrink-0 text-accent-cyan" />
        <div className="min-w-0 truncate font-display text-[12px] tracking-wider text-white/80 md:text-[13px] md:tracking-widest">
          {activeMap?.data.label || MAPS[mapId].label} <span className="hidden text-white/40 sm:inline">- concepts & dependencies</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-white/50 md:gap-2">
        <select
          value={mapId}
          onChange={(event) => {
            const next = event.target.value;
            if (isMapId(next)) setMap(next);
          }}
          className="max-w-[150px] rounded-md border border-white/10 bg-black/35 px-2 py-1 text-white/80 outline-none hover:bg-white/10 sm:max-w-none"
          aria-label="Select map"
        >
          {Object.values(MAPS).map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
        <Compass className="hidden h-3.5 w-3.5 sm:block" />
        <span className="hidden sm:inline">Mode: <span className="text-white/90">{view}</span></span>
        <button
          onClick={() => setPaletteOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 md:ml-3"
          aria-label="Open command palette"
        >
          <CommandIcon className="h-3 w-3" /> <span className="hidden sm:inline">Search · </span><kbd className="font-mono">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
