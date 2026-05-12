import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { data } from "../data";
import { KIND_LABEL } from "../types";
import { cn } from "../lib/utils";
import { animation, layout } from "../design-tokens";

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
                className="fixed inset-0 z-modal bg-black/60 backdrop-blur-lg"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: animation.duration.fast / 1000, ease: animation.easing.sharp }}
                style={{
                  top: layout.panel.commandPalette.topPosition,
                  width: `${layout.panel.commandPalette.width}px`,
                  maxWidth: layout.panel.commandPalette.maxWidthViewport,
                }}
                className="fixed left-1/2 z-modal -translate-x-1/2"
              >
                <Command className="glass overflow-hidden rounded-2xl shadow-2xl" loop>
                  <div className="border-b border-muted p-3">
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Jump to a definition, theorem, action…  (try `path connected`)"
                      className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
                    />
                  </div>
                  <Command.List style={{ maxHeight: `${layout.panel.commandPalette.maxHeight}px` }} className="overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-6 text-center text-xs text-muted/50">No results.</Command.Empty>

                    <Command.Group heading="Actions" className="text-xs uppercase tracking-wider text-muted/70 px-2 pt-2">
                      <Item onSelect={() => { setView("dependency"); setOpen(false); }}>Switch to dependency view</Item>
                      <Item onSelect={() => { setView("cluster"); setOpen(false); }}>Switch to cluster view</Item>
                      <Item onSelect={() => { setHighlight("immediate"); setOpen(false); }}>Highlight: immediate</Item>
                      <Item onSelect={() => { setHighlight("full"); setOpen(false); }}>Highlight: full path</Item>
                      <Item onSelect={() => { setShowOrphans(!showOrphans); setOpen(false); }}>
                        {showOrphans ? "Hide" : "Show"} unlinked items
                      </Item>
                    </Command.Group>

                    <Command.Group heading="Nodes" className="text-xs uppercase tracking-wider text-muted/70 px-2 pt-3">
                      {data.nodes.map((n) => (
                        <Item
                          key={n.id}
                          value={`${n.number} ${n.title} ${n.kind} ${n.tags.join(" ")}`}
                          onSelect={() => { select(n.id); setOpen(false); }}
                        >
                          <span className={cn(`kind-${n.kind}`, "flex items-center gap-2 w-full")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
                            <span className="text-muted/60 text-sm w-[110px]">{KIND_LABEL[n.kind]}</span>
                            <span className="text-ink text-md truncate">{n.title}</span>
                            <span className="ml-auto text-sm text-muted/40 truncate max-w-[140px]">{n.topicCluster}</span>
                          </span>
                        </Item>
                      ))}
                    </Command.Group>

                    {showPath && (
                      <Command.Group heading="Learning Path" className="text-xs uppercase tracking-wider text-muted/70 px-2 pt-3">
                        {data.nodes.map((n) => (
                          <Item
                            key={`path-${n.id}`}
                            value={`path ${n.number} ${n.title}`}
                            onSelect={() => { setPathTarget(n.id); setOpen(false); }}
                          >
                            → Path to {KIND_LABEL[n.kind]}: {n.title}
                          </Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>

                  <div className="flex items-center justify-between border-t border-muted px-3 py-1.5 text-xs text-muted/60">
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
      className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-ink/90 aria-selected:bg-accent-cyan/10 aria-selected:text-ink transition-colors"
      style={{
        boxShadow: "inset 0 0 0 1px var(--primary)",
      }}
    >
      {children}
    </Command.Item>
  );
}
