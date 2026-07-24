import { Dialog } from "radix-ui";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { BookOpen, CornerDownLeft, Map as MapIcon, Pencil, Route, Variable, WalletCards, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { ModalShell } from "@/ui/modal-shell";
import { Surface } from "@/design";
import { useStore } from "./store";
import { getDomainTone } from "@/atlas/colors";
import { kindIcon } from "@/atlas/nodeCategoryIcons";
import { KIND_LABEL } from "@/maps/types";
import { MathText } from "@/math/MathText";
import { rememberPaletteReturnFocus, restorePaletteReturnFocus } from "./paletteFocus";
import { Button } from "@/ui/button";
import { LogoMark } from "./Logo";

export function CommandPalette() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const data = map?.data;
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const setMode = useStore((s) => s.setMode);
  const setMap = useStore((s) => s.setMap);
  const catalog = useStore((s) => s.catalog);
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const editMode = useStore((s) => s.editMode);
  const toggleEditMode = useStore((s) => s.toggleEditMode);
  const [query, setQuery] = useState("");

  const setPaletteOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setQuery("");
      setOpen(nextOpen);
    },
    [setOpen],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const nextOpen = !useStore.getState().paletteOpen;
        if (nextOpen && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          rememberPaletteReturnFocus(document.activeElement);
        }
        setPaletteOpen(nextOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  return (
    <ModalShell
      open={open}
      onOpenChange={setPaletteOpen}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        restorePaletteReturnFocus();
      }}
      aria-describedby={undefined}
      contentClassName="inset-x-0 top-[12%] mx-auto w-[min(680px,calc(100vw-24px))]"
    >
      <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
      <Surface material="thick" elevation="overlay" reactive className="overflow-hidden">
        <Command loop className="bg-transparent text-foreground">
          <div className="relative">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              aria-label="Search Math Atlas"
              placeholder="Search concepts, definitions, theorems…"
              className="pr-8"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-9 rounded-full text-muted-foreground"
              onClick={() => setPaletteOpen(false)}
              aria-label="Close search"
            >
              <X className="size-4" />
            </Button>
          </div>
          <CommandList className="max-h-[min(62vh,440px)]">
            <CommandEmpty>No matching destination, field, concept, or command</CommandEmpty>

            <CommandGroup heading="Go to">
              <PaletteDestination
                value="go atlas map explore canvas"
                label="Atlas"
                detail="Explore the active field"
                icon={LogoMark}
                badge={surface === "atlas" && mode === "explore" ? "Current" : undefined}
                onSelect={() => {
                  setSurface("atlas");
                  setMode("explore");
                  setPaletteOpen(false);
                }}
              />
              <PaletteDestination
                value="go paths route guided learning atlas mode"
                label="Paths"
                detail="Guided routes in Atlas"
                icon={Route}
                badge={surface === "atlas" && mode === "paths" ? "Current · Atlas mode" : "Atlas mode"}
                onSelect={() => {
                  setSurface("atlas");
                  setMode("paths");
                  setPaletteOpen(false);
                }}
              />
              <PaletteDestination
                value="go index dictionary definitions concepts"
                label="Index"
                detail="Browse concepts and definitions"
                icon={BookOpen}
                badge={surface === "dictionary" ? "Current" : undefined}
                onSelect={() => {
                  setSurface("dictionary");
                  setPaletteOpen(false);
                }}
              />
              <PaletteDestination
                value="go study flashcards practice review"
                label="Study"
                detail="Review the active field"
                icon={WalletCards}
                badge={surface === "flashcards" ? "Current" : undefined}
                onSelect={() => {
                  setSurface("flashcards");
                  setPaletteOpen(false);
                }}
              />
              <PaletteDestination
                value="go sandbox geometry expressions workspace"
                label="Sandbox"
                detail="Experiment on a live plane"
                icon={Variable}
                badge={surface === "sandbox" ? "Current" : undefined}
                onSelect={() => {
                  setSurface("sandbox");
                  setPaletteOpen(false);
                }}
              />
            </CommandGroup>

            {data && (
              <CommandGroup heading="Commands">
                <PaletteDestination
                  value="command edit map author concepts"
                  label={editMode ? "Finish editing map" : "Edit map"}
                  detail={editMode ? "Return to exploration" : "Add or revise concepts"}
                  icon={Pencil}
                  onSelect={() => {
                    setSurface("atlas");
                    setMode("explore");
                    toggleEditMode();
                    setPaletteOpen(false);
                  }}
                />
              </CommandGroup>
            )}

            <CommandGroup heading="Fields">
              {catalog.map((entry) => (
                <CommandItem
                  key={entry.slug}
                  value={`field ${entry.title}`}
                  onSelect={() => {
                    setMap(entry.slug);
                    setPaletteOpen(false);
                  }}
                  className="group"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <MapIcon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                  {entry.slug === mapId && (
                    <span className="shrink-0 text-caption-2 text-muted-foreground">Current</span>
                  )}
                  <CornerDownLeft
                    className="size-3.5 text-primary-text opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                    aria-hidden
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            {data && (
              <CommandGroup heading="Concepts">
                {data.nodes.map((n) => {
                  const tone = getDomainTone(n.domain);
                  const Icon = kindIcon(n.kind);
                  return (
                    <CommandItem
                      key={n.id}
                      value={`${n.label} ${n.kind} ${n.tags.join(" ")}`}
                      onSelect={() => {
                        setSurface("atlas");
                        setMode("explore");
                        select(n.id);
                        setPaletteOpen(false);
                      }}
                      className="group"
                    >
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: tone.tint, color: tone.color }}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="w-26 shrink-0 text-caption-2 font-medium tracking-[var(--tracking-label-tight)] text-muted-foreground uppercase">
                        {KIND_LABEL[n.kind]}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        <MathText text={n.label} />
                      </span>
                      <span className="ml-2 hidden max-w-36 truncate text-caption-2 text-muted-foreground sm:block">
                        {n.topicCluster}
                      </span>
                      <CornerDownLeft
                        className="size-3.5 text-primary-text opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                        aria-hidden
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex min-h-10 items-center justify-between gap-3 border-t border-border px-4 text-caption text-muted-foreground max-[520px]:hidden">
            <div className="flex items-center gap-3">
              <Shortcut keys={["↑", "↓"]} label="Navigate" />
              <Shortcut keys={["↵"]} label="Open" />
              <Shortcut keys={["esc"]} label="Close" className="hidden sm:flex" />
            </div>
            <div className="flex items-center gap-1.5">
              <Keycap>⌘</Keycap>
              <Keycap>K</Keycap>
            </div>
          </div>
        </Command>
      </Surface>
    </ModalShell>
  );
}

function PaletteDestination({
  value,
  label,
  detail,
  icon: Icon,
  badge,
  onSelect,
}: {
  value: string;
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} onSelect={onSelect} className="group">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{label}</span>
        <span className="block truncate text-caption-2 text-muted-foreground max-[520px]:hidden">{detail}</span>
      </span>
      {badge && <span className="shrink-0 text-caption-2 text-muted-foreground max-[520px]:hidden">{badge}</span>}
      <CornerDownLeft
        className="size-3.5 shrink-0 text-primary-text opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
        aria-hidden
      />
    </CommandItem>
  );
}

function Keycap({ children }: { children: string }) {
  return (
    <kbd className="min-w-5 rounded-sm border border-border bg-foreground/[0.04] px-1 py-0.5 text-center font-mono text-caption-2 leading-none text-muted-foreground shadow-[0_1px_0_var(--border)]">
      {children}
    </kbd>
  );
}

function Shortcut({ keys, label, className }: { keys: string[]; label: string; className?: string }) {
  return (
    <span className={`items-center gap-1.5 ${className ?? "flex"}`}>
      <span className="flex items-center gap-0.5">
        {keys.map((key) => (
          <Keycap key={key}>{key}</Keycap>
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
