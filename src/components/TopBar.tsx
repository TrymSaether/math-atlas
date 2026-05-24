import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Plus, Minus, Locate } from "lucide-react";
import { useReactFlow } from "reactflow";
import { MAPS, type MapId } from "../data";
import { useStore } from "../store";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { KIND_LABEL } from "../types";

export function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-[1100px] items-center gap-2">
        <Wordmark />
        <FieldSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <SearchBox />
          <FilterButton />
          <ZoomControls />
        </div>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <div className="flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 shadow-card">
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "#0A84FF" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <span className="whitespace-nowrap text-[13px] font-semibold tracking-tight text-ink-900">
        Math Atlas
      </span>
    </div>
  );
}

function FieldSwitcher() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  return (
    <div className="flex h-10 items-center rounded-full border border-hairline bg-white p-1 shadow-card">
      {(Object.keys(MAPS) as MapId[]).map((id) => {
        const active = id === mapId;
        return (
          <button
            key={id}
            onClick={() => setMap(id)}
            className={cn(
              "h-8 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition-colors",
              active
                ? "bg-ink-50 text-ink-900"
                : "text-ink-500 hover:text-ink-900",
            )}
            aria-pressed={active}
          >
            {MAPS[id].label}
          </button>
        );
      })}
    </div>
  );
}

function SearchBox() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <button
      onClick={() => setPaletteOpen(true)}
      className="flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-3 text-[12.5px] text-ink-500 shadow-card hover:bg-ink-50"
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 text-ink-400" />
      <span className="hidden md:inline">Search the atlas</span>
      <kbd className="hidden h-5 items-center rounded border border-hairline bg-ink-50 px-1.5 font-mono text-[10px] text-ink-500 md:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}

function FilterButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white shadow-card",
          open ? "text-accent-blue" : "text-ink-700 hover:bg-ink-50",
        )}
        aria-label="Filters"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
      {open && <FilterPopover />}
    </div>
  );
}

function FilterPopover() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  if (!map) return null;

  return (
    <div className="absolute right-0 top-12 w-[300px] rounded-2xl border border-hairline bg-white p-4 shadow-float">
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        Domains
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {map.data.domains.map((d) => {
          const active = topics.size === 0 || topics.has(d.id);
          const tone = getDomainTone(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggleTopic(d.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition",
                active
                  ? "border-transparent text-ink-900"
                  : "border-hairline bg-white text-ink-400 hover:text-ink-700",
              )}
              style={
                active
                  ? { background: tone.tint, borderColor: tone.border, color: tone.color }
                  : undefined
              }
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {topics.size > 0 && (
        <button
          onClick={resetTopics}
          className="mb-4 text-[11px] text-accent-blue hover:underline"
        >
          Reset domains
        </button>
      )}
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        Kinds
      </div>
      <div className="flex flex-wrap gap-1.5">
        {map.kinds.map((k) => {
          const active = kinds.has(k);
          return (
            <button
              key={k}
              onClick={() => toggleKind(k)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition",
                active
                  ? "border-accent-blue/30 bg-accent-blueSoft text-accent-blue"
                  : "border-hairline bg-white text-ink-400 hover:text-ink-700",
              )}
            >
              {KIND_LABEL[k]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZoomControls() {
  const rf = useReactFlow();
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-full border border-hairline bg-white shadow-card">
      <button
        onClick={() => rf.zoomOut({ duration: 200 })}
        className="flex h-10 w-10 items-center justify-center text-ink-700 hover:bg-ink-50"
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="h-5 w-px bg-hairline" />
      <button
        onClick={() => rf.zoomIn({ duration: 200 })}
        className="flex h-10 w-10 items-center justify-center text-ink-700 hover:bg-ink-50"
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="h-5 w-px bg-hairline" />
      <button
        onClick={() => rf.fitView({ padding: 0.18, duration: 400 })}
        className="flex h-10 w-10 items-center justify-center text-ink-700 hover:bg-ink-50"
        aria-label="Fit to view"
      >
        <Locate className="h-4 w-4" />
      </button>
    </div>
  );
}
