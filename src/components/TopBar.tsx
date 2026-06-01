import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, ChevronDown, BookOpen, GraduationCap, Compass, Settings2, Sun, Moon } from "lucide-react";
import { MAPS, type MapId } from "../data";
import { useStore, type EdgeStyle } from "../store";
import { THEMES, schemeFor, siblingOf } from "../lib/themes";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, kindsByCategory } from "../lib/nodeCategory";
import { LogoMark } from "./Logo";

interface PopoverPosition {
  top: number;
  right: number;
}

function popoverPositionFor(el: HTMLElement): PopoverPosition {
  const rect = el.getBoundingClientRect();
  return {
    top: Math.round(rect.bottom + 8),
    right: Math.max(12, Math.round(window.innerWidth - rect.right)),
  };
}

export function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-3 sm:px-4">
      <div className="pointer-events-auto flex w-full min-w-0 items-start justify-between gap-2 sm:gap-3">
        <BrandSection />
        <div className="map-chrome top-tools dock-scrollbar flex h-11 min-w-0 flex-1 items-center justify-end gap-0 overflow-x-auto rounded-[24px] p-1 sm:flex-none">
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
      className="map-chrome relative flex h-11 min-w-0 max-w-[calc(100vw-224px)] items-center gap-1 rounded-[24px] p-1 sm:max-w-none"
    >
      <div className="flex min-w-0 items-center gap-2.5 pl-2.5 pr-1 sm:px-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--surface) 78%, transparent)",
            boxShadow: "inset 0 0 0 1px var(--chrome-border)",
          }}
        >
          <LogoMark size={18} className="text-[color:var(--fg-1)]" />
        </span>
        <span
          className="hidden whitespace-nowrap font-serif text-atlas-brand sm:inline"
          style={{ color: "var(--fg-1)" }}
        >
          Math Atlas
        </span>
      </div>
      <span className="map-divider hidden h-7 w-px shrink-0 sm:block" />
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "map-field-button flex h-9 min-w-0 items-center gap-2 rounded-[18px] px-2.5 text-ui-control font-semibold sm:px-3",
          open && "is-active",
        )}
        style={{ color: "var(--fg-1)" }}
        aria-label="Field selector"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
          style={{
            color: "var(--fg-2)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div
          className="map-popover absolute left-0 top-[52px] w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-[20px] p-1.5 sm:w-[260px]"
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
                className={cn(
                  "map-text-button flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5 text-left text-ui-control font-semibold",
                  active && "is-active",
                )}
                style={{ color: active ? "var(--fg-1)" : "var(--fg-2)" }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: active ? "var(--accent)" : "var(--fg-4)" }}
                />
                <span className="block min-w-0 flex-1 truncate">{MAPS[id].label}</span>
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
      className="map-text-button flex h-9 min-w-9 items-center gap-2 rounded-[18px] px-2.5 text-ui-control md:min-w-[190px] md:px-3.5"
      style={{ color: "var(--fg-2)" }}
      aria-label="Open search"
    >
      <Search className="h-4 w-4 shrink-0" style={{ color: "var(--fg-3)" }} />
      <span className="hidden md:inline">Search the atlas</span>
      <kbd
        className="ml-auto hidden h-5 items-center rounded-[7px] border px-1.5 font-mono text-ui-2xs md:inline-flex"
        style={{
          background: "var(--chrome-hover)",
          borderColor: "var(--chrome-border)",
          color: "var(--fg-2)",
        }}
      >
        ⌘K
      </kbd>
    </button>
  );
}

function TopIconButton({
  active,
  accentActive,
  expanded,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  accentActive?: boolean;
  expanded?: boolean;
  label: string;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pointer-events-auto map-icon-button",
        active && (accentActive ? "is-accent" : "is-active"),
      )}
      aria-label={label}
      aria-pressed={active}
      aria-expanded={expanded}
      title={title}
    >
      {children}
    </button>
  );
}

function DictionaryButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "dictionary";
  return (
    <TopIconButton
      onClick={() => setSurface(active ? "atlas" : "dictionary")}
      active={active}
      accentActive
      label="Topology Dictionary"
      title={active ? "Back to atlas" : "Topology Dictionary"}
    >
      <BookOpen className="h-4 w-4" />
    </TopIconButton>
  );
}

function FlashcardsButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "flashcards";
  return (
    <TopIconButton
      onClick={() => setSurface(active ? "atlas" : "flashcards")}
      active={active}
      accentActive
      label="Flashcards"
      title={active ? "Back to atlas" : "Flashcards"}
    >
      <GraduationCap className="h-4 w-4" />
    </TopIconButton>
  );
}

function SandboxButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "sandbox";
  return (
    <TopIconButton
      onClick={() => setSurface(active ? "atlas" : "sandbox")}
      active={active}
      accentActive
      label="Sandbox"
      title={active ? "Back to atlas" : "Geometric sandbox"}
    >
      <Compass className="h-4 w-4" />
    </TopIconButton>
  );
}

function FilterButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (ref.current) setPosition(popoverPositionFor(ref.current));
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className="pointer-events-auto relative" ref={ref}>
      <TopIconButton
        onClick={() => {
          if (ref.current) setPosition(popoverPositionFor(ref.current));
          setOpen((o) => !o);
        }}
        active={open}
        expanded={open}
        label="Filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </TopIconButton>
      {open && position && <FilterPopover popoverRef={popoverRef} position={position} />}
    </div>
  );
}

function FilterPopover({
  popoverRef,
  position,
}: {
  popoverRef: RefObject<HTMLDivElement>;
  position: PopoverPosition;
}) {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  if (!map) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="map-popover pointer-events-auto fixed z-50 w-[min(300px,calc(100vw-24px))] rounded-[20px] p-4"
      style={{ top: position.top, right: position.right }}
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
    </div>,
    document.body,
  );
}

function DisplayButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (ref.current) setPosition(popoverPositionFor(ref.current));
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className="pointer-events-auto relative" ref={ref}>
      <TopIconButton
        onClick={() => {
          if (ref.current) setPosition(popoverPositionFor(ref.current));
          setOpen((o) => !o);
        }}
        active={open}
        expanded={open}
        label="Display settings"
        title="Display"
      >
        <Settings2 className="h-4 w-4" />
      </TopIconButton>
      {open && position && <DisplayPopover popoverRef={popoverRef} position={position} />}
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

function ThemeSwatch({ theme, active, onClick }: { theme: (typeof THEMES)[number]; active: boolean; onClick: () => void }) {
  const p = theme.preview;
  return (
    <button
      type="button"
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

function DisplayPopover({
  popoverRef,
  position,
}: {
  popoverRef: RefObject<HTMLDivElement>;
  position: PopoverPosition;
}) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const edgeStyle = useStore((s) => s.edgeStyle);
  const setEdgeStyle = useStore((s) => s.setEdgeStyle);
  const activeLabel = THEMES.find((t) => t.id === theme)?.label ?? theme;

  return createPortal(
    <div
      ref={popoverRef}
      className="map-popover pointer-events-auto fixed z-50 w-[min(260px,calc(100vw-24px))] rounded-[20px] p-4"
      style={{ top: position.top, right: position.right }}
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
    </div>,
    document.body,
  );
}

function SchemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <TopIconButton
      onClick={() => setTheme(siblingOf(theme))}
      label={isDark ? "Switch to light scheme" : "Switch to dark scheme"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </TopIconButton>
  );
}
