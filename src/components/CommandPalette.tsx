import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { MAPS, type MapId } from "../data";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, categoryOf } from "../lib/nodeCategory";
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
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                className="fixed inset-0 z-50 backdrop-blur-[2px]"
                style={{ background: "color-mix(in srgb, var(--bg-deep) 55%, transparent)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed left-1/2 top-1/2 z-50 w-[620px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2">
                <Dialog.Title className="sr-only">Search the atlas</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Jump to a concept or switch fields.
                </Dialog.Description>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <Command
                    className="overflow-hidden rounded-[var(--radius-2xl)] border"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      boxShadow: "var(--shadow-3)",
                    }}
                    loop
                  >
                    <div
                      className="border-b px-4 py-3"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Command.Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search concepts, definitions, theorems…"
                        className="w-full bg-transparent text-ui-body outline-none focus-visible:outline-none placeholder:text-[color:var(--fg-3)]"
                        style={{ color: "var(--fg-1)" }}
                      />
                    </div>
                    <Command.List className="max-h-[420px] overflow-y-auto p-2">
                      <Command.Empty className="px-3 py-6 text-center text-ui-xs text-[color:var(--fg-3)]">
                        No results.
                      </Command.Empty>

                      <Command.Group
                        heading="Fields"
                        className="px-2 pt-2 [&_[cmdk-group-heading]]:text-ui-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-label-wide [&_[cmdk-group-heading]]:text-[color:var(--fg-3)]"
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
                            <span className="text-ui-sm text-[color:var(--fg-1)]">Open {MAPS[id].label}</span>
                          </Item>
                        ))}
                      </Command.Group>

                      {data && (
                        <Command.Group
                          heading="Concepts"
                          className="px-2 pt-3 [&_[cmdk-group-heading]]:text-ui-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-label-wide [&_[cmdk-group-heading]]:text-[color:var(--fg-3)]"
                        >
                          {data.nodes.map((n) => {
                            const tone = getDomainTone(n.domain);
                            const CategoryIcon = CATEGORY_META[categoryOf(n.kind)].icon;
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
                                  <span
                                    className="h-2 w-2 flex-shrink-0 rounded-full"
                                    style={{ background: tone.color }}
                                  />
                                  <span
                                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                                    style={{ background: tone.tint, color: tone.color }}
                                  >
                                    <CategoryIcon className="h-2.5 w-2.5" weight="bold" aria-hidden />
                                  </span>
                                  <span className="w-[96px] flex-shrink-0 text-ui-caption font-medium uppercase tracking-label-tight text-[color:var(--fg-3)]">
                                    {KIND_LABEL[n.kind]}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-ui-sm text-[color:var(--fg-1)]">
                                    <MathText text={n.label} />
                                  </span>
                                  <span className="ml-2 max-w-[140px] truncate text-ui-caption text-[color:var(--fg-3)]">
                                    {n.topicCluster}
                                  </span>
                                </span>
                              </Item>
                            );
                          })}
                        </Command.Group>
                      )}
                    </Command.List>

                    <div
                      className="flex items-center justify-between border-t px-3 py-1.5 text-ui-caption text-[color:var(--fg-3)]"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
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
      className="cursor-pointer rounded-[var(--radius-sm)] px-2 py-2 text-ui-sm text-[color:var(--fg-1)] aria-selected:bg-[color:var(--accent-soft)] aria-selected:text-[color:var(--fg-1)]"
    >
      {children}
    </Command.Item>
  );
}
