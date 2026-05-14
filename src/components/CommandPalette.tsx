import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { MAPS, type MapId } from "../data";
import { KIND_LABEL, type GraphData } from "../types";
import { cn } from "../lib/utils";

export function CommandPalette({ data }: { data: GraphData }) {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const select = useStore((s) => s.select);
  const setView = useStore((s) => s.setView);
  const setHighlight = useStore((s) => s.setHighlight);
  const setShowOrphans = useStore((s) => s.setShowOrphans);
  const showOrphans = useStore((s) => s.showOrphans);
  const setPathTarget = useStore((s) => s.setPathTarget);
  const mapId = useStore((s) => s.mapId);
  const setMapId = useStore((s) => s.setMapId);
  const [query, setQuery] = useState("");
  const showPath = query.toLowerCase().startsWith("path");

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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[var(--scrim)]" />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
                className="fixed left-1/2 top-[18%] z-50 w-[640px] max-w-[92vw] -translate-x-1/2"
              >
                <Command className="atlas-panel overflow-hidden rounded-2xl" loop>
                  <div className="border-b border-[var(--border)] p-3">
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Jump to a node, switch map, run an action…"
                      className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                    />
                  </div>
                  <Command.List className="max-h-[420px] overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-6 text-center text-xs text-[var(--muted)]">No results.</Command.Empty>

                    <Command.Group heading="Maps" className="px-2 pt-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      {Object.values(MAPS).map((map) => (
                        <Item
                          key={map.id}
                          value={`map ${map.label} ${map.id}`}
                          onSelect={() => { setMapId(map.id as MapId); setOpen(false); }}
                        >
                          <span className="flex w-full items-center justify-between gap-2">
                            <span className="text-[var(--text-soft)]">{map.label}</span>
                            {map.id === mapId && <span className="text-[10px] text-[var(--primary)]">current</span>}
                          </span>
                        </Item>
                      ))}
                    </Command.Group>

                    <Command.Group heading="Actions" className="px-2 pt-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      <Item onSelect={() => { setView("dependency"); setOpen(false); }}>Switch to dependency view</Item>
                      <Item onSelect={() => { setView("cluster"); setOpen(false); }}>Switch to cluster view</Item>
                      <Item onSelect={() => { setHighlight("immediate"); setOpen(false); }}>Highlight: immediate</Item>
                      <Item onSelect={() => { setHighlight("full"); setOpen(false); }}>Highlight: full path</Item>
                      <Item onSelect={() => { setShowOrphans(!showOrphans); setOpen(false); }}>{showOrphans ? "Hide" : "Show"} unlinked items</Item>
                    </Command.Group>

                    <Command.Group heading="Nodes" className="px-2 pt-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      {data.nodes.map((n) => (
                        <Item
                          key={n.id}
                          value={`${n.number} ${n.title} ${n.kind} ${n.tags.join(" ")}`}
                          onSelect={() => { select(n.id); setOpen(false); }}
                        >
                          <span className={cn(`kind-${n.kind}`, "flex w-full items-center gap-2")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
                            <span className="w-[110px] text-[11px] text-[var(--muted)]">{KIND_LABEL[n.kind]}</span>
                            <span className="truncate text-[13px] text-[var(--text)]">{n.title}</span>
                            <span className="ml-auto max-w-[140px] truncate text-[10px] text-[var(--faint)]">{n.topicCluster}</span>
                          </span>
                        </Item>
                      ))}
                    </Command.Group>

                    {showPath && (
                      <Command.Group heading="Learning Path" className="px-2 pt-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                        {data.nodes.map((n) => (
                          <Item key={`path-${n.id}`} value={`path ${n.number} ${n.title}`} onSelect={() => { setPathTarget(n.id); setOpen(false); }}>
                            → Path to {KIND_LABEL[n.kind]}: {n.title}
                          </Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>

                  <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted)]">
                    <span>↑↓ navigate · ↵ select · esc close</span>
                    <span>⌘K</span>
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

function Item({ children, onSelect, value }: { children: React.ReactNode; onSelect: () => void; value?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-[var(--text-soft)] aria-selected:bg-[rgba(var(--primary-rgb),0.10)] aria-selected:text-[var(--text)] aria-selected:shadow-[inset_0_0_0_1px_rgba(var(--primary-rgb),0.34)]"
    >
      {children}
    </Command.Item>
  );
}
