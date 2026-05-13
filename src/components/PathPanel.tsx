import { AnimatePresence, motion } from "framer-motion";
import { X, Route, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "../store";
import { buildLearningPath } from "../lib/graph";
import { KIND_LABEL, type GraphData, type GraphNode } from "../types";
import { cn } from "../lib/utils";

export function PathPanel({ data, nodeById }: { data: GraphData; nodeById: Map<string, GraphNode> }) {
  const targetId = useStore((s) => s.pathTargetId);
  const close = () => useStore.getState().setPathTarget(null);
  const select = useStore((s) => s.select);
  const relations = useStore((s) => s.relations);
  const target = targetId ? nodeById.get(targetId) : null;

  const path = useMemo(() => {
    if (!target) return [];
    return buildLearningPath(target.id, data.edges, relations, data.nodes);
  }, [target, relations, data.edges, data.nodes]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="glass scanlines absolute bottom-4 left-1/2 z-30 w-[min(960px,92vw)] -translate-x-1/2 rounded-2xl"
        >
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-300">
              <Route className="h-3.5 w-3.5" />
              Learning path → {KIND_LABEL[target.kind]} {target.number} · {target.title}
            </div>
            <button onClick={close} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"><X className="h-4 w-4" /></button>
          </header>
          <div className="overflow-x-auto p-3">
            <ol className="flex min-w-max items-stretch gap-2">
              {path.map((n, i) => (
                <li key={n.id} className="flex items-center gap-2">
                  <button
                    onClick={() => select(n.id)}
                    className={cn(
                      `kind-${n.kind}`,
                      "group flex w-[220px] flex-col rounded-lg border border-[rgba(var(--c),0.4)] bg-[rgba(var(--c),0.06)] p-2 text-left hover:bg-[rgba(var(--c),0.12)]"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[rgba(var(--c),0.95)]">
                      <span>{KIND_LABEL[n.kind]} {n.number}</span>
                      <span className="text-[var(--faint)]">{i + 1}/{path.length}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[12px] font-medium text-[var(--text)]">{n.title}</div>
                  </button>
                  {i < path.length - 1 && <ChevronRight className="h-4 w-4 text-[var(--faint)]" />}
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
