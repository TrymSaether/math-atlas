import { Sigma, Command as CommandIcon, Compass } from "lucide-react";
import { useStore } from "../store";

export function TopBar() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const view = useStore((s) => s.view);

  return (
    <header className="glass scanlines mx-auto mb-3 flex h-12 w-full items-center justify-between rounded-2xl px-4">
      <div className="flex items-center gap-3">
        <Sigma className="h-4 w-4 text-accent-cyan" />
        <div className="font-display text-[13px] tracking-widest text-white/80">
          INTRODUCTION&nbsp;TO&nbsp;TOPOLOGY · <span className="text-white/40">Thaule, v0.14 · 2022</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <Compass className="h-3.5 w-3.5" />
        <span>Mode: <span className="text-white/90">{view}</span></span>
        <button
          onClick={() => setPaletteOpen(true)}
          className="ml-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
        >
          <CommandIcon className="h-3 w-3" /> Search · <kbd className="font-mono">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
