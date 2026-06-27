import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
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
import { usePopoverDismiss } from "../../hooks/usePopover";
import { Glass, GlassControlGroup, ShellButton, ShellIconButton, ShellSegmented } from "../primitives";
import { UserMenu } from "../auth/UserMenu";
import { LogoMark } from "../Logo";

/** The single most-important affordance: a Maps-style search field → palette. */
function SearchField() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <Glass material="regular" className="shell-search">
      <button
        type="button"
        className="shell-search-button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search concepts and theorems"
        title="Search concepts and theorems"
      >
        <MagnifyingGlassIcon className="shell-icon" weight="regular" />
        <span className="shell-search-label">Search concepts, theorems…</span>
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const title = catalog.find((e) => e.slug === mapId)?.title ?? mapId;
  const selectedIndex = Math.max(
    0,
    catalog.findIndex((e) => e.slug === mapId),
  );
  const activeIndexRef = useRef(selectedIndex);

  usePopoverDismiss({ open, onClose: close, containerRef: ref, triggerRef });

  // Open the listbox on the current map and move focus into it, so the dropdown
  // is operable from the keyboard (HIG/WCAG listbox pattern).
  useEffect(() => {
    if (!open) return;

    activeIndexRef.current = selectedIndex;

    const raf = requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [open, selectedIndex]);

  const onListKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (catalog.length === 0) return;

    const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
    const fromIndex = currentIndex >= 0 ? currentIndex : activeIndexRef.current;

    let nextIndex: number;

    if (e.key === "ArrowDown") nextIndex = (fromIndex + 1) % catalog.length;
    else if (e.key === "ArrowUp") nextIndex = (fromIndex - 1 + catalog.length) % catalog.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = catalog.length - 1;
    else return;

    e.preventDefault();
    activeIndexRef.current = nextIndex;
    optionRefs.current[nextIndex]?.focus();
  };

  const choose = (slug: string) => {
    if (slug !== mapId) setMap(slug);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative" ref={ref}>
      <Glass material="regular" className="shell-map-menu">
        <ShellIconButton
          className="shell-map-mark"
          onClick={() => setSurface("atlas")}
          aria-label="Go to Atlas"
          title="Atlas"
        >
          <LogoMark className="h-7 w-7" size={28} />
        </ShellIconButton>
        <ShellButton
          ref={triggerRef}
          type="button"
          shape="pill"
          className="shell-map-title"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Choose active map"
          title="Choose active map"
        >
          <span className="shell-map-title-label">{title}</span>
          <CaretDownIcon className="shell-caret-icon" weight="bold" />
        </ShellButton>
      </Glass>
      {open && (
        <Glass
          material="thick"
          className="shell-panel absolute left-0 top-[calc(100%+8px)] z-30 w-70 p-1.5"
          role="listbox"
          aria-label="Active map"
          onKeyDown={onListKeyDown}
        >
          {catalog.map((entry, i) => {
            const active = entry.slug === mapId;
            return (
              <button
                key={entry.slug}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                className={cn("shell-menu-option", active && "is-active")}
                onClick={() => choose(entry.slug)}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0 text-fg-2" weight="bold" />}
              </button>
            );
          })}
          {catalog.length === 0 && <p className="px-2.5 py-3 text-caption-1 text-fg-3">Loading maps…</p>}
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
    <ShellSegmented
      label="Surface navigation"
      value={surface}
      onChange={setSurface}
      hideLabels="responsive"
      className="shell-surface-nav"
      options={SURFACES.map(({ id, label, Icon }) => ({
        id,
        label,
        icon: <Icon className="shell-icon" weight="regular" />,
      }))}
    />
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
      <ShellIconButton
        active={editMode}
        onClick={toggle}
        className="shell-edit-toggle"
        aria-pressed={editMode}
        aria-label={edited ? "Edit mode, unsaved changes" : "Edit mode"}
      >
        <PencilSimpleIcon className="shell-icon" weight="regular" />
        {edited && <span className="shell-edit-badge" aria-hidden />}
      </ShellIconButton>
      {editMode && (
        <>
          <ShellIconButton
            aria-label="New concept"
            title="New concept"
            onClick={() => openNodeEditor({ mode: "create" })}
          >
            <PlusIcon className="shell-icon" weight="regular" />
          </ShellIconButton>

          {edited && (
            <ShellIconButton aria-label="Revert edits" title="Revert edits" onClick={revert}>
              <ArrowCounterClockwiseIcon className="shell-icon" />
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
        <SunIcon className="shell-icon" weight="regular" />
      ) : (
        <MoonIcon className="shell-icon" weight="regular" />
      )}
    </ShellIconButton>
  );
}

function TopRightControls() {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const showEditControls = surface === "atlas" && mode !== "paths" && Boolean(map);

  return (
    <div className="shell-top-right-stack">
      <GlassControlGroup className="shell-surface-island">
        <SurfaceNav />
      </GlassControlGroup>

      {showEditControls && (
        <GlassControlGroup className="shell-edit-island">
          <EditControls />
        </GlassControlGroup>
      )}

      <GlassControlGroup className="shell-global-island">
        <ThemeToggle />
        {authEnabled && <UserMenu />}
      </GlassControlGroup>
    </div>
  );
}

/**
 * Top Liquid Glass islands: map leading, search centered, and semantically split
 * trailing controls. Floats above the content layer; on narrow widths it wraps
 * gracefully.
 */
export function TopChrome() {
  return (
    <div className="top-chrome">
      <div className="top-chrome-map">
        <MapMenu />
      </div>
      <div className="top-chrome-search">
        <SearchField />
      </div>
      <div className="top-chrome-right">
        <TopRightControls />
      </div>
    </div>
  );
}
