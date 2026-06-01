import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, ChevronDown, BookOpen, GraduationCap, Compass, Settings2, Sun, Moon } from "lucide-react";
import { MAPS, type MapId } from "../data";
import { useStore, type EdgeStyle } from "../store";
import { THEMES, schemeFor, siblingOf } from "../lib/themes";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, kindsByCategory } from "../lib/nodeCategory";
import { LogoMark } from "./Logo";

export function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-3">
      <div className="pointer-events-auto flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
        <BrandSection />
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <SearchBox />
          <DictionaryButton />
          <FlashcardsButton />
          <SandboxButton />
          <FilterButton />
          <SchemeToggle />
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
      className="relative flex h-10 min-w-0 max-w-[calc(100vw-214px)] items-center gap-1 rounded-pill border p-1 sm:max-w-none"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderWidth: "1px",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5 pl-2 pr-1 sm:px-2.5">
        <LogoMark size={20} className="text-[color:var(--fg-1)]" />
        <span
          className="hidden whitespace-nowrap font-serif text-atlas-brand sm:inline"
          style={{ color: "var(--fg-1)", letterSpacing: "-0.005em" }}
        >
          Math Atlas
        </span>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 min-w-0 items-center gap-1.5 rounded-pill px-2.5 text-ui-control font-medium transition-all sm:px-3"
        style={{
          background: open ? "var(--surface-3)" : "var(--surface-2)",
          color: "var(--fg-1)",
          border: `1px solid var(--border)`,
        }}
        aria-label="Field selector"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform"
          style={{
            color: "var(--fg-2)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-12 w-[min(280px,calc(100vw-24px))] rounded-2xl border sm:w-max"
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
                className="block w-full px-3 py-2 text-left text-ui-control font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-3)" : "transparent",
                  color: active ? "var(--fg-1)" : "var(--fg-2)",
                  borderBottomColor: "var(--border)",
                  borderBottomWidth: id !== "functional_analysis" ? "1px" : "0",
                }}
              >
                <span className="block truncate">{MAPS[id].label}</span>
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
      className="flex h-9 items-center gap-2 rounded-pill border px-3 text-ui-control sm:h-10"
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
        className="hidden h-5 items-center rounded border px-1.5 font-mono text-ui-2xs md:inline-flex"
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
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "dictionary";
  return (
    <button
      type="button"
      onClick={() => setSurface(active ? "atlas" : "dictionary")}
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: active ? "var(--accent)" : "var(--surface)",
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "var(--surface)" : "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label="Topology Dictionary"
      aria-pressed={active}
      title={active ? "Back to atlas" : "Topology Dictionary"}
    >
      <BookOpen className="h-4 w-4" />
    </button>
  );
}

function FlashcardsButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "flashcards";
  return (
    <button
      type="button"
      onClick={() => setSurface(active ? "atlas" : "flashcards")}
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: active ? "var(--accent)" : "var(--surface)",
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "var(--surface)" : "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label="Flashcards"
      aria-pressed={active}
      title={active ? "Back to atlas" : "Flashcards"}
    >
      <GraduationCap className="h-4 w-4" />
    </button>
  );
}

function SandboxButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "sandbox";
  return (
    <button
      type="button"
      onClick={() => setSurface(active ? "atlas" : "sandbox")}
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: active ? "var(--accent)" : "var(--surface)",
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "var(--surface)" : "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label="Sandbox"
      aria-pressed={active}
      title={active ? "Back to atlas" : "Geometric sandbox"}
    >
      <Compass className="h-4 w-4" />
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
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);
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
        className="mb-2 text-ui-caption font-semibold uppercase tracking-label-wide"
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
                "rounded-pill border px-2.5 py-1 text-ui-meta font-medium transition",
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
          className="mb-4 text-ui-hint hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Reset domains
        </button>
      )}
      <div
        className="mb-2 text-ui-caption font-semibold uppercase tracking-label-wide"
        style={{ color: "var(--fg-3)" }}
      >
        Categories
      </div>
      <div className="flex flex-wrap gap-1.5">
        {kindsByCategory(map.kinds).map(({ category, kinds: groupKinds }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const active = groupKinds.every((k) => kinds.has(k));
          return (
            <button
              key={category}
              onClick={() => groupKinds.forEach((k) => kinds.has(k) === active && toggleKind(k))}
              className="flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-ui-meta font-medium transition"
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
              <Icon className="h-3 w-3" strokeWidth={2.25} aria-hidden />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="my-3.5 h-px" style={{ background: "var(--border)" }} />
      <div
        className="mb-1 text-ui-caption font-semibold uppercase tracking-label-wide"
        style={{ color: "var(--fg-3)" }}
      >
        Edges
      </div>
      <SettingRow label="Soft links" hint="Pedagogical 'learn-first' edges">
        <ToggleSwitch active={showSoftDeps} onClick={toggleSoftDeps} />
      </SettingRow>
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
        <div className="text-ui-control font-medium" style={{ color: "var(--fg-1)" }}>
          {label}
        </div>
        {hint && (
          <div className="text-ui-hint" style={{ color: "var(--fg-3)" }}>
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
            className="rounded-pill px-2.5 py-1 text-ui-meta font-medium transition-colors"
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

function ThemeSwatch({ theme, active, onClick }: { theme: (typeof THEMES)[number]; active: boolean; onClick: () => void }) {
  const p = theme.preview;
  return (
    <button
      onClick={onClick}
      className="h-[22px] w-[22px] rounded-full transition-transform hover:scale-110"
      style={{
        background: `linear-gradient(135deg, ${p.surface} 0 50%, ${p.accent} 50% 100%)`,
        boxShadow: active
          ? "0 0 0 2px var(--surface), 0 0 0 3.5px var(--accent)"
          : "inset 0 0 0 1px var(--border-strong)",
      }}
      aria-pressed={active}
      aria-label={theme.label}
      title={theme.label}
    />
  );
}

function DisplayPopover() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const edgeStyle = useStore((s) => s.edgeStyle);
  const setEdgeStyle = useStore((s) => s.setEdgeStyle);
  const activeLabel = THEMES.find((t) => t.id === theme)?.label ?? theme;

  return (
    <div
      className="absolute right-0 top-12 w-[260px] rounded-2xl border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-3)",
      }}
    >
      <div className="mb-2.5 flex items-baseline justify-between">
        <span
          className="text-ui-caption font-semibold uppercase tracking-label-wide"
          style={{ color: "var(--fg-3)" }}
        >
          Theme
        </span>
        <span className="text-ui-meta font-medium" style={{ color: "var(--fg-2)" }}>
          {activeLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {THEMES.map((t) => (
          <ThemeSwatch key={t.id} theme={t} active={t.id === theme} onClick={() => setTheme(t.id)} />
        ))}
      </div>

      <div className="my-3.5 h-px" style={{ background: "var(--border)" }} />
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
    </div>
  );
}

function SchemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <button
      onClick={() => setTheme(siblingOf(theme))}
      className="flex h-9 w-9 items-center justify-center rounded-pill border sm:h-10 sm:w-10"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--fg-2)",
        boxShadow: "var(--shadow-1)",
      }}
      aria-label={isDark ? "Switch to light scheme" : "Switch to dark scheme"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
