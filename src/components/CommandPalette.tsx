import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { data } from "../data";
import { KIND_LABEL } from "../types";
import { cn } from "../lib/utils";

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const select = useStore((s) => s.select);
  const setView = useStore((s) => s.setView);
  const setHighlight = useStore((s) => s.setHighlight);
  const setShowOrphans = useStore((s) => s.setShowOrphans);
  const showOrphans = useStore((s) => s.showOrphans);
  const setPathTarget = useStore((s) => s.setPathTarget);
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
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
                className="fixed left-1/2 top-[18%] z-50 w-[640px] max-w-[92vw] -translate-x-1/2"
              >
                <Command className="glass overflow-hidden rounded-2xl shadow-2xl" loop>
                  <div className="border-b border-white/10 p-3">
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Jump to a definition, theorem, action…  (try `path connected`)"
                      className="w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
                    />
                  </div>
                  <Command.List className="max-h-[420px] overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-6 text-center text-xs text-white/40">No results.</Command.Empty>

                    <Command.Group heading="Actions" className="text-[10px] uppercase tracking-widest text-white/40 px-2 pt-2">
                      <Item onSelect={() => { setView("dependency"); setOpen(false); }}>Switch to dependency view</Item>
                      <Item onSelect={() => { setView("cluster"); setOpen(false); }}>Switch to cluster view</Item>
                      <Item onSelect={() => { setHighlight("immediate"); setOpen(false); }}>Highlight: immediate</Item>
                      <Item onSelect={() => { setHighlight("full"); setOpen(false); }}>Highlight: full path</Item>
                      <Item onSelect={() => { setShowOrphans(!showOrphans); setOpen(false); }}>
                        {showOrphans ? "Hide" : "Show"} unlinked items
                      </Item>
                    </Command.Group>

                    <Command.Group heading="Nodes" className="text-[10px] uppercase tracking-widest text-white/40 px-2 pt-3">
                      {data.nodes.map((n) => (
                        <Item
                          key={n.id}
                          value={`${n.number} ${n.title} ${n.kind} ${n.tags.join(" ")}`}
                          onSelect={() => { select(n.id); setOpen(false); }}
                        >
                          <span className={cn(`kind-${n.kind}`, "flex items-center gap-2 w-full")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
                            <span className="text-white/40 text-[11px] w-[110px]">{KIND_LABEL[n.kind]} {n.number}</span>
                            <span className="text-white/90 text-[13px] truncate">{n.title}</span>
                            <span className="ml-auto text-[10px] text-white/30">Ch.{n.chapter}</span>
                          </span>
                        </Item>
                      ))}
                    </Command.Group>

                    {showPath && (
                      <Command.Group heading="Learning Path" className="text-[10px] uppercase tracking-widest text-white/40 px-2 pt-3">
                        {data.nodes.map((n) => (
                          <Item
                            key={`path-${n.id}`}
                            value={`path ${n.number} ${n.title}`}
                            onSelect={() => { setPathTarget(n.id); setOpen(false); }}
                          >
                            → Path to {KIND_LABEL[n.kind]} {n.number}: {n.title}
                          </Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>

                  <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5 text-[10px] text-white/40">
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
      className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-white/80 aria-selected:bg-accent-cyan/10 aria-selected:text-white aria-selected:shadow-[inset_0_0_0_1px_rgba(92,225,255,0.4)]"
    >
      {children}
    </Command.Item>
  );
}
