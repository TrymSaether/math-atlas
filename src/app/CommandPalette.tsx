import { Dialog } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { CornerDownLeft, Map as MapIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { ModalShell } from "@/ui/modal-shell";
import { Surface } from "@/design";
import { useStore } from "./store";
import { getDomainTone } from "@/atlas/colors";
import { kindIcon } from "@/atlas/nodeCategoryIcons";
import { KIND_LABEL } from "@/maps/types";
import { MathText } from "@/math/MathText";
import { rememberPaletteReturnFocus, restorePaletteReturnFocus } from "./paletteFocus";

export function CommandPalette() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const data = map?.data;
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const select = useStore((s) => s.select);
  const setMap = useStore((s) => s.setMap);
  const catalog = useStore((s) => s.catalog);
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
      contentClassName="left-1/2 top-[12%] w-[min(680px,calc(100vw-24px))] -translate-x-1/2"
    >
      <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
      <Surface material="thick" reactive className="overflow-hidden">
        <Command loop className="bg-transparent text-foreground">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            aria-label="Search the atlas"
            placeholder="Search concepts, definitions, theorems…"
          />
          <CommandList className="max-h-[min(62vh,440px)]">
            <CommandEmpty>No matching concepts or fields</CommandEmpty>

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
                  {entry.slug === mapId && <span className="shrink-0 text-caption text-muted-foreground">Current</span>}
                  <CornerDownLeft
                    className="size-3.5 text-primary opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
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
                      <span className="ml-2 hidden max-w-36 truncate text-caption text-muted-foreground sm:block">
                        {n.topicCluster}
                      </span>
                      <CornerDownLeft
                        className="size-3.5 text-primary opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                        aria-hidden
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex min-h-10 items-center justify-between gap-3 border-t border-border px-4 text-caption text-muted-foreground">
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
