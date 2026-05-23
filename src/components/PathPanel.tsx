import { AnimatePresence, motion } from "framer-motion";
import { X, Route, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "../store";
import { buildLearningPathReport } from "../lib/graph";
import { getNodeKindRgbString } from "../lib/colors";
import { KIND_LABEL } from "../types";
import { cn } from "../lib/utils";

export function PathPanel() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const targetId = useStore((s) => s.pathTargetId);
  const close = () => useStore.getState().setPathTarget(null);
  const select = useStore((s) => s.select);
  const relations = useStore((s) => s.relations);
  const target = targetId && map ? map.nodeById.get(targetId) : null;
  const data = map?.data;

  const path = useMemo(() => {
    if (!target || !data) return { nodes: [], cycles: [] };
    return buildLearningPathReport(target.id, data.edges, relations, data.nodes);
  }, [target, data, relations]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="glass scanlines absolute inset-x-2 bottom-2 z-30 rounded-xl md:bottom-4 md:left-1/2 md:w-[min(960px,92vw)] md:-translate-x-1/2 md:rounded-2xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 md:px-4">
            <div className="flex min-w-0 items-center gap-2 truncate text-[11px] uppercase tracking-wider text-accent-violet md:text-xs md:tracking-widest">
              <Route className="h-3.5 w-3.5" />
              <span className="truncate">Learning path to {KIND_LABEL[target.kind]} {target.number} · {target.title}</span>
            </div>
            <button onClick={close} className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </header>
          {path.cycles.length > 0 && (
            <div className="border-b border-amber-300/15 bg-amber-300/[0.08] px-3 py-2 text-[11px] leading-relaxed text-amber-100/80 md:px-4">
              {path.cycles.length === 1 ? "This path includes a cyclic prerequisite group" : `This path includes ${path.cycles.length} cyclic prerequisite groups`}; items inside each group are shown in source order.
            </div>
          )}
          <div className="overflow-x-auto p-3">
            <ol className="flex min-w-max items-stretch gap-2">
              {path.nodes.map((n, i) => (
                <li key={n.id} className="flex items-center gap-2">
                  <button
                    onClick={() => select(n.id)}
                    style={{ "--c": getNodeKindRgbString(n.kind) } as React.CSSProperties}
                    className={cn(
                      `kind-${n.kind}`,
                      "group flex w-[180px] flex-col rounded-lg border border-[rgba(var(--c),0.4)] bg-[rgba(var(--c),0.06)] p-2 text-left hover:bg-[rgba(var(--c),0.12)] md:w-[220px]"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[rgba(var(--c),0.95)]">
                      <span>{KIND_LABEL[n.kind]} {n.number}</span>
                      <span className="text-white/30">{i + 1}/{path.nodes.length}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[12px] font-medium text-white/90">{n.title}</div>
                  </button>
                  {i < path.nodes.length - 1 && <ChevronRight className="h-4 w-4 text-white/30" />}
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
