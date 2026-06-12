import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  CaretDownIcon,
  BookOpenTextIcon,
  CardsIcon,
  CompassToolIcon,
  CompassIcon,
  SlidersHorizontalIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  PencilSimpleIcon,
  PlusIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  ArrowCounterClockwiseIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useReactFlow } from "reactflow";
import { MAPS, type MapId } from "../data";
import { useStore } from "../store";
import { cn } from "../lib/utils";
import { THEMES, schemeFor, siblingOf } from "../lib/themes";
import { LogoMark } from "./Logo";
import { Pill, DockButton } from "./chrome/Pill";
import { Button } from "./chrome/Button";

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
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="pointer-events-auto relative flex w-full min-w-0 items-start justify-between gap-2.5 sm:gap-3">
        <MapBrandSelector />
        <div className="pointer-events-auto absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
          <Pill variant="soft" className="top-tools">
            <SearchBox />
          </Pill>
        </div>
        <div className="dock-scrollbar flex min-w-0 items-center justify-end gap-2.5 overflow-x-auto sm:flex-none">
          <Pill variant="soft" className="top-tools md:hidden">
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
            <EditToggle />
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
      className="map-chrome-soft relative flex h-11 min-w-0 max-w-[calc(100vw-224px)] items-center gap-1 rounded-[var(--radius-xl)] p-1 sm:max-w-none"
    >
      <Button
        kind="text"
        onClick={goHome}
        className="group flex min-w-0 items-center gap-2.5 rounded-[var(--radius-md)] py-1 pl-1.5 pr-1 sm:pl-2 sm:pr-2.5"
        aria-label="Math Atlas — back to map"
        title="Back to map"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-transform group-hover:scale-105"
          style={{
            background: "color-mix(in srgb, var(--surface) 78%, transparent)",
            boxShadow: "inset 0 0 0 1px var(--chrome-border)",
          }}
        >
          <LogoMark size={18} className="text-[color:var(--fg-1)]" />
        </span>
        <span className="hidden whitespace-nowrap font-serif text-atlas-brand text-fg-1 sm:inline">
          Math Atlas
        </span>
      </Button>
      <Button
        kind="field"
        active={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 min-w-0 items-center gap-2 rounded-[var(--radius-md)] px-2.5 text-ui-control font-sans sm:px-3.5",
          !open && "text-fg-1",
        )}
        aria-label="Field selector"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <CaretDownIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
            open ? "rotate-180 text-accent" : "text-fg-2",
          )}
        />
      </Button>
      {open && (
        <div className="map-popover absolute left-0 top-[60px] w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-[var(--radius-xl)] p-1.5 sm:w-[260px]">
          {(Object.keys(MAPS) as MapId[]).map((id) => {
            const active = id === mapId;
            return (
              <Button
                key={id}
                kind="text"
                active={active}
                onClick={() => {
                  setMap(id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-ui-control",
                  !active && "text-fg-2",
                )}
              >
                <span className="block min-w-0 flex-1 truncate">
                  {MAPS[id].label}
                </span>
                {active && (
                  <CheckIcon className="h-4 w-4 shrink-0" weight="bold" />
                )}
              </Button>
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
    <Button
      kind="text"
      onClick={() => setPaletteOpen(true)}
      className="flex h-9 min-w-9 items-center gap-2 rounded-[var(--radius-md)] px-2.5 text-ui-control text-fg-2 md:min-w-[190px] md:px-3.5"
      aria-label="Open search"
    >
      <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-fg-3" />
      <span className="hidden md:inline">Search the atlas</span>
      <kbd
        className="ml-auto hidden h-5 items-center rounded-[var(--radius-xs)] border px-1.5 font-mono text-ui-2xs text-fg-2 md:inline-flex"
        style={{
          background: "var(--chrome-hover)",
          borderColor: "var(--chrome-border)",
        }}
      >
        ⌘K
      </kbd>
    </Button>
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
      <CardsIcon className="h-4 w-4" />
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
      {open && position && (
        <DisplayPopover popoverRef={popoverRef} position={position} />
      )}
    </div>
  );
}

function ThemeSwatch({
  theme,
  active,
  onClick,
}: {
  theme: (typeof THEMES)[number];
  active: boolean;
  onClick: () => void;
}) {
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
      className="map-popover pointer-events-auto fixed z-50 w-[min(260px,calc(100vw-24px))] rounded-[var(--radius-2xl)] p-3"
      style={{ top: position.top, right: position.right }}
    >
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
          Theme
        </span>
        <span className="text-ui-meta font-medium text-fg-2">
          {activeLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {THEMES.map((t) => (
          <ThemeSwatch
            key={t.id}
            theme={t}
            active={t.id === theme}
            onClick={() => setTheme(t.id)}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function EditToggle() {
  const editMode = useStore((s) => s.editMode);
  const toggleEditMode = useStore((s) => s.toggleEditMode);
  const mapId = useStore((s) => s.mapId);
  const edited = useStore((s) => s.editedMaps.has(mapId));
  const openNodeEditor = useStore((s) => s.openNodeEditor);
  const currentEditSource = useStore((s) => s.currentEditSource);
  const importSource = useStore((s) => s.importSource);
  const revertMap = useStore((s) => s.revertMap);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        setConfirmDiscard(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmDiscard(false);
      }
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

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const exportSource = () => {
    const source = currentEditSource();
    if (!source) {
      showNotice("Map source is not loaded.");
      return;
    }
    const blob = new Blob([JSON.stringify(source, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapId}.source.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("Source JSON exported.");
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        const result = importSource(parsed);
        showNotice(
          result.ok
            ? "Source JSON imported."
            : `Import failed: ${result.error}`,
        );
      } catch {
        showNotice("Import failed: not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  // The pencil is a plain on/off toggle: turning edit mode on opens the toolbar,
  // turning it off closes it.
  const openPanel = () => {
    if (editMode) {
      toggleEditMode();
      setOpen(false);
      setConfirmDiscard(false);
    } else {
      toggleEditMode();
      if (ref.current) setPosition(popoverPositionFor(ref.current));
      setOpen(true);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <DockButton
        onClick={openPanel}
        active={editMode}
        label={editMode ? "Exit edit mode" : "Edit this map"}
        title={editMode ? "Exit edit mode" : "Edit this map"}
      >
        <PencilSimpleIcon
          className="h-4 w-4"
          weight={editMode ? "fill" : "regular"}
        />
      </DockButton>
      {edited && !editMode && (
        <span
          aria-hidden
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFile(file);
          e.target.value = "";
        }}
      />
      {open && position && (
        <EditMapPopover
          popoverRef={popoverRef}
          position={position}
          edited={edited}
          notice={notice}
          confirmDiscard={confirmDiscard}
          onNewConcept={() => {
            openNodeEditor({ mode: "create" });
            setOpen(false);
          }}
          onImport={() => fileRef.current?.click()}
          onExport={exportSource}
          onAskDiscard={() => setConfirmDiscard(true)}
          onKeep={() => setConfirmDiscard(false)}
          onDiscard={async () => {
            const result = await revertMap();
            setConfirmDiscard(false);
            showNotice(
              result.ok
                ? "Local edits discarded."
                : `Discard failed: ${result.error}`,
            );
          }}
          onDone={() => {
            toggleEditMode();
            setOpen(false);
            setConfirmDiscard(false);
          }}
        />
      )}
    </div>
  );
}

function EditMapPopover({
  popoverRef,
  position,
  edited,
  notice,
  confirmDiscard,
  onNewConcept,
  onImport,
  onExport,
  onAskDiscard,
  onKeep,
  onDiscard,
  onDone,
}: {
  popoverRef: RefObject<HTMLDivElement>;
  position: PopoverPosition;
  edited: boolean;
  notice: string | null;
  confirmDiscard: boolean;
  onNewConcept: () => void;
  onImport: () => void;
  onExport: () => void;
  onAskDiscard: () => void;
  onKeep: () => void;
  onDiscard: () => void;
  onDone: () => void;
}) {
  return createPortal(
    // Same glass-pill convention as the top chrome: soft chrome, radius-xl, the
    // `top-tools` scope for icon sizing, and shared `Button kind="icon"` states.
    <div
      ref={popoverRef}
      className="map-chrome-soft top-tools pointer-events-auto fixed z-50 flex items-center gap-1 rounded-[var(--radius-xl)] p-1"
      style={{ top: position.top, right: position.right }}
      role="dialog"
      aria-label="Edit map"
    >
      <Button
        kind="icon"
        accent
        onClick={onNewConcept}
        title="New concept"
        aria-label="New concept"
      >
        <PlusIcon className="h-4 w-4" weight="bold" />
      </Button>

      <ToolDivider />

      <Button kind="icon" onClick={onExport} title="Export source" aria-label="Export source">
        <DownloadSimpleIcon className="h-4 w-4" />
      </Button>
      <Button kind="icon" onClick={onImport} title="Import source" aria-label="Import source">
        <UploadSimpleIcon className="h-4 w-4" />
      </Button>

      {edited &&
        (confirmDiscard ? (
          <>
            <ToolDivider />
            <Button
              kind="icon"
              onClick={onDiscard}
              title="Confirm revert"
              aria-label="Confirm revert"
              className="text-danger"
            >
              <CheckIcon className="h-4 w-4" weight="bold" />
            </Button>
            <Button kind="icon" onClick={onKeep} title="Cancel revert" aria-label="Cancel revert">
              <XIcon className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <ToolDivider />
            <Button
              kind="icon"
              onClick={onAskDiscard}
              title="Revert edits"
              aria-label="Revert edits"
              className="text-danger"
            >
              <ArrowCounterClockwiseIcon className="h-4 w-4" />
            </Button>
          </>
        ))}

      <ToolDivider />

      <Button kind="icon" onClick={onDone} title="Done editing" aria-label="Done editing">
        <CheckIcon className="h-4 w-4" weight="bold" />
      </Button>

      {notice && (
        <div
          className="map-popover pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-2.5 py-1 text-ui-hint font-medium text-accent"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>,
    document.body,
  );
}

function ToolDivider() {
  return <div className="map-divider mx-0.5 h-5 w-px shrink-0 rounded-full" aria-hidden />;
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
      {isDark ? (
        <SunIcon className="h-4 w-4" weight="regular" />
      ) : (
        <MoonIcon className="h-4 w-4" weight="regular" />
      )}
    </DockButton>
  );
}
