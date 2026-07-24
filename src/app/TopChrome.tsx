import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Compass,
  Moon,
  Pencil,
  Plus,
  Play,
  RotateCcw,
  Sun,
  Variable,
  WalletCards,
  X,
} from "lucide-react";
import { useStore, type Surface as SurfaceId } from "./store";
import { schemeFor, siblingOf } from "./themes";
import { cn } from "@/ui/cn";
import { usePopoverDismiss } from "./usePopover";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Button } from "@/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { Surface } from "@/design";
import { UserMenu } from "@/auth/UserMenu";
import { LogoLockup } from "./Logo";
import { PaletteSearchButton } from "./PaletteSearchButton";
import { useShellActions } from "./ShellActions";
import "./shell.css";

function Brand() {
  const setSurface = useStore((s) => s.setSurface);
  const setMode = useStore((s) => s.setMode);

  return (
    <Button
      variant="ghost"
      className="h-10 min-w-0 rounded-full px-2.5 text-foreground has-[>svg]:px-2.5"
      onClick={() => {
        setSurface("atlas");
        setMode("explore");
      }}
      aria-label="Math Atlas home"
      title="Math Atlas"
    >
      <LogoLockup />
    </Button>
  );
}

/** Persistent field context. Switching fields preserves the current product surface. */
function FieldMenu() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const catalog = useStore((s) => s.catalog);
  const loadingMapId = useStore((s) => s.loadingMapId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const title = catalog.find((entry) => entry.slug === mapId)?.title ?? mapId;
  const selectedIndex = Math.max(
    0,
    catalog.findIndex((entry) => entry.slug === mapId),
  );

  usePopoverDismiss({ open, onClose: close, containerRef: ref, triggerRef });

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, selectedIndex]);

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!catalog.length) return;
    const current = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
    const from = current >= 0 ? current : selectedIndex;
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (from + 1) % catalog.length;
    if (event.key === "ArrowUp") next = (from - 1 + catalog.length) % catalog.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = catalog.length - 1;
    if (next === null) return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
  };

  const choose = (slug: string) => {
    if (slug !== mapId) setMap(slug);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative min-w-0" ref={ref}>
      <Button
        ref={triggerRef}
        variant="ghost"
        className="h-10 w-full max-w-[220px] min-w-0 gap-1.5 rounded-full px-2.5 text-subhead font-medium text-foreground has-[>svg]:px-2.5 max-[820px]:max-w-full"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Active field: ${title}`}
        title="Choose active field"
      >
        <span className="truncate">{loadingMapId ? "Loading…" : title}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <Surface
          material="thick"
          className="shell-field-popover shell-popover-present absolute top-[calc(100%+10px)] left-0 z-(--z-popover) w-[min(300px,calc(100vw-20px))] overflow-y-auto p-1.5"
          role="dialog"
          aria-label="Choose mathematical field"
          onKeyDown={onListKeyDown}
        >
          <div className="flex items-center justify-between gap-2 px-2.5 pt-1 pb-1">
            <span className="text-caption font-semibold tracking-wide text-muted-foreground">Mathematical field</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground"
              onClick={() => {
                close();
                requestAnimationFrame(() => triggerRef.current?.focus());
              }}
              aria-label="Close field selector"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div role="listbox" aria-label="Mathematical field">
            {catalog.map((entry, index) => {
              const active = entry.slug === mapId;
              return (
                <button
                  key={entry.slug}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-subhead transition-colors",
                    active ? "bg-primary/10 text-primary-text" : "text-foreground hover:bg-accent",
                  )}
                  onClick={() => choose(entry.slug)}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
            {!catalog.length && <p className="px-2.5 py-3 text-caption text-muted-foreground">Loading fields…</p>}
          </div>
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

function SurfaceNav({ mobile = false }: { mobile?: boolean }) {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);

  return (
    <ToggleGroup
      type="single"
      value={surface}
      onValueChange={(value) => value && setSurface(value as SurfaceId)}
      aria-label="Product navigation"
      className={cn("gap-0.5", mobile && "grid w-full grid-cols-4")}
    >
      {SURFACES.map(({ id, label, Icon }) => (
        <ToggleGroupItem
          key={id}
          value={id}
          title={label}
          className={cn(
            "h-10 gap-1.5 rounded-full px-3 text-footnote font-medium text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            mobile && "h-11 flex-col gap-0.5 px-1 text-caption-2",
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className={mobile ? "" : "shell-nav-label"}>{label}</span>
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

  return (
    <>
      <div className="shell-context">
        <Button
          variant="ghost"
          className={cn("h-10 gap-1.5 rounded-full px-3 has-[>svg]:px-3", editMode ? "text-primary-text" : "text-muted-foreground")}
          onClick={() => {
            if (!editMode) setMode("explore");
            toggleEditMode();
          }}
          aria-pressed={editMode}
          aria-label={edited ? "Edit mode, local changes" : "Edit mode"}
          title="Edit map"
        >
          <Pencil className="size-[17px]" />
          <span className="shell-nav-label">Edit</span>
          {edited && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
        </Button>
        {editMode && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full text-muted-foreground"
              aria-label="New concept"
              title="New concept"
              onClick={() => openNodeEditor({ mode: "create" })}
            >
              <Plus className="size-[17px]" />
            </Button>
            {edited && (
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full text-muted-foreground"
                aria-label="Revert edits"
                title="Revert edits"
                onClick={() => setRevertOpen(true)}
              >
                <RotateCcw className="size-[17px]" />
              </Button>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={revertOpen}
        onOpenChange={setRevertOpen}
        title="Revert local edits?"
        description={<>This restores “{map.data.label || mapId}” to its last saved version. Your local changes can’t be recovered.</>}
        confirmLabel="Revert"
        destructive
        icon={<RotateCcw className="size-6" />}
        onConfirm={async () => {
          await revertMap();
        }}
      />
    </>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const dark = schemeFor(theme) === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shell-theme size-10 rounded-full text-muted-foreground"
      onClick={() => setTheme(siblingOf(theme))}
      aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={dark ? "Light appearance" : "Dark appearance"}
    >
      {dark ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
    </Button>
  );
}

function AtlasPathControls() {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const sequenceLength = useStore((s) => s.routeSequence.length);
  const tourIndex = useStore((s) => s.tourIndex);
  const startTour = useStore((s) => s.startTour);
  const tourStep = useStore((s) => s.tourStep);
  const endTour = useStore((s) => s.endTour);

  if (surface !== "atlas" || mode !== "paths" || sequenceLength === 0) return null;

  if (tourIndex === null) {
    return (
      <div className="shell-context">
        <Button
          variant="ghost"
          className="h-10 gap-1.5 rounded-full px-3 text-muted-foreground has-[>svg]:px-3"
          onClick={startTour}
          title="Start guided tour"
        >
          <Play className="size-[17px]" />
          <span className="shell-nav-label">Start tour</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="shell-context" aria-label="Guided tour">
      <span className="px-1.5 font-mono text-caption tabular-nums text-muted-foreground">
        {tourIndex + 1}/{sequenceLength}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full text-muted-foreground"
        onClick={() => tourStep(-1)}
        disabled={tourIndex === 0}
        aria-label="Previous tour step"
      >
        <ChevronLeft className="size-[17px]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full text-muted-foreground"
        onClick={() => tourStep(1)}
        disabled={tourIndex >= sequenceLength - 1}
        aria-label="Next tour step"
      >
        <ChevronRight className="size-[17px]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full text-muted-foreground"
        onClick={endTour}
        aria-label="End guided tour"
      >
        <CircleStop className="size-[17px]" />
      </Button>
    </div>
  );
}

function ProductContextControls() {
  const surface = useStore((s) => s.surface);
  const actions = useShellActions(surface);
  if (!actions.length) return null;

  return (
    <div className="shell-context" aria-label="Page actions">
      {actions.map(({ id, label, icon: Icon, onSelect, disabled, pressed, status }) => (
        <Button
          key={id}
          variant="ghost"
          className={cn(
            "h-10 gap-1.5 rounded-full px-3 text-muted-foreground has-[>svg]:px-3",
            pressed && "bg-primary/10 text-primary-text",
            status && "text-success",
          )}
          onClick={status ? undefined : onSelect}
          disabled={disabled && !status}
          aria-disabled={status || undefined}
          aria-pressed={pressed}
          title={label}
        >
          <Icon className="size-[17px]" />
          <span className="shell-nav-label">{label}</span>
        </Button>
      ))}
    </div>
  );
}

export function TopChrome() {
  return (
    <>
      <header className="shell-topbar" aria-label="Math Atlas">
        <Surface material="regular" className="shell-top-surface">
          <div className="shell-leading">
            <Brand />
            <span className="shell-divider" aria-hidden />
            <FieldMenu />
          </div>

          <div className="shell-search">
            <PaletteSearchButton compact />
          </div>

          <div className="shell-desktop-nav justify-self-end">
            <Surface material="ultrathin" specular={false} className="rounded-full p-0.5 shadow-none">
              <SurfaceNav />
            </Surface>
          </div>

          <div className="shell-trailing">
            <EditControls />
            <AtlasPathControls />
            <ProductContextControls />
            <ThemeToggle />
            <UserMenu showLabel />
          </div>
        </Surface>
      </header>

      <nav className="shell-mobile-nav" aria-label="Product navigation">
        <Surface material="regular">
          <SurfaceNav mobile />
        </Surface>
      </nav>
    </>
  );
}
