import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { X, ArrowUpRight, ArrowDownRight, Tag, BookOpen, Route } from "lucide-react";
import { useStore } from "../store";
import { nodeById } from "../data";
import { MathText } from "../lib/katex";
import { cn } from "../lib/utils";
import { hexToRgbString } from "../lib/colors";
import { getThemePalette } from "../themes";
import { KIND_LABEL } from "../types";
import { animation, layout } from "../design-tokens";

export function NodePanel() {
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const setPathTarget = useStore((s) => s.setPathTarget);
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const node = id ? nodeById.get(id) ?? null : null;
  const formalStatement = node?.formalStatement.trim() ?? "";

  const palette = useMemo(() => getThemePalette(themeId, colorMode), [themeId, colorMode]);
  const nodeColor = useMemo(() => {
    if (!node || !palette) return "#000000";
    return palette.kindColors[node.kind] ?? "#000000";
  }, [node, palette]);

  const style = useMemo(() => ({
    width: `${layout.panel.nodePanel.width}px`,
    maxWidth: layout.panel.nodePanel.maxWidthViewport,
    "--c": node ? hexToRgbString(nodeColor) : "0, 0, 0",
  }), [node, nodeColor]) as CSSProperties;

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: animation.duration.slow / 1000, ease: animation.easing.sharp }}
          style={style}
          className={cn(
            `kind-${node.kind}`,
            "glass scanlines absolute right-3 top-3 bottom-3 z-content flex flex-col overflow-hidden rounded-2xl shadow-2xl"
          )}
        >
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--c),0.9)] to-transparent" />
          <div className="absolute -left-px top-12 h-32 w-px bg-gradient-to-b from-[rgba(var(--c),0.9)] to-transparent" />

          <header className="flex items-start justify-between gap-3 border-b border-muted p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[rgba(var(--c),0.95)]">
                <span className="rounded-sm bg-[rgba(var(--c),0.12)] px-1.5 py-0.5">
                  {KIND_LABEL[node.kind]}
                </span>
                <span className="text-muted/80">{node.topicCluster}</span>
              </div>
              <h2 className="mt-1.5 font-display text-xl font-semibold leading-tight">
                <MathText text={node.title} />
              </h2>
            </div>
            <button
              onClick={() => select(null)}
              className="rounded-md p-1 text-muted/60 hover:bg-surface hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <Section title={formalStatement ? "Formal statement" : "Statement"} icon={<BookOpen className="h-3 w-3" />}>
              <div className="rounded-lg border border-muted/20 bg-surface-muted p-3 text-md leading-relaxed text-ink/90 font-serif">
                <MathText text={formalStatement || node.originalText} />
              </div>
            </Section>

            {formalStatement && (
              <Section title="Source text">
                <div className="rounded-lg border border-muted/15 bg-surface p-3 text-sm leading-relaxed text-ink/75 font-serif">
                  <MathText text={node.originalText} />
                </div>
              </Section>
            )}

            {node.explanation && (
              <Section title="Explanation">
                <p className="text-md leading-relaxed text-ink/85"><MathText text={node.explanation} /></p>
              </Section>
            )}

            <DepSection
              title="Prerequisites"
              ids={[...new Set([...node.statementDependencies, ...node.proofDependencies])]}
              icon={<ArrowUpRight className="h-3 w-3 rotate-180" />}
              empty="No upstream dependencies inferred."
            />

            <DepSection
              title="Consequences"
              ids={consequencesOf(node.id)}
              icon={<ArrowDownRight className="h-3 w-3" />}
              empty="No downstream results inferred."
            />

            <Section title="Tags" icon={<Tag className="h-3 w-3" />}>
              <div className="flex flex-wrap gap-1.5">
                {node.tags.length === 0 && <span className="text-xs text-muted/50">none</span>}
                {node.tags.map((t) => (
                  <span key={t} className="rounded-full border border-muted/20 bg-surface p-1 px-2 text-xs text-ink/70">{t}</span>
                ))}
              </div>
            </Section>

            <Section title="Reference">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted/60">Theme</dt><dd className="text-ink/80">{node.topicCluster}</dd>
                <dt className="text-muted/60">Textbook</dt><dd className="text-ink/80">Ch. {node.chapter} §{node.section} — {node.sectionTitle} · № {node.number}</dd>
                <dt className="text-muted/60">ID</dt><dd className="font-mono text-muted/70 truncate">{node.id}</dd>
              </dl>
            </Section>
          </div>

          <footer className="border-t border-muted p-3">
            <button
              onClick={() => setPathTarget(node.id)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-3 py-2 text-xs font-medium text-accent-violet shadow-glow-violet hover:bg-accent-violet/20 transition-colors"
            >
              <Route className="h-3.5 w-3.5" /> Generate learning path to here
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted/70">
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function DepSection({ title, ids, icon, empty }: { title: string; ids: string[]; icon: React.ReactNode; empty: string }) {
  const select = useStore((s) => s.select);
  return (
    <Section title={title} icon={icon}>
      {ids.length === 0 ? (
        <div className="text-xs text-muted/50">{empty}</div>
      ) : (
        <ul className="space-y-1">
          {ids.map((id) => {
            const n = nodeById.get(id);
            if (!n) return null;
            return (
              <li key={id}>
                <button
                  onClick={() => select(id)}
                  className={cn(
                    `kind-${n.kind}`,
                    "group flex w-full items-center justify-between gap-2 rounded-md border border-muted/15 bg-surface p-2 text-left text-sm hover:bg-surface-muted transition-colors"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
                    <span className="text-muted/60">{KIND_LABEL[n.kind]} {n.number}</span>
                    <span className="text-ink/85 truncate max-w-[200px]">{n.title}</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted/50 group-hover:text-ink/80" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function consequencesOf(id: string): string[] {
  const out: string[] = [];
  for (const n of nodeById.values()) {
    if (n.statementDependencies.includes(id) || n.proofDependencies.includes(id)) out.push(n.id);
  }
  return out;
}
