import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleStop,
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
import { usePopoverDismiss } from "./usePopover";
import { useShellActions } from "./ShellActions";
import { LogoLockup, LogoMark } from "./Logo";
import { PaletteSearchButton } from "./PaletteSearchButton";

import { UserMenu } from "@/auth/UserMenu";
import { Surface } from "@/design";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";

import "./shell.css";

function Brand() {
  const setSurface = useStore((state) => state.setSurface);
  const setMode = useStore((state) => state.setMode);

  return (
    <Button
      variant="ghost"
      className="
        h-9 min-w-0 rounded-full px-2
        text-foreground
        hover:bg-accent
        active:bg-secondary
        has-[>svg]:px-2
      "
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

/**
 * Persistent field context.
 * Switching fields preserves the current product surface.
 */
function FieldMenu() {
  const mapId = useStore((state) => state.mapId);
  const setMap = useStore((state) => state.setMap);
  const catalog = useStore((state) => state.catalog);
  const loadingMapId = useStore((state) => state.loadingMapId);

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const title = catalog.find((entry) => entry.slug === mapId)?.title ?? mapId;

  const selectedIndex = Math.max(
    0,
    catalog.findIndex((entry) => entry.slug === mapId),
  );

  usePopoverDismiss({
    open,
    onClose: close,
    containerRef: ref,
    triggerRef,
  });

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open, selectedIndex]);

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!catalog.length) return;

    const activeElement = document.activeElement as HTMLButtonElement;
    const current = optionRefs.current.indexOf(activeElement);
    const from = current >= 0 ? current : selectedIndex;

    let next: number | null = null;

    if (event.key === "ArrowDown") {
      next = (from + 1) % catalog.length;
    }

    if (event.key === "ArrowUp") {
      next = (from - 1 + catalog.length) % catalog.length;
    }

    if (event.key === "Home") {
      next = 0;
    }

    if (event.key === "End") {
      next = catalog.length - 1;
    }

    if (next === null) return;

    event.preventDefault();
    optionRefs.current[next]?.focus();
  };

  const choose = (slug: string) => {
    if (slug !== mapId) {
      setMap(slug);
    }

    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative min-w-0" ref={ref}>
      <Button
        ref={triggerRef}
        variant="ghost"
        className="
          h-9 w-full max-w-[220px] min-w-0
          gap-1 rounded-full px-2.5
          text-footnote font-medium text-foreground
          hover:bg-accent
          active:bg-secondary
          has-[>svg]:px-2.5
          max-[820px]:max-w-full
        "
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Active field: ${title}`}
        title="Choose active field"
      >
        <span className="truncate">{loadingMapId ? "Loading…" : title}</span>

        <ChevronDown
          className={cn("size-3 shrink-0 text-tertiary-foreground transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && (
        <Surface
          material="thick"
          className="
            shell-field-popover shell-popover-present
            absolute top-[calc(100%+8px)] left-0
            z-(--z-popover)
            w-[min(300px,calc(100vw-20px))]
            overflow-y-auto p-1.5
          "
          role="dialog"
          aria-label="Choose mathematical field"
          onKeyDown={onListKeyDown}
        >
          <div className="flex items-center justify-between gap-2 px-2.5 pt-1 pb-1">
            <span className="text-caption-2 font-semibold tracking-label-tight text-muted-foreground uppercase">
              Mathematical field
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="
                size-8 rounded-full
                text-muted-foreground
                hover:bg-accent hover:text-foreground
                active:bg-secondary
                max-[820px]:size-11
              "
              onClick={() => {
                close();

                requestAnimationFrame(() => {
                  triggerRef.current?.focus();
                });
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
                    `
                      flex min-h-10 w-full items-center gap-2
                      rounded-sm px-2.5 max-[820px]:min-h-11
                      text-left text-footnote
                      transition-colors
                    `,
                    active ? "bg-primary/10 text-primary-text" : "text-foreground hover:bg-accent",
                  )}
                  onClick={() => {
                    choose(entry.slug);
                  }}
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

const SURFACES: {
  id: SurfaceId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "atlas",
    label: "Atlas",
    Icon: LogoMark,
  },
  {
    id: "dictionary",
    label: "Index",
    Icon: BookOpen,
  },
  {
    id: "flashcards",
    label: "Study",
    Icon: WalletCards,
  },
  {
    id: "sandbox",
    label: "Sandbox",
    Icon: Variable,
  },
];

function SurfaceNav({ mobile = false }: { mobile?: boolean }) {
  const surface = useStore((state) => state.surface);
  const setSurface = useStore((state) => state.setSurface);

  return (
    <ToggleGroup
      type="single"
      value={surface}
      onValueChange={(value) => {
        if (value) setSurface(value as SurfaceId);
      }}
      aria-label="Product navigation"
      className={cn("gap-0.5 rounded-full", mobile && "grid w-full grid-cols-4")}
    >
      {SURFACES.map(({ id, label, Icon }) => (
        <ToggleGroupItem
          key={id}
          value={id}
          title={label}
          className={cn(
            `
              h-10 gap-1.5 rounded-full px-3
              text-footnote font-medium text-muted-foreground
              transition-[color,background-color,box-shadow]
              hover:bg-accent hover:text-foreground
              data-[state=on]:bg-card
              data-[state=on]:text-foreground
              data-[state=on]:shadow-sm
            `,
            mobile && "h-11 flex-col gap-0.5 px-1 text-caption-2",
          )}
        >
          <Icon className="size-4.5 shrink-0" />
          <span className={mobile ? "" : "shell-nav-label"}>{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function EditControls() {
  const surface = useStore((state) => state.surface);
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const mapId = useStore((state) => state.mapId);
  const map = useStore((state) => state.loadedMaps[state.mapId]);
  const editMode = useStore((state) => state.editMode);
  const toggleEditMode = useStore((state) => state.toggleEditMode);
  const edited = useStore((state) => state.editedMaps.has(state.mapId));
  const openNodeEditor = useStore((state) => state.openNodeEditor);
  const revertMap = useStore((state) => state.revertMap);

  const [revertOpen, setRevertOpen] = useState(false);

  if (surface !== "atlas" || mode === "paths" || !map) {
    return null;
  }

  return (
    <>
      <div className="shell-context">
        <Button
          variant="ghost"
          className={cn(
            `
              h-9 gap-1.5 rounded-full px-2.5 text-footnote font-medium
              hover:bg-accent
              active:bg-secondary
              has-[>svg]:px-2.5
            `,
            editMode ? "bg-primary/10 text-primary-text" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            if (!editMode) {
              setMode("explore");
            }

            toggleEditMode();
          }}
          aria-pressed={editMode}
          aria-label={edited ? "Edit mode, local changes" : "Edit mode"}
          title="Edit map"
        >
          <Pencil className="size-4" />

          <span className="shell-nav-label">Edit</span>

          {edited && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
        </Button>

        {editMode && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="
                size-9 rounded-full
                text-muted-foreground
                hover:bg-accent hover:text-foreground
                active:bg-secondary
              "
              aria-label="New concept"
              title="New concept"
              onClick={() => {
                openNodeEditor({
                  mode: "create",
                });
              }}
            >
              <Plus className="size-4" />
            </Button>

            {edited && (
              <Button
                variant="ghost"
                size="icon"
                className="
                  size-9 rounded-full
                  text-muted-foreground
                  hover:bg-accent hover:text-foreground
                  active:bg-secondary
                "
                aria-label="Revert edits"
                title="Revert edits"
                onClick={() => {
                  setRevertOpen(true);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={revertOpen}
        onOpenChange={setRevertOpen}
        title="Revert local edits?"
        description={
          <>
            This restores “{map.data.label || mapId}” to its last saved version. Your local changes can’t be recovered.
          </>
        }
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
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const dark = schemeFor(theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="
        shell-theme size-9 rounded-full
        text-muted-foreground
        hover:bg-accent hover:text-foreground
        active:bg-secondary
      "
      onClick={() => {
        setTheme(siblingOf(theme));
      }}
      aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={dark ? "Light appearance" : "Dark appearance"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function AtlasPathControls() {
  const surface = useStore((state) => state.surface);
  const mode = useStore((state) => state.mode);
  const sequenceLength = useStore((state) => state.routeSequence.length);
  const tourIndex = useStore((state) => state.tourIndex);
  const startTour = useStore((state) => state.startTour);
  const tourStep = useStore((state) => state.tourStep);
  const endTour = useStore((state) => state.endTour);

  if (surface !== "atlas" || mode !== "paths" || sequenceLength === 0) {
    return null;
  }

  if (tourIndex === null) {
    return (
      <div className="shell-context">
        <Button
          variant="ghost"
          className="
            h-9 gap-1.5 rounded-full px-2.5 text-footnote font-medium
            text-muted-foreground
            hover:bg-accent hover:text-foreground
            active:bg-secondary
            has-[>svg]:px-2.5
          "
          onClick={startTour}
          title="Start guided tour"
        >
          <Play className="size-4" />

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
        className="
          size-9 rounded-full
          text-muted-foreground
          hover:bg-accent hover:text-foreground
          active:bg-secondary
        "
        onClick={() => {
          tourStep(-1);
        }}
        disabled={tourIndex === 0}
        aria-label="Previous tour step"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="
          size-9 rounded-full
          text-muted-foreground
          hover:bg-accent hover:text-foreground
          active:bg-secondary
        "
        onClick={() => {
          tourStep(1);
        }}
        disabled={tourIndex >= sequenceLength - 1}
        aria-label="Next tour step"
      >
        <ChevronRight className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="
          size-9 rounded-full
          text-muted-foreground
          hover:bg-accent hover:text-foreground
          active:bg-secondary
        "
        onClick={endTour}
        aria-label="End guided tour"
      >
        <CircleStop className="size-4" />
      </Button>
    </div>
  );
}

function ProductContextControls() {
  const surface = useStore((state) => state.surface);
  const actions = useShellActions(surface);

  if (!actions.length) {
    return null;
  }

  return (
    <div className="shell-context" aria-label="Page actions">
      {actions.map(({ id, label, icon: Icon, onSelect, disabled, pressed, status }) => (
        <Button
          key={id}
          variant="ghost"
          className={cn(
            `
                h-9 gap-1.5 rounded-full px-2.5 text-footnote font-medium
                text-muted-foreground
                hover:bg-accent hover:text-foreground
                active:bg-secondary
                has-[>svg]:px-2.5
              `,
            pressed && "bg-primary/10 text-primary-text",
            status && "text-success",
          )}
          onClick={status ? undefined : onSelect}
          disabled={disabled && !status}
          aria-disabled={status || undefined}
          aria-pressed={pressed}
          title={label}
        >
          <Icon className="size-4" />

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

            <span className="shell-divider shell-divider--trailing" aria-hidden />

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
