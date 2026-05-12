import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { X, Route, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "../store";
import { data, nodeById } from "../data";
import { buildLearningPath } from "../lib/graph";
import { hexToRgbString } from "../lib/colors";
import { getThemePalette } from "../themes";
import { KIND_LABEL } from "../types";
import { cn } from "../lib/utils";
import { animation } from "../design-tokens";

export function PathPanel() {
  const targetId = useStore((s) => s.pathTargetId);
  const close = () => useStore.getState().setPathTarget(null);
  const select = useStore((s) => s.select);
  const relations = useStore((s) => s.relations);
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const target = targetId ? nodeById.get(targetId) : null;

  const path = useMemo(() => {
    if (!target) return [];
    return buildLearningPath(target.id, data.edges, relations, data.nodes);
  }, [target, relations]);

  const palette = useMemo(() => getThemePalette(themeId, colorMode), [themeId, colorMode]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: animation.duration.slow / 1000, ease: animation.easing.sharp }}
          className="glass scanlines absolute bottom-4 left-1/2 z-content w-[min(960px,92vw)] -translate-x-1/2 rounded-2xl"
        >
          <header className="flex items-center justify-between border-b border-muted px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-violet">
              <Route className="h-3.5 w-3.5" />
              Learning path → {KIND_LABEL[target.kind]} {target.number} · {target.title}
            </div>
            <button onClick={close} className="rounded p-1 text-muted/60 hover:bg-surface hover:text-ink transition-colors"><X className="h-4 w-4" /></button>
          </header>
          <div className="overflow-x-auto p-3">
            <ol className="flex min-w-max items-stretch gap-2">
              {path.map((n, i) => {
                const nodeColor = palette.kindColors[n.kind];
                const buttonStyle = { "--c": hexToRgbString(nodeColor) } as CSSProperties;

                return (
                  <li key={n.id} className="flex items-center gap-2">
                    <button
                      onClick={() => select(n.id)}
                      style={buttonStyle}
                      className={cn(
                        `kind-${n.kind}`,
                        "group flex w-[220px] flex-col rounded-lg border border-[rgba(var(--c),0.4)] bg-[rgba(var(--c),0.06)] p-2 text-left hover:bg-[rgba(var(--c),0.12)] transition-colors"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[rgba(var(--c),0.95)]">
                        <span>{KIND_LABEL[n.kind]} {n.number}</span>
                        <span className="text-muted/40">{i + 1}/{path.length}</span>
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm font-medium text-ink/90">{n.title}</div>
                    </button>
                    {i < path.length - 1 && <ChevronRight className="h-4 w-4 text-muted/40" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
