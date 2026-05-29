import { useEffect, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
  ChevronDown,
  BookOpen,
  Settings2,
  Spline,
  PencilLine,
} from "lucide-react";
import { MAPS, type MapId } from "../data";
import { useStore, type EdgeStyle } from "../store";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { KIND_LABEL } from "../types";
import { LogoMark } from "./Logo";

export function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-[1180px] items-center gap-2">
        <BrandSection />
        <div className="ml-auto flex items-center gap-2">
          <SearchBox />
          <DictionaryButton />
          <FilterButton />
          <DisplayButton />
        </div>
      </div>
    </header>
  );
}

function BrandSection() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const currentLabel = MAPS[mapId].label;

  return (
    <div
      ref={ref}
      className="relative flex h-10 items-center gap-1 rounded-pill border p-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderWidth: "1px",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div className="flex items-center gap-2.5 px-2.5">
        <LogoMark size={20} className="text-[color:var(--fg-1)]" />
        <span
          className="whitespace-nowrap font-serif text-[17px] leading-none"
          style={{ color: "var(--fg-1)", letterSpacing: "-0.005em" }}
        >
          Math Atlas
        </span>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-pill px-3 text-[12.5px] font-medium transition-all"
        style={{
          background: open ? "var(--surface-3)" : "var(--surface-2)",
          color: "var(--fg-1)",
          border: `1px solid var(--border)`,
        }}
        aria-label="Field selector"
        aria-expanded={open}
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform"
          style={{
            color: "var(--fg-2)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-12 w-max rounded-2xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-3)",
          }}
        >
          {(Object.keys(MAPS) as MapId[]).map((id) => {
            const active = id === mapId;
            return (
              <button
                key={id}
                onClick={() => {
                  setMap(id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[12.5px] font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-3)" : "transparent",
                  color: active ? "var(--fg-1)" : "var(--fg-2)",
                  borderBottomColor: "var(--border)",
                  borderBottomWidth: id !== "functional_analysis" ? "1px" : "0",
                }}
              >
                <span>{MAPS[id].label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchBox() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <button
      onClick={() => setPaletteOpen(true)}
      className="flex h-9 items-center gap-2 rounded-pill border px-3 text-[12.5px] sm:h-10"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5" style={{ color: "var(--fg-3)" }} />
      <span className="hidden md:inline">Search the atlas</span>
      <kbd
        className="hidden h-5 items-center rounded border px-1.5 font-mono text-[10px] md:inline-flex"
        style={{
          background: "var(--surface-3)",
          borderColor: "var(--border)",
          color: "var(--fg-2)",
        }}
      >
        ⌘K
      </kbd>
    </button>
  );
}

function DictionaryButton() {
  return (
    <a
      href="/topology-dictionary.html"
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label="Topology Dictionary"
      title="Topology Dictionary"
    >
      <BookOpen className="h-4 w-4" />
    </a>
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
        className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: open ? "var(--accent)" : "var(--fg-2)",
          boxShadow: "var(--shadow-1)",
        }}
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
    <div
      className="absolute right-0 top-12 w-[300px] rounded-2xl border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-3)",
      }}
    >
      <div
        className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--fg-3)" }}
      >
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
                "rounded-pill border px-2.5 py-1 text-[11.5px] font-medium transition",
              )}
              style={
                active
                  ? { background: tone.tint, borderColor: tone.border, color: tone.color }
                  : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-3)" }
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
          className="mb-4 text-[11px] hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Reset domains
        </button>
      )}
      <div
        className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--fg-3)" }}
      >
        Kinds
      </div>
      <div className="flex flex-wrap gap-1.5">
        {map.kinds.map((k) => {
          const active = kinds.has(k);
          return (
            <button
              key={k}
              onClick={() => toggleKind(k)}
              className="rounded-pill border px-2.5 py-1 text-[11.5px] font-medium transition"
              style={
                active
                  ? {
                    background: "var(--accent-soft)",
                    borderColor: "var(--accent-border)",
                    color: "var(--accent)",
                  }
                  : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-3)" }
              }
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
    <div
      className="flex h-10 items-center overflow-hidden rounded-pill border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <button
        onClick={() => rf.zoomOut({ duration: 200 })}
        className="flex h-10 w-10 items-center justify-center"
        style={{ color: "var(--fg-2)" }}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="h-5 w-px" style={{ background: "var(--border)" }} />
      <button
        onClick={() => rf.zoomIn({ duration: 200 })}
        className="flex h-10 w-10 items-center justify-center"
        style={{ color: "var(--fg-2)" }}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="h-5 w-px" style={{ background: "var(--border)" }} />
      <button
        onClick={() => rf.fitView({ padding: 0.18, duration: 400 })}
        className="flex h-10 w-10 items-center justify-center"
        style={{ color: "var(--fg-2)" }}
        aria-label="Fit to view"
      >
        <Locate className="h-4 w-4" />
      </button>
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggle = useStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label={isDark ? "Switch to paper theme" : "Switch to chalkboard theme"}
      title={isDark ? "Paper" : "Chalkboard"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
