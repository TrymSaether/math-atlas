import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlassIcon, CaretDownIcon, BookOpenTextIcon, LightningIcon, CompassToolIcon, CompassIcon, SlidersHorizontalIcon, SunIcon, MoonIcon, CheckIcon, BookmarkSimple, Globe, Stack } from "@phosphor-icons/react";
import { useReactFlow } from "reactflow";
import { MAPS, type MapId } from "../data";
import { useStore } from "../store";
import { THEMES, schemeFor, siblingOf } from "../lib/themes";
import { cn } from "../lib/utils";
import { LogoMark } from "./Logo";
import { Pill, DockButton } from "./chrome/Pill";

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
        <MapBrandSelector />
        <div className="dock-scrollbar flex min-w-0 items-center justify-end gap-2 overflow-x-auto sm:flex-none">
          {/* Search — its own field, like Apple Maps' floating search */}
          <Pill variant="soft" className="top-tools">
            <SearchBox />
          </Pill>
          {/* Surfaces — mutually-exclusive view switches, grouped */}
          <Pill variant="soft" className="top-tools">
            <AtlasButton />
            <DictionaryButton />
            <FlashcardsButton />
            <SandboxButton />
          </Pill>
          {/* Appearance */}
          <Pill variant="soft" className="top-tools">
            <SchemeToggle />
            <DisplayButton />
          </Pill>
        </div>
      </div>
    </header>
  );
}

function MapBrandSelector() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const select = useStore((s) => s.select);
  const rf = useReactFlow();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Brand acts as "home": return to the atlas, clear selection, and recenter.
  const goHome = () => {
    select(null);
    if (surface !== "atlas") {
      setSurface("atlas");
      // wait for the canvas to remount before fitting
      window.setTimeout(() => rf.fitView({ padding: 0.18, duration: 420 }), 60);
    } else {
      rf.fitView({ padding: 0.18, duration: 420 });
    }
  };

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
      className="map-chrome-soft relative flex h-11 min-w-0 max-w-[calc(100vw-224px)] items-center gap-1 rounded-[18px] p-1 sm:max-w-none"
    >
      <button
        type="button"
        onClick={goHome}
        className="map-text-button group flex min-w-0 items-center gap-2.5 rounded-[14px] py-1 pl-1.5 pr-1 sm:pl-2 sm:pr-2.5"
        aria-label="Math Atlas — back to map"
        title="Back to map"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105"
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
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "map-field-button flex h-9 min-w-0 items-center gap-2 rounded-[14px] px-2.5 text-ui-control font-semibold sm:px-3",
          open && "is-active",
        )}
        style={!open ? { color: "var(--fg-1)" } : undefined}
        aria-label="Field selector"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <CaretDownIcon
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
          style={{
            color: open ? "var(--accent)" : "var(--fg-2)",
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
                type="button"
                onClick={() => {
                  setMap(id);
                  setOpen(false);
                }}
                className={cn(
                  "map-text-button flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5 text-left text-ui-control font-semibold",
                  active && "is-active",
                )}
                style={!active ? { color: "var(--fg-2)" } : undefined}
              >
                <span className="block min-w-0 flex-1 truncate">{MAPS[id].label}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0" weight="bold" />}
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
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="map-text-button flex h-9 min-w-9 items-center gap-2 rounded-[18px] px-2.5 text-ui-control md:min-w-[190px] md:px-3.5"
      style={{ color: "var(--fg-2)" }}
      aria-label="Open search"
    >
      <MagnifyingGlassIcon className="h-4 w-4 shrink-0" style={{ color: "var(--fg-3)" }} />
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

function AtlasButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "atlas";
  return (
    <DockButton
      onClick={() => setSurface("atlas")}
      active={active}
      label="Atlas map"
      title="Atlas map"
    >
      <CompassIcon className="h-4 w-4" weight="regular" />
    </DockButton>
  );
}

function DictionaryButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "dictionary";
  return (
    <DockButton
      onClick={() => setSurface(active ? "atlas" : "dictionary")}
      active={active}
      label="Dictionary"
      title={active ? "Back to atlas" : "Mathematical dictionary"}
    >
      <BookOpenTextIcon className="h-4 w-4" weight="regular" />
    </DockButton>
  );
}

function FlashcardsButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "flashcards";
  return (
    <DockButton
      onClick={() => setSurface(active ? "atlas" : "flashcards")}
      active={active}
      label="Flashcards"
      title={active ? "Back to atlas" : "Flashcards"}
    >
      <LightningIcon className="h-4 w-4" weight="regular" />
    </DockButton>
  );
}

function SandboxButton() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const active = surface === "sandbox";
  return (
    <DockButton
      onClick={() => setSurface(active ? "atlas" : "sandbox")}
      active={active}
      label="Sandbox"
      title={active ? "Back to atlas" : "Geometric sandbox"}
    >
      <CompassToolIcon className="h-4 w-4" weight="regular" />
    </DockButton>
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
      <DockButton
        onClick={() => {
          if (ref.current) setPosition(popoverPositionFor(ref.current));
          setOpen((o) => !o);
        }}
        active={open}
        expanded={open}
        label="Display settings"
        title="Display"
      >
        <SlidersHorizontalIcon className="h-4 w-4" weight="regular" />
      </DockButton>
      {open && position && <DisplayPopover popoverRef={popoverRef} position={position} />}
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
      <div className="flex flex-wrap items-center gap-3">
        {THEMES.map((t) => (
          <ThemeSwatch key={t.id} theme={t} active={t.id === theme} onClick={() => setTheme(t.id)} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function SchemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <DockButton
      onClick={() => setTheme(siblingOf(theme))}
      active={isDark}
      label={isDark ? "Switch to light scheme" : "Switch to dark scheme"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? <SunIcon className="h-4 w-4" weight="regular" /> : <MoonIcon className="h-4 w-4" weight="regular" />}
    </DockButton>
  );
}
