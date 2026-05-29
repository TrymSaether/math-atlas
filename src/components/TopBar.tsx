import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, ChevronDown, BookOpen, Settings2 } from "lucide-react";
import { MAPS, type MapId } from "../data";
import { useStore, type EdgeStyle } from "../store";
import { THEMES } from "../lib/themes";
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

function DisplayButton() {
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
        aria-label="Display settings"
        aria-expanded={open}
        title="Display"
      >
        <Settings2 className="h-4 w-4" />
      </button>
      {open && <DisplayPopover />}
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium" style={{ color: "var(--fg-1)" }}>
          {label}
        </div>
        {hint && (
          <div className="text-[11px]" style={{ color: "var(--fg-3)" }}>
            {hint}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-pill border p-0.5"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="rounded-pill px-2.5 py-1 text-[11.5px] font-medium transition-colors"
            style={{
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
              boxShadow: active ? "var(--shadow-1)" : "none",
            }}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-5 w-9 rounded-pill transition-colors"
      style={{ background: active ? "var(--accent)" : "var(--border-strong)" }}
      role="switch"
      aria-checked={active}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
        style={{ left: active ? "18px" : "2px", boxShadow: "var(--shadow-1)" }}
      />
    </button>
  );
}

function DisplayPopover() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const edgeStyle = useStore((s) => s.edgeStyle);
  const setEdgeStyle = useStore((s) => s.setEdgeStyle);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);
  const showExercises = useStore((s) => s.showExercises);
  const toggleExercises = useStore((s) => s.toggleExercises);

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
        className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--fg-3)" }}
      >
        Appearance
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {THEMES.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent-soft)" : "var(--surface-2)",
                boxShadow: active ? `0 0 0 1px var(--accent)` : "none",
              }}
              aria-pressed={active}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                style={{ background: t.swatch[0], borderColor: "var(--border)" }}
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                  style={{ background: t.swatch[1] }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.swatch[2] }} />
                </span>
              </span>
              <span
                className="text-[12px] font-medium"
                style={{ color: active ? "var(--accent)" : "var(--fg-1)" }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-2 h-px" style={{ background: "var(--border)" }} />
      <div
        className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--fg-3)" }}
      >
        Graph
      </div>
      <SettingRow label="Edge style">
        <Segmented<EdgeStyle>
          value={edgeStyle}
          onChange={setEdgeStyle}
          options={[
            { value: "smooth", label: "Step" },
            { value: "bezier", label: "Curve" },
            { value: "straight", label: "Line" },
          ]}
        />
      </SettingRow>
      <SettingRow label="Soft links" hint="Pedagogical 'learn-first' edges">
        <ToggleSwitch active={showSoftDeps} onClick={toggleSoftDeps} />
      </SettingRow>
      <SettingRow label="Exercises" hint="Show practice nodes on the map">
        <ToggleSwitch active={showExercises} onClick={toggleExercises} />
      </SettingRow>
    </div>
  );
}
