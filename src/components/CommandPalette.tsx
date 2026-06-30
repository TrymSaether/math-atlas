import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { getDomainTone } from "../lib/colors";
import { kindIcon } from "../lib/nodeCategoryIcons";
import { KIND_LABEL } from "../types";
import { MathText } from "../lib/katex";

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
                className="fixed inset-0 z-(--z-modal) backdrop-blur-[2px]"
                style={{ background: "color-mix(in srgb, var(--bg-deep) 55%, transparent)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed left-1/2 top-1/2 z-(--z-modal) w-155 max-w-[92vw] -translate-x-1/2 -translate-y-1/2">
                <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
                <Dialog.Description className="sr-only">Jump to a concept or switch fields.</Dialog.Description>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <Command className="command-palette standard-material standard-material-thick" loop>
                    <div className="command-palette-input-row">
                      <Command.Input
                        data-no-focus-ring
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search concepts, definitions, theorems…"
                        className="command-palette-input"
                      />
                    </div>
                    <Command.List className="command-palette-list panel-scrollbar">
                      <Command.Empty className="command-palette-empty">No results.</Command.Empty>

                      <Command.Group heading="Fields" className="command-palette-group">
                        {catalog.map((entry) => (
                          <Item
                            key={entry.slug}
                            value={`field ${entry.title}`}
                            onSelect={() => {
                              setMap(entry.slug);
                              setOpen(false);
                            }}
                          >
                            <span className="text-footnote text-(--fg-1)">Open {entry.title}</span>
                          </Item>
                        ))}
                      </Command.Group>

                      {data && (
                        <Command.Group heading="Concepts" className="command-palette-group">
                          {data.nodes.map((n) => {
                            const tone = getDomainTone(n.domain);
                            const CategoryIcon = kindIcon(n.kind);
                            return (
                              <Item
                                key={n.id}
                                value={`${n.label} ${n.kind} ${n.tags.join(" ")}`}
                                onSelect={() => {
                                  select(n.id);
                                  setOpen(false);
                                }}
                              >
                                <span className="flex w-full items-center gap-2.5">
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.color }} />
                                  <span
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                                    style={{ background: tone.tint, color: tone.color }}
                                  >
                                    <CategoryIcon className="h-2.5 w-2.5" weight="bold" aria-hidden />
                                  </span>
                                  <span className="w-24 shrink-0 text-caption-1 font-medium uppercase tracking-label-tight text-(--fg-3)">
                                    {KIND_LABEL[n.kind]}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-footnote text-(--fg-1)">
                                    <MathText text={n.label} />
                                  </span>
                                  <span className="ml-2 max-w-35 truncate text-caption-1 text-(--fg-3)">
                                    {n.topicCluster}
                                  </span>
                                </span>
                              </Item>
                            );
                          })}
                        </Command.Group>
                      )}
                    </Command.List>

                    <div className="command-palette-footer">
                      <span>↑↓ navigate · ↵ select · esc close</span>
                      <span className="font-mono">⌘K</span>
                    </div>
                  </Command>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Item({ children, onSelect, value }: { children: React.ReactNode; onSelect: () => void; value?: string }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="command-palette-item">
      {children}
    </Command.Item>
  );
}
