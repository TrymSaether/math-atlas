import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { Surface, spring } from "@/design";
import { useStore } from "./store";
import { getDomainTone } from "@/atlas/colors";
import { kindIcon } from "@/atlas/nodeCategoryIcons";
import { KIND_LABEL } from "@/maps/types";
import { MathText } from "@/math/MathText";

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
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useStore.getState().paletteOpen);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Clear the query when the palette closes (compare against the previous value
  // during render rather than syncing in an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setQuery("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
                className="fixed left-1/2 top-[16%] z-50 w-[620px] max-w-[92vw] -translate-x-1/2"
              >
                <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
                <Surface material="thick" reactive className="overflow-hidden">
                  <Command loop className="bg-transparent text-foreground">
                    <CommandInput
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search concepts, definitions, theorems…"
                    />
                    <CommandList className="max-h-[min(60vh,420px)]">
                      <CommandEmpty>No results.</CommandEmpty>

                      <CommandGroup heading="Fields">
                        {catalog.map((entry) => (
                          <CommandItem
                            key={entry.slug}
                            value={`field ${entry.title}`}
                            onSelect={() => {
                              setMap(entry.slug);
                              setOpen(false);
                            }}
                          >
                            Open {entry.title}
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
                                  setOpen(false);
                                }}
                                className="gap-2.5"
                              >
                                <span className="size-2 shrink-0 rounded-full" style={{ background: tone.color }} />
                                <span
                                  className="flex size-4 shrink-0 items-center justify-center rounded-full"
                                  style={{ background: tone.tint, color: tone.color }}
                                >
                                  <Icon className="size-2.5" aria-hidden />
                                </span>
                                <span className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {KIND_LABEL[n.kind]}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                  <MathText text={n.label} />
                                </span>
                                <span className="ml-2 max-w-36 truncate text-xs text-muted-foreground">
                                  {n.topicCluster}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>

                    <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      <span>↑↓ navigate · ↵ select · esc close</span>
                      <span className="font-mono">⌘K</span>
                    </div>
                  </Command>
                </Surface>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
