import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { MAPS, type MapId } from "../data";
import { getDomainTone } from "../lib/colors";
import { KIND_LABEL } from "../types";

export function CommandPalette() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const data = map?.data;
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const select = useStore((s) => s.select);
  const setMap = useStore((s) => s.setMap);
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

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
                className="fixed inset-0 z-50 bg-ink-900/12 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
                className="fixed left-1/2 top-[18%] z-50 w-[620px] max-w-[92vw] -translate-x-1/2"
              >
                <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Jump to a concept or switch fields.
                </Dialog.Description>
                <Command
                  className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
                  loop
                >
                  <div className="border-b border-ink-100 px-4 py-3">
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search concepts, definitions, theorems…"
                      className="w-full bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-400"
                    />
                  </div>
                  <Command.List className="max-h-[420px] overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-6 text-center text-[12px] text-ink-400">
                      No results.
                    </Command.Empty>

                    <Command.Group
                      heading="Fields"
                      className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400"
                    >
                      {(Object.keys(MAPS) as MapId[]).map((id) => (
                        <Item
                          key={id}
                          value={`field ${MAPS[id].label} ${MAPS[id].description}`}
                          onSelect={() => {
                            setMap(id);
                            setOpen(false);
                          }}
                        >
                          <span className="text-[13px] text-ink-900">Open {MAPS[id].label}</span>
                        </Item>
                      ))}
                    </Command.Group>

                    {data && (
                      <Command.Group
                        heading="Concepts"
                        className="px-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400"
                      >
                        {data.nodes.map((n) => {
                          const tone = getDomainTone(n.domainId);
                          return (
                            <Item
                              key={n.id}
                              value={`${n.title} ${n.kind} ${n.tags.join(" ")}`}
                              onSelect={() => {
                                select(n.id);
                                setOpen(false);
                              }}
                            >
                              <span className="flex w-full items-center gap-2.5">
                                <span
                                  className="h-2 w-2 flex-shrink-0 rounded-full"
                                  style={{ background: tone.color }}
                                />
                                <span className="w-[96px] flex-shrink-0 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-400">
                                  {KIND_LABEL[n.kind]}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-800">
                                  {n.title}
                                </span>
                                <span className="ml-2 max-w-[140px] truncate text-[10.5px] text-ink-400">
                                  {n.topicCluster}
                                </span>
                              </span>
                            </Item>
                          );
                        })}
                      </Command.Group>
                    )}
                  </Command.List>

                  <div className="flex items-center justify-between border-t border-ink-100 px-3 py-1.5 text-[10.5px] text-ink-400">
                    <span>↑↓ navigate · ↵ select · esc close</span>
                    <span className="font-mono">⌘K</span>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Item({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="cursor-pointer rounded-md px-2 py-2 text-[13px] text-ink-800 aria-selected:bg-accent-blueSoft aria-selected:text-ink-900"
    >
      {children}
    </Command.Item>
  );
}
