import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Lightbulb,
  Sigma,
  BookOpen,
  Link as LinkIcon,
  ArrowUpRight,
  Beaker,
  StickyNote,
  ChevronDown,
  MessageSquareText,
} from "lucide-react";

import { useStore } from "../store";
import type { LoadedMap } from "../data";
import { MathText, MathProse } from "../lib/katex";
import { cn } from "../lib/utils";
import { getDomainTone } from "../lib/colors";
import { CATEGORY_META, categoryOf } from "../lib/nodeCategory";
import { KIND_LABEL, type GraphNode } from "../types";

const USED_BY_INITIAL = 8;
const RELATED_CASE_KINDS = new Set(["example", "non_example", "counterexample", "application", "conjecture"]);

export function NodePanel() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const node = id && map ? map.nodeById.get(id) ?? null : null;

  return (
    <AnimatePresence>
      {node && map && (
        <motion.aside
          key={node.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className="pointer-events-auto absolute right-3 top-[68px] bottom-3 z-20 flex w-[380px] flex-col overflow-hidden rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-3)" }}
        >
          <PanelContent node={node} map={map} onClose={() => select(null)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelContent({ node, map, onClose }: { node: GraphNode; map: LoadedMap; onClose: () => void }) {
  const select = useStore((s) => s.select);
  const domain = map.domainById.get(node.domainId);
  const tone = getDomainTone(node.domainId);
  const [openDeps, setOpenDeps] = useState(true);
  const [openUsed, setOpenUsed] = useState(true);
  const [openExamples, setOpenExamples] = useState(true);
  const [openExercises, setOpenExercises] = useState(true);
  const [openReferences, setOpenReferences] = useState(false);
  const [showAllUsed, setShowAllUsed] = useState(false);

  const prereqIds = useMemo(
    () => [...new Set([...node.statementDependencies, ...node.proofDependencies])],
    [node],
  );
  const allConsequences = useMemo(
    () => (map.outgoingEdgesByNodeId.get(node.id) ?? []).map((edge) => edge.to),
    [map, node.id],
  );
  const examples = useMemo(
    () => {
      const ids = new Set<string>();
      for (const edge of map.outgoingEdgesByNodeId.get(node.id) ?? []) {
        if (edge.relation === "has_example" || edge.relation === "has_counterexample") ids.add(edge.to);
      }
      for (const edge of map.incomingEdgesByNodeId.get(node.id) ?? []) {
        if (edge.relation === "has_property" || edge.relation === "motivates") ids.add(edge.from);
      }
      return [...ids].filter((cid) => {
        const n = map.nodeById.get(cid);
        return n && RELATED_CASE_KINDS.has(n.kind);
      });
    },
    [map, node.id],
  );
  const exercises = useMemo(
    () =>
      (map.outgoingEdgesByNodeId.get(node.id) ?? [])
        .filter((edge) => edge.relation === "requires")
        .map((edge) => edge.to)
        .filter((cid, index, ids) => ids.indexOf(cid) === index)
        .filter((cid) => map.nodeById.get(cid)?.kind === "exercise"),
    [map, node.id],
  );
  const usedBy = useMemo(
    () =>
      [...new Set(allConsequences)].filter((cid) => {
        const n = map.nodeById.get(cid);
        return n && !RELATED_CASE_KINDS.has(n.kind) && n.kind !== "exercise";
      }),
    [allConsequences, map],
  );

  const visibleUsed = showAllUsed ? usedBy : usedBy.slice(0, USED_BY_INITIAL);
  const hiddenUsedCount = usedBy.length - visibleUsed.length;

  const statement = node.originalText.trim();
  const formalStatement = node.formalStatement.trim();
  const explanation = node.explanation.trim();
  const solution = node.solution.trim();
  const gloss = node.gloss.trim();
  const example = node.example.trim();
  const diagramPath = node.diagramPath.trim();
  // For dictionary-origin nodes the gloss seeds the intuition, so suppress the
  // duplicate.
  const showGloss = gloss && gloss !== explanation;

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <span
          className="font-mono text-[11.5px] font-semibold tracking-wide"
          style={{ color: tone.color }}
          title={node.id}
        >
          {node.id}
        </span>
        <span className="ml-auto" />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ color: "var(--fg-2)" }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7">
        <h2
          className="font-serif text-[26px] leading-[1.15] tracking-[-0.01em]"
          style={{ color: "var(--fg-1)" }}
        >
          <MathText text={node.title} />
        </h2>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <TagPill
            label={domain?.label ?? node.topicCluster}
            background={tone.tint}
            color={tone.color}
            border={tone.border}
          />
          <TagPill label={KIND_LABEL[node.kind]} neutral />
          {node.tags.slice(0, 3).map((t) => (
            <TagPill key={t} label={t} neutral />
          ))}
        </div>

        <Divider />

        {diagramPath && (
          <>
            <img
              src={diagramPath}
              alt={`Diagram for ${node.title}`}
              loading="lazy"
              decoding="async"
              className="w-full rounded-[10px] border p-2"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            />
            <Divider />
          </>
        )}

        {statement && (
          <>
            <SectionHeader icon={<BookOpen className="h-[15px] w-[15px]" />} title="Statement" />
            <div className="text-[13.5px] leading-[1.6]" style={{ color: "var(--fg-1)" }}>
              <MathProse text={statement} />
            </div>
            <Divider />
          </>
        )}

        {formalStatement && (
          <>
            <SectionHeader icon={<Sigma className="h-[15px] w-[15px]" />} title="Formal statement" />
            <div
              className="inline-block w-fit max-w-full rounded-[10px] border px-4 py-3 text-[14px] leading-[1.6] font-math"
              style={{
                background: "var(--accent-soft)",
                borderColor: "var(--accent-border)",
                color: "var(--fg-1)",
              }}
            >
              <MathText text={formalStatement} asBlock />
            </div>
            <Divider />
          </>
        )}

        {explanation && (
          <>
            <SectionHeader icon={<Lightbulb className="h-[15px] w-[15px]" />} title="Intuition" />
            <div className="text-[13.5px] leading-[1.6]" style={{ color: "var(--fg-1)" }}>
              <MathText text={explanation} />
            </div>
            <Divider />
          </>
        )}

        {solution && (
          <>
            <SectionHeader icon={<StickyNote className="h-[15px] w-[15px]" />} title="Solution" />
            <div className="text-[13.5px] leading-[1.6]" style={{ color: "var(--fg-1)" }}>
              <MathText text={solution} />
            </div>
            <Divider />
          </>
        )}

        {showGloss && (
          <>
            <SectionHeader icon={<MessageSquareText className="h-[15px] w-[15px]" />} title="In words" />
            <div className="text-[13.5px] leading-[1.6]" style={{ color: "var(--fg-1)" }}>
              <MathProse text={gloss} />
            </div>
            <Divider />
          </>
        )}

        {example && (
          <>
            <SectionHeader icon={<Beaker className="h-[15px] w-[15px]" />} title="Example" />
            <div className="text-[13.5px] leading-[1.6]" style={{ color: "var(--fg-2)" }}>
              <MathProse text={example} />
            </div>
            <Divider />
          </>
        )}

        {prereqIds.length > 0 && (
          <>
            <SectionHeader
              icon={<LinkIcon className="h-[15px] w-[15px]" />}
              title="Depends on"
              count={prereqIds.length}
              expanded={openDeps}
              onToggle={() => setOpenDeps((v) => !v)}
            />
            {openDeps && (
              <div className="pb-1">
                {prereqIds.map((rid) => <RefRow key={rid} id={rid} map={map} onClick={() => select(rid)} />)}
              </div>
            )}
            <Divider />
          </>
        )}

        {usedBy.length > 0 && (
          <>
            <SectionHeader
              icon={<ArrowUpRight className="h-[15px] w-[15px]" />}
              title="Used by"
              count={usedBy.length}
              expanded={openUsed}
              onToggle={() => setOpenUsed((v) => !v)}
            />
            {openUsed && (
              <div className="pb-1">
                {visibleUsed.map((rid) => (
                  <RefRow key={rid} id={rid} map={map} onClick={() => select(rid)} />
                ))}
                {hiddenUsedCount > 0 && (
                  <button
                    onClick={() => setShowAllUsed(true)}
                    className="mt-1 px-1 text-[12px] hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    … and {hiddenUsedCount} more
                  </button>
                )}
              </div>
            )}
            <Divider />
          </>
        )}

        {examples.length > 0 && (
          <>
            <SectionHeader
              icon={<Beaker className="h-[15px] w-[15px]" />}
              title="Related cases"
              count={examples.length}
              expanded={openExamples}
              onToggle={() => setOpenExamples((v) => !v)}
            />
            {openExamples && (
              <div className="pb-1">
                {examples.map((rid) => (
                  <RefRow key={rid} id={rid} map={map} onClick={() => select(rid)} />
                ))}
              </div>
            )}
            <Divider />
          </>
        )}

        {exercises.length > 0 && (
          <>
            <SectionHeader
              icon={<StickyNote className="h-[15px] w-[15px]" />}
              title="Exercises"
              count={exercises.length}
              expanded={openExercises}
              onToggle={() => setOpenExercises((v) => !v)}
            />
            {openExercises && (
              <div className="pb-1">
                {exercises.map((rid) => (
                  <RefRow key={rid} id={rid} map={map} onClick={() => select(rid)} />
                ))}
              </div>
            )}
            <Divider />
          </>
        )}

        <SectionHeader
          icon={<LinkIcon className="h-[15px] w-[15px]" />}
          title="References"
          count={node.tags.length + (node.ref ? 1 : 0)}
          expanded={openReferences}
          onToggle={() => setOpenReferences((v) => !v)}
        />
        {openReferences && (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pb-1 text-[12px]">
              <dt style={{ color: "var(--fg-3)" }}>Tags</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.tags.length > 0 ? node.tags.join(", ") : "No tags recorded."}
              </dd>
              <dt style={{ color: "var(--fg-3)" }}>Domain</dt>
              <dd style={{ color: "var(--fg-2)" }}>{domain?.label ?? node.topicCluster}</dd>
              <dt style={{ color: "var(--fg-3)" }}>Source</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.chapter} · {node.section || "unranked"} · #{node.number}
              </dd>
              {node.ref && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Reference</dt>
                  <dd style={{ color: "var(--fg-2)" }}>{node.ref}</dd>
                </>
              )}
              <dt style={{ color: "var(--fg-3)" }}>ID</dt>
              <dd className="truncate font-mono text-[11px]" style={{ color: "var(--fg-2)" }} title={node.id}>
                {node.id}
              </dd>
            </dl>
          </>
        )}
      </div>
    </>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const interactive = !!onToggle;
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 py-3",
        interactive && "cursor-pointer",
      )}
    >
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <span className="text-[13.5px] font-semibold tracking-[-0.005em]" style={{ color: "var(--fg-1)" }}>
        {title}
      </span>
      {typeof count === "number" && (
        <span
          className="ml-auto inline-flex h-[22px] min-w-[24px] items-center justify-center rounded-full border px-2 font-mono text-[11px] font-semibold"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg-2)" }}
        >
          {count}
        </span>
      )}
      {interactive && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            !expanded && "-rotate-90",
            typeof count !== "number" && "ml-auto",
          )}
          style={{ color: "var(--fg-3)" }}
        />
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-0.5 border-t" style={{ borderColor: "var(--border-subtle)" }} />;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 pb-2 text-[12px]" style={{ color: "var(--fg-3)" }}>
      {children}
    </div>
  );
}

function TagPill({
  label,
  neutral,
  background,
  color,
  border,
}: {
  label: string;
  neutral?: boolean;
  background?: string;
  color?: string;
  border?: string;
}) {
  if (neutral || !background) {
    return (
      <span
        className="inline-flex h-6 items-center rounded-full border px-2.5 text-[11.5px] font-medium"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg-2)" }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium"
      style={{ background, color, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}

function RefRow({
  id,
  map,
  onClick,
}: {
  id: string;
  map: LoadedMap;
  onClick: () => void;
}) {
  const node = map.nodeById.get(id);
  if (!node) return null;
  const tone = getDomainTone(node.domainId);
  const Icon = CATEGORY_META[categoryOf(node.kind)].icon;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-[color:var(--surface-3)]"
    >
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0"
        strokeWidth={2.25}
        style={{ color: tone.color }}
        aria-hidden
      />
      <span
        className="w-[68px] flex-shrink-0 truncate text-[10.5px] font-medium uppercase tracking-[0.08em]"
        style={{ color: "var(--fg-3)" }}
      >
        {KIND_LABEL[node.kind]}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--fg-1)" }}>
        <MathText text={node.title} />
      </span>
    </button>
  );
}
