import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  CompassIcon,
  BookOpenIcon,
  CardsIcon,
  FunctionIcon,
  SunIcon,
  MoonIcon,
  CaretDownIcon,
  CheckIcon,
  PencilSimpleIcon,
  PlusIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { useStore, type Surface } from "../../store";
import { schemeFor, siblingOf } from "../../lib/themes";
import { authEnabled } from "../../lib/authClient";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";
import { ShellButton, ShellIconButton } from "./Controls";
import { UserMenu } from "../auth/UserMenu";

const BRAND_SRC = `${import.meta.env.BASE_URL}atlas-assets/logo-mark.svg`;

/** The single most-important affordance: a Maps-style search field → palette. */
function SearchField() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <Glass material="regular" className="shell-search">
      <button
        type="button"
        className="flex h-full w-full items-center gap-2 outline-none"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search concepts and theorems"
      >
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0" weight="bold" />
        <span className="min-w-0 flex-1 truncate text-left">Search concepts, theorems…</span>
        <kbd className="shell-search-kbd">⌘K</kbd>
      </button>
    </Glass>
  );
}

/** Brand mark + active-map dropdown (switches between catalog maps). */
function MapMenu() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const setSurface = useStore((s) => s.setSurface);
  const catalog = useStore((s) => s.catalog);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const title = catalog.find((e) => e.slug === mapId)?.title ?? mapId;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Glass material="regular" className="shell-map-menu">
        <button
          type="button"
          className="shell-map-mark shell-btn shell-btn-round"
          onClick={() => setSurface("atlas")}
          aria-label="Go to Atlas"
          title="Atlas"
        >
          <img src={BRAND_SRC} alt="" className="h-7 w-7" />
        </button>
        <ShellButton
          type="button"
          className="shell-map-title"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate font-semibold text-fg-1">{title}</span>
          <CaretDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" weight="bold" />
        </ShellButton>
      </Glass>
      {open && (
        <Glass
          material="thick"
          className="shell-panel absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] p-1.5"
          role="listbox"
        >
          {catalog.map((entry) => {
            const active = entry.slug === mapId;
            return (
              <button
                key={entry.slug}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "shell-menu-option",
                  active ? "text-fg-1" : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
                )}
                onClick={() => {
                  if (!active) setMap(entry.slug);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0 text-fg-2" weight="bold" />}
              </button>
            );
          })}
          {catalog.length === 0 && <p className="px-2.5 py-3 text-ui-xs text-fg-3">Loading maps…</p>}
        </Glass>
      )}
    </div>
  );
}

const SURFACES: { id: Surface; label: string; Icon: typeof CompassIcon }[] = [
  { id: "atlas", label: "Atlas", Icon: CompassIcon },
  { id: "dictionary", label: "Index", Icon: BookOpenIcon },
  { id: "flashcards", label: "Study", Icon: CardsIcon },
  { id: "sandbox", label: "Sandbox", Icon: FunctionIcon },
];

/** Primary surface switch: Atlas (graph) / Index / Study / Sandbox. */
function SurfaceNav() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  return (
    <div className="shell-seg shell-surface-nav" role="tablist" aria-label="View">
      {SURFACES.map(({ id, label, Icon }) => {
        const active = surface === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            title={label}
            className={cn("shell-seg-opt", active && "is-active")}
            onClick={() => setSurface(id)}
          >
            <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function EditControls() {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const editMode = useStore((s) => s.editMode);
  const toggleEditMode = useStore((s) => s.toggleEditMode);
  const edited = useStore((s) => s.editedMaps.has(s.mapId));
  const selectedId = useStore((s) => s.selectedId);
  const openNodeEditor = useStore((s) => s.openNodeEditor);
  const revertMap = useStore((s) => s.revertMap);

  if (surface !== "atlas" || mode === "paths" || !map) return null;

  const toggle = () => {
    if (!editMode) setMode("explore");
    toggleEditMode();
  };

  const revert = () => {
    if (!window.confirm(`Revert local edits to ${mapId}?`)) return;
    void revertMap();
  };

  return (
    <div className="shell-edit-controls">
      <ShellButton active={editMode} onClick={toggle} className="shell-edit-toggle" aria-pressed={editMode}>
        <PencilSimpleIcon className="h-4 w-4" weight={editMode ? "fill" : "regular"} />
        <span>Edit</span>
        {edited && <span className="shell-status-dot" aria-label="Edited map" />}
      </ShellButton>
      {editMode && (
        <>
          <ShellIconButton
            aria-label="New concept"
            title="New concept"
            onClick={() => openNodeEditor({ mode: "create" })}
          >
            <PlusIcon className="h-4 w-4" weight="bold" />
          </ShellIconButton>
          {selectedId && (
            <ShellIconButton
              aria-label="Edit selected concept"
              title="Edit selected concept"
              onClick={() => openNodeEditor({ mode: "edit", nodeId: selectedId })}
            >
              <PencilSimpleIcon className="h-4 w-4" />
            </ShellIconButton>
          )}
          {edited && (
            <ShellIconButton aria-label="Revert edits" title="Revert edits" onClick={revert}>
              <ArrowCounterClockwiseIcon className="h-4 w-4" />
            </ShellIconButton>
          )}
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <ShellIconButton
      type="button"
      onClick={() => setTheme(siblingOf(theme))}
      aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" weight="regular" />
      ) : (
        <MoonIcon className="h-4 w-4" weight="regular" />
      )}
    </ShellIconButton>
  );
}

function TopToolbar() {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const showEditControls = surface === "atlas" && mode !== "paths" && Boolean(map);

  return (
    <Glass material="regular" className="top-toolbar">
      {showEditControls && (
        <>
          <EditControls />
          <div className="top-toolbar-divider" aria-hidden />
        </>
      )}
      <SurfaceNav />
      <div className="top-toolbar-divider" aria-hidden />
      <ThemeToggle />
      {authEnabled && <UserMenu />}
    </Glass>
  );
}

/**
 * The top Liquid Glass bar: the active-map menu and search field on the leading
 * side, the surface switch and appearance/account controls trailing. Floats
 * above the content layer; on narrow widths it wraps gracefully.
 */
export function TopChrome() {
  return (
    <div className="top-chrome">
      <div className="top-chrome-leading">
        <MapMenu />
      </div>
      <div className="top-chrome-search">
        <SearchField />
      </div>
      <div className="top-chrome-trailing">
        <TopToolbar />
      </div>
    </div>
  );
}
