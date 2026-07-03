import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Variable,
  WalletCards,
} from "lucide-react";
import { useStore, type Surface as SurfaceId } from "./store";
import { schemeFor, siblingOf } from "./themes";
import { authEnabled } from "@/auth/client";
import { cn } from "@/ui/cn";
import { usePopoverDismiss } from "./usePopover";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Button } from "@/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { Surface } from "@/design";
import { UserMenu } from "@/auth/UserMenu";
import { LogoMark } from "./Logo";

/** The single most-important affordance: a Maps-style search field → palette. */
function SearchField() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <Surface material="regular" className="rounded-full">
      <button
        type="button"
        className="flex h-11 w-full items-center gap-2 rounded-full px-4 text-muted-foreground transition-colors hover:bg-accent"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search concepts and theorems"
        title="Search concepts and theorems"
      >
        <Search className="size-[18px] shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left text-body">Search concepts, theorems…</span>
        <kbd className="shrink-0 rounded bg-foreground/[0.06] px-1.5 py-px font-mono text-caption">⌘K</kbd>
      </button>
    </Surface>
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

  // Open the listbox on the current map and move focus into it (HIG/WCAG listbox).
  useEffect(() => {
    if (!open) return;
    activeIndexRef.current = selectedIndex;
    const raf = requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
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
      <Surface material="regular" className="flex items-center rounded-full py-1 pr-1 pl-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => setSurface("atlas")}
          aria-label="Go to Atlas"
          title="Atlas"
        >
          <LogoMark className="size-7" size={28} />
        </Button>
        <button
          ref={triggerRef}
          type="button"
          className="flex h-9 items-center gap-1 rounded-full px-2.5 text-subhead font-medium text-foreground transition-colors hover:bg-accent"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Choose active map"
          title="Choose active map"
        >
          <span className="max-w-[180px] truncate">{title}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </Surface>
      {open && (
        <Surface
          material="thick"
          className="absolute top-[calc(100%+8px)] left-0 z-[var(--z-popover,40)] w-[280px] p-1.5"
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
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-subhead transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
                )}
                onClick={() => choose(entry.slug)}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                {active && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
          {catalog.length === 0 && <p className="px-2.5 py-3 text-caption text-muted-foreground">Loading maps…</p>}
        </Surface>
      )}
    </div>
  );
}

const SURFACES: { id: SurfaceId; label: string; Icon: typeof Compass }[] = [
  { id: "atlas", label: "Atlas", Icon: Compass },
  { id: "dictionary", label: "Index", Icon: BookOpen },
  { id: "flashcards", label: "Study", Icon: WalletCards },
  { id: "sandbox", label: "Sandbox", Icon: Variable },
];

/** Primary surface switch: Atlas (graph) / Index / Study / Sandbox. */
function SurfaceNav() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  return (
    <ToggleGroup
      type="single"
      value={surface}
      onValueChange={(v) => v && setSurface(v as SurfaceId)}
      aria-label="Surface navigation"
      className="gap-0.5"
    >
      {SURFACES.map(({ id, label, Icon }) => (
        <ToggleGroupItem
          key={id}
          value={id}
          title={label}
          className="h-9 gap-1.5 rounded-full px-3 text-footnote font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          <Icon className="size-4 shrink-0" />
          <span className="hidden md:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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
  const [revertOpen, setRevertOpen] = useState(false);

  if (surface !== "atlas" || mode === "paths" || !map) return null;

  const toggle = () => {
    if (!editMode) setMode("explore");
    toggleEditMode();
  };

  const mapTitle = map.data.label || mapId;

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative size-9", editMode ? "text-primary" : "text-foreground")}
        onClick={toggle}
        aria-pressed={editMode}
        aria-label={edited ? "Edit mode, unsaved changes" : "Edit mode"}
      >
        <Pencil className="size-[18px]" />
        {edited && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" aria-hidden />}
      </Button>
      {editMode && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-foreground"
            aria-label="New concept"
            title="New concept"
            onClick={() => openNodeEditor({ mode: "create" })}
          >
            <Plus className="size-[18px]" />
          </Button>
          {edited && (
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-foreground"
              aria-label="Revert edits"
              title="Revert edits"
              aria-haspopup="dialog"
              onClick={() => setRevertOpen(true)}
            >
              <RotateCcw className="size-[18px]" />
            </Button>
          )}
        </>
      )}
      <ConfirmDialog
        open={revertOpen}
        onOpenChange={setRevertOpen}
        title="Revert local edits?"
        description={<>This restores “{mapTitle}” to its last saved version. Your local changes can’t be recovered.</>}
        confirmLabel="Revert"
        destructive
        icon={<RotateCcw className="size-6" />}
        onConfirm={async () => {
          await revertMap();
        }}
      />
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-foreground"
      onClick={() => setTheme(siblingOf(theme))}
      aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={isDark ? "Light" : "Dark"}
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}

function TopRightControls() {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const showEditControls = surface === "atlas" && mode !== "paths" && Boolean(map);

  return (
    <div className="flex items-center gap-2">
      <Surface material="regular" className="rounded-full p-1">
        <SurfaceNav />
      </Surface>

      {showEditControls && (
        <Surface material="regular" className="rounded-full p-1">
          <EditControls />
        </Surface>
      )}

      <Surface material="regular" className="flex items-center rounded-full p-1">
        <ThemeToggle />
        {authEnabled && <UserMenu />}
      </Surface>
    </div>
  );
}

/**
 * Top glass islands: map leading, search centered, and semantically split
 * trailing controls. Floats above the content layer via the `top-chrome` grid.
 */
export function TopChrome() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-(--z-shell) grid grid-cols-[minmax(0,1fr)_minmax(260px,clamp(280px,34vw,520px))_minmax(0,1fr)] items-start gap-3 px-[var(--shell-edge)] py-3 max-[980px]:grid-cols-1 max-[980px]:gap-2 max-[980px]:py-2.5">
      <div className="pointer-events-auto min-w-0 justify-self-start max-[980px]:justify-self-start">
        <MapMenu />
      </div>
      <div className="pointer-events-auto w-full min-w-0 justify-self-center max-[980px]:hidden">
        <SearchField />
      </div>
      <div className="pointer-events-auto min-w-0 justify-self-end max-[980px]:justify-self-center">
        <TopRightControls />
      </div>
    </div>
  );
}
