import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronUp, ChevronDown, BookOpen } from "lucide-react";

import { useStore } from "../store";
import type { LoadedMap } from "../data";
import { MathText, MathProse } from "../lib/katex";
import { getDomainTone } from "../lib/colors";
import { KIND_LABEL, type GraphNode } from "../types";
import { ThemedDiagram } from "./ThemedDiagram";
import { Spine, Facet, ConnectionChip, specimenMeta } from "./Specimen";

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
          className="pointer-events-auto absolute left-3 right-3 top-[68px] bottom-3 z-20 flex flex-col overflow-hidden rounded-[16px] border sm:left-auto sm:w-[min(480px,calc(100vw-24px))]"
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
  const setSurface = useStore((s) => s.setSurface);
  const domain = map.domainById.get(node.domainId);
  const tone = getDomainTone(node.domainId);
  const [showAllUsed, setShowAllUsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prereqIds = useMemo(
    () => [...new Set([...node.statementDependencies, ...node.proofDependencies])],
    [node],
  );
  const allConsequences = useMemo(
    () => (map.outgoingEdgesByNodeId.get(node.id) ?? []).map((edge) => edge.to),
    [map, node.id],
  );
  const examples = useMemo(() => {
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
  }, [map, node.id]);
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

  // Ordered domain peers drive the prev/next pager in the header.
  const peers = useMemo(
    () => map.data.nodes.filter((n) => n.domainId === node.domainId),
    [map, node.domainId],
  );
  const peerIdx = peers.findIndex((n) => n.id === node.id);
  const prev = peerIdx > 0 ? peers[peerIdx - 1] : null;
  const next = peerIdx >= 0 && peerIdx < peers.length - 1 ? peers[peerIdx + 1] : null;

  const visibleUsed = showAllUsed ? usedBy : usedBy.slice(0, USED_BY_INITIAL);
  const hiddenUsedCount = usedBy.length - visibleUsed.length;

  const statement = node.originalText.trim();
  const formalStatement = node.formalStatement.trim();
  const explanation = node.explanation.trim();
  const solution = node.solution.trim();
  const gloss = node.gloss.trim();
  const example = node.example.trim();
  const diagramPath = node.diagramPath.trim();
  const showGloss = gloss && gloss !== explanation;
  const hasConnections =
    prereqIds.length > 0 || usedBy.length > 0 || examples.length > 0 || exercises.length > 0;

  useEffect(() => {
    setShowAllUsed(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [node.id]);

  const openInDictionary = () => {
    select(node.id);
    setSurface("dictionary");
  };

  return (
    <>
      {/* Sticky header */}
      <header
        className="relative shrink-0 border-b px-5 pb-4 pt-3"
        style={{ borderColor: "var(--border-subtle)", background: "var(--surface)" }}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <IconButton label="Previous in domain" disabled={!prev} onClick={() => prev && select(prev.id)}>
              <ChevronUp className="h-4 w-4" />
            </IconButton>
            <IconButton label="Next in domain" disabled={!next} onClick={() => next && select(next.id)}>
              <ChevronDown className="h-4 w-4" />
            </IconButton>
            {peerIdx >= 0 && (
              <span className="ml-1.5 font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>
                {peerIdx + 1}/{peers.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton label="Open in dictionary" onClick={openInDictionary}>
              <BookOpen className="h-4 w-4" />
            </IconButton>
            <IconButton label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <h2
          className="font-serif text-[27px] leading-[1.06]"
          style={{ color: "var(--fg-1)", fontWeight: 600, letterSpacing: "-0.015em" }}
        >
          <MathText text={node.title} />
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: tone.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
            {domain?.label ?? node.topicCluster}
          </span>
          <span aria-hidden style={{ color: "var(--fg-4)" }}>·</span>
          <span style={{ color: "var(--fg-2)" }}>{specimenMeta(node)}</span>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {diagramPath && (
            <section id="sec-diagram">
              <ThemedDiagram
                src={diagramPath}
                alt={`Diagram for ${node.title}`}
                className="w-full rounded-[12px] border p-3"
              />
            </section>
          )}

          {statement && (
            <section id="sec-statement">
              <Spine tone={tone} kind={node.kind} label="Statement">
                <MathProse text={statement} />
              </Spine>
            </section>
          )}

          {formalStatement && (
            <section id="sec-formal">
              <Facet label="Formal statement" toneColor={tone.color}>
                <div
                  className="block max-w-full overflow-x-auto rounded-[10px] border px-3.5 py-2.5 font-math text-[14px] leading-[1.6]"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg-1)" }}
                >
                  <MathText text={formalStatement} asBlock />
                </div>
              </Facet>
            </section>
          )}

          {explanation && (
            <section id="sec-intuition">
              <Facet label="Intuition">
                <MathProse text={explanation} />
              </Facet>
            </section>
          )}

          {solution && (
            <section id="sec-solution">
              <Facet label="Solution">
                <MathProse text={solution} />
              </Facet>
            </section>
          )}

          {showGloss && (
            <section id="sec-inwords">
              <Facet label="In words">
                <MathProse text={gloss} />
              </Facet>
            </section>
          )}

          {example && (
            <section id="sec-example">
              <Facet label="Example" muted>
                <MathProse text={example} />
              </Facet>
            </section>
          )}

          {hasConnections && (
            <section id="sec-connections" className="space-y-3.5 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
              {prereqIds.length > 0 && (
                <ChipGroup label="Depends on" count={prereqIds.length}>
                  {prereqIds.map((rid) => (
                    <ConnectionChip key={rid} id={rid} map={map} onClick={() => select(rid)} />
                  ))}
                </ChipGroup>
              )}
              {usedBy.length > 0 && (
                <ChipGroup label="Used by" count={usedBy.length}>
                  {visibleUsed.map((rid) => (
                    <ConnectionChip key={rid} id={rid} map={map} onClick={() => select(rid)} />
                  ))}
                  {hiddenUsedCount > 0 && (
                    <button
                      onClick={() => setShowAllUsed(true)}
                      className="self-center px-1 text-[12px] hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      +{hiddenUsedCount} more
                    </button>
                  )}
                </ChipGroup>
              )}
              {examples.length > 0 && (
                <ChipGroup label="Related cases" count={examples.length}>
                  {examples.map((rid) => (
                    <ConnectionChip key={rid} id={rid} map={map} onClick={() => select(rid)} />
                  ))}
                </ChipGroup>
              )}
              {exercises.length > 0 && (
                <ChipGroup label="Exercises" count={exercises.length}>
                  {exercises.map((rid) => (
                    <ConnectionChip key={rid} id={rid} map={map} onClick={() => select(rid)} />
                  ))}
                </ChipGroup>
              )}
            </section>
          )}

          <section id="sec-metadata" className="border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
            <Facet label="Metadata">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                <dt style={{ color: "var(--fg-3)" }}>Tags</dt>
                <dd style={{ color: "var(--fg-2)" }}>
                  {node.tags.length > 0 ? node.tags.join(", ") : "No tags recorded."}
                </dd>
                <dt style={{ color: "var(--fg-3)" }}>Domain</dt>
                <dd style={{ color: "var(--fg-2)" }}>{domain?.label ?? node.topicCluster}</dd>
                <dt style={{ color: "var(--fg-3)" }}>Kind</dt>
                <dd style={{ color: "var(--fg-2)" }}>{KIND_LABEL[node.kind]}</dd>
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
            </Facet>
          </section>
      </div>
    </>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[color:var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
      style={{ color: "var(--fg-2)" }}
    >
      {children}
    </button>
  );
}

function ChipGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--fg-3)" }}>
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--fg-4)" }}>
          {count}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
