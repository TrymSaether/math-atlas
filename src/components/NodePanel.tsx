import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XIcon, CaretUpIcon, CaretDownIcon, BookOpenTextIcon, CardsIcon } from "@phosphor-icons/react";

import { useStore } from "../store";
import type { LoadedMap } from "../data";
import { MathText, MathProse, tidyMathText } from "../lib/katex";
import { getDomainTone } from "../lib/colors";
import { nodeDefinition, nodeFormula, nodeFormalStatement, nodeStatement } from "../lib/nodeContent";
import { compactNodeRef, nodeSourceCitation } from "../lib/nodeMeta";
import { DomainGlyph, getDomainGlyphId } from "./DomainGlyph";
import { KIND_LABEL, type GraphNode } from "../types";
import { hasNodeVisual, NodeVisual } from "./NodeVisual";
import { Spine, Facet, MathBox, ConnectionChip, Steps } from "./Specimen";

const USED_BY_INITIAL = 8;
const RELATED_CASE_KINDS = new Set(["example", "non_example", "counterexample"]);

type TabId = "overview" | "proof" | "solution" | "links" | "source";

export function NodePanel() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const node = id && map ? map.nodeById.get(id) ?? null : null;
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {node && map && (
        <motion.aside
          key={node.id}
          initial={reduceMotion ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className="pointer-events-auto absolute left-3 right-3 top-[68px] bottom-3 z-20 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border sm:right-auto sm:w-[min(560px,calc(100vw-24px))]"
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
  const domainGlyphId = getDomainGlyphId(node.domainId);
  const [tab, setTab] = useState<TabId>("overview");
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

  const statement = nodeStatement(node);
  const formalStatement = nodeFormalStatement(node);
  const definition = nodeDefinition(node, [statement, formalStatement]);
  const formula = nodeFormula(node, [statement, formalStatement, definition]);
  const explanation = node.explanation.trim();
  const solution = node.solution.trim();
  const proof = node.proof.trim();
  const gloss = node.gloss.trim();
  const example = node.example.trim();
  const assumptions = node.assumptions;
  const notation = node.notation;
  const compactRef = compactNodeRef(node);
  const sourceCitation = nodeSourceCitation(node);
  const showGloss = gloss && gloss !== explanation;
  const linkCount = prereqIds.length + usedBy.length + examples.length + exercises.length;
  const hasProof = node.proofSteps.length > 0 || Boolean(proof);
  const hasSolution = node.solutionSteps.length > 0 || Boolean(solution);

  // Tabs are content-driven: a tab only appears when it has something to show.
  const tabs = useMemo(() => {
    const t: { id: TabId; label: string; badge?: number }[] = [{ id: "overview", label: "Overview" }];
    if (hasProof) t.push({ id: "proof", label: "Proof" });
    if (hasSolution) t.push({ id: "solution", label: "Solution" });
    if (linkCount > 0) t.push({ id: "links", label: "Links", badge: linkCount });
    t.push({ id: "source", label: "Source" });
    return t;
  }, [hasProof, hasSolution, linkCount]);

  const activeTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  useEffect(() => {
    setTab("overview");
    setShowAllUsed(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [node.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  const openInDictionary = () => {
    select(node.id);
    setSurface("dictionary");
  };

  const openInFlashcards = () => {
    select(node.id);
    setSurface("flashcards");
  }

  return (
    <>
      {/* Sticky header */}
      <header
        className="relative shrink-0 px-5 pt-3"
        style={{ background: "var(--surface)" }}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <IconButton label="Previous in domain" disabled={!prev} onClick={() => prev && select(prev.id)}>
              <CaretUpIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Next in domain" disabled={!next} onClick={() => next && select(next.id)}>
              <CaretDownIcon className="h-4 w-4" />
            </IconButton>
            {peerIdx >= 0 && (
              <span className="ml-1.5 font-mono text-ui-meta" style={{ color: "var(--fg-3)" }}>
                {peerIdx + 1}/{peers.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton label="Open in dictionary" onClick={openInDictionary}>
              <BookOpenTextIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Open in flashcards" onClick={openInFlashcards}>
              <CardsIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Close" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="mt-[7px] h-9 w-[3px] shrink-0 rounded-full"
            style={{ background: tone.color }}
          />
          <div className="min-w-0">
            <h2
              className="font-serif text-node-panel-title"
              style={{ color: "var(--fg-1)", fontWeight: 600, letterSpacing: "-0.015em" }}
            >
              <MathText text={node.title} />
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ui-meta">
              <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: tone.color }}>
                {domainGlyphId ? (
                  <DomainGlyph id={domainGlyphId} size={14} />
                ) : (
                  <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
                )}
                {domain?.label ?? node.topicCluster}
              </span>
              <span aria-hidden style={{ color: "var(--fg-4)" }}>·</span>
              <span style={{ color: "var(--fg-2)" }}>{KIND_LABEL[node.kind]}</span>
              {compactRef && (
                <>
                  <span aria-hidden style={{ color: "var(--fg-4)" }}>·</span>
                  <span className="font-mono text-ui-hint" style={{ color: "var(--fg-3)" }}>{compactRef}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div role="tablist" className="mt-3.5 flex items-center gap-0.5">
          {tabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-1.5 rounded-t-[7px] px-3 pb-2 pt-1.5 font-mono text-ui-xs transition-colors focus:outline-none"
                style={{ color: active ? "var(--fg-1)" : "var(--fg-3)" }}
              >
                {t.label}
                {t.badge != null && (
                  <span
                    className="rounded-full px-1.5 py-px text-ui-2xs leading-none"
                    style={{
                      background: active ? tone.tint : "var(--surface-3)",
                      color: active ? tone.color : "var(--fg-3)",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="panel-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                    style={{ background: tone.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="-mx-5 border-b" style={{ borderColor: "var(--border-subtle)" }} />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {activeTab === "overview" && (
          <>
            {hasNodeVisual(node) ? (
              <section id="sec-diagram">
                <NodeVisual node={node} />
              </section>
            ) : null}

            {statement && (
              <section id="sec-statement">
                <Spine tone={tone} kind={node.kind}>
                  <MathProse text={statement} />
                </Spine>
              </section>
            )}

            {assumptions.length > 0 && (
              <section id="sec-assumptions">
                <Facet label="Assumptions">
                  <ul className="m-0 space-y-1.5 p-0">
                    {assumptions.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: tone.color }} />
                        <span><MathProse text={a} /></span>
                      </li>
                    ))}
                  </ul>
                </Facet>
              </section>
            )}

            {formalStatement && formalStatement !== statement && (
              <section id="sec-formal">
                <Facet label="Formal statement">
                  <MathProse text={formalStatement} />
                </Facet>
              </section>
            )}

            {definition && (
              <section id="sec-definition">
                <Facet label="Definition" toneColor={tone.color}>
                  <MathBox text={definition} />
                </Facet>
              </section>
            )}

            {formula && (
              <section id="sec-formula">
                <Facet label="Formula" toneColor={tone.color}>
                  <MathBox text={formula} />
                </Facet>
              </section>
            )}

            {/* {notation.length > 0 && (
              <section id="sec-notation">
                <Facet label="Notation" muted>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                    {notation.map((n, i) => (
                      <span key={i} className="font-math text-ui-body" style={{ color: "var(--fg-1)" }}>
                        <MathText text={n} />
                      </span>
                    ))}
                  </div>
                </Facet>
              </section>
            )} */}

            {explanation && (
              <section id="sec-intuition">
                <Facet label="Intuition">
                  <MathProse text={explanation} />
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

            {linkCount > 0 && (
              <section id="sec-overview-links">
                <div className="space-y-3">
                  <PanelDictionaryLinkGroup label="Depends on" ids={prereqIds} map={map} onPick={select} />
                  <PanelDictionaryLinkGroup label="Used by" ids={usedBy} map={map} onPick={select} />
                  <PanelDictionaryLinkGroup label="Related cases" ids={examples} map={map} onPick={select} />
                  <PanelDictionaryLinkGroup label="Exercises" ids={exercises} map={map} onPick={select} />
                </div>
              </section>
            )}

            {!statement && !explanation && !definition && !formalStatement && !showGloss && !example &&
              assumptions.length === 0 && notation.length === 0 && linkCount === 0 && (
                <p className="text-ui-sm italic" style={{ color: "var(--fg-3)" }}>
                  No written content recorded for this concept yet.
                </p>
              )}
          </>
        )}

        {activeTab === "proof" && (
          <section id="sec-proof">
            <StepHeading label="Proof" toneColor={tone.color} />
            {node.proofSteps.length > 0 ? (
              <Steps steps={node.proofSteps} toneColor={tone.color} map={map} onSelect={select} />
            ) : (
              <ProseArgument text={proof} toneColor={tone.color} />
            )}
          </section>
        )}

        {activeTab === "solution" && (
          <section id="sec-solution">
            <StepHeading label="Solution" toneColor={tone.color} />
            {node.solutionSteps.length > 0 ? (
              <Steps steps={node.solutionSteps} toneColor={tone.color} map={map} onSelect={select} />
            ) : (
              <ProseArgument text={solution} toneColor={tone.color} />
            )}
          </section>
        )}

        {activeTab === "links" && (
          <section id="sec-connections" className="space-y-4">
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
                    className="self-center px-1 text-ui-xs hover:underline"
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

        {activeTab === "source" && (
          <section id="sec-metadata">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-ui-xs">
              <dt style={{ color: "var(--fg-3)" }}>Tags</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.tags.length > 0 ? node.tags.join(", ") : "No tags recorded."}
              </dd>
              <dt style={{ color: "var(--fg-3)" }}>Domain</dt>
              <dd style={{ color: "var(--fg-2)" }}>{domain?.label ?? node.topicCluster}</dd>
              <dt style={{ color: "var(--fg-3)" }}>Kind</dt>
              <dd style={{ color: "var(--fg-2)" }}>{KIND_LABEL[node.kind]}</dd>
              <dt style={{ color: "var(--fg-3)" }}>Map position</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.chapter} · {node.section || "unranked"} · #{node.number}
              </dd>
              {compactRef && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Reference</dt>
                  <dd style={{ color: "var(--fg-2)" }}>{compactRef}</dd>
                </>
              )}
              {sourceCitation && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Citation</dt>
                  <dd style={{ color: "var(--fg-2)" }}>{sourceCitation}</dd>
                </>
              )}
              {node.bookRefs.length > 0 && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Textbook</dt>
                  <dd className="flex flex-wrap gap-1" style={{ color: "var(--fg-2)" }}>
                    {node.bookRefs.map((r) => (
                      <span
                        key={r}
                        className="rounded font-mono text-ui-2xs"
                        style={{ background: "var(--surface-3)", color: "var(--fg-3)", padding: "1px 5px" }}
                      >
                        {r}
                      </span>
                    ))}
                  </dd>
                </>
              )}
              <dt style={{ color: "var(--fg-3)" }}>ID</dt>
              <dd className="truncate font-mono text-ui-hint" style={{ color: "var(--fg-2)" }} title={node.id}>
                {node.id}
              </dd>
            </dl>
          </section>
        )}
      </div>
    </>
  );
}

/** Mono micro-label with a dashed derivation rule, heading the Proof/Solution tabs. */
function StepHeading({ label, toneColor }: { label: string; toneColor: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="font-mono text-ui-2xs uppercase tracking-label" style={{ color: toneColor }}>
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1"
        style={{ background: `repeating-linear-gradient(90deg, ${toneColor} 0 2px, transparent 2px 5px)`, opacity: 0.5 }}
      />
    </div>
  );
}

/** Fallback renderer for legacy single-string proofs/solutions (non-stepped data). */
function ProseArgument({ text, toneColor }: { text: string; toneColor: string }) {
  return (
    <div
      className="font-math pl-3.5 text-ui-copy leading-[1.7]"
      style={{ color: "var(--fg-1)", borderLeft: `1.5px dotted color-mix(in srgb, ${toneColor} 55%, transparent)` }}
    >
      <MathProse text={tidyMathText(text)} asBlock />
      <span aria-hidden className="mt-1.5 block text-right text-ui-sm" style={{ color: toneColor }}>
        ∎
      </span>
    </div>
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
        <span className="font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>
          {label}
        </span>
        <span className="font-mono text-ui-2xs" style={{ color: "var(--fg-4)" }}>
          {count}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function PanelDictionaryLinkGroup({
  label,
  ids,
  map,
  onPick,
}: {
  label: string;
  ids: string[];
  map: LoadedMap;
  onPick: (id: string) => void;
}) {
  const nodes = ids
    .map((id) => map.nodeById.get(id))
    .filter((node): node is GraphNode => Boolean(node));

  if (nodes.length === 0) return null;

  return (
    <div>
      <span className="mb-1.5 block font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {nodes.map((node) => {
          const nodeTone = getDomainTone(node.domainId);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onPick(node.id)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-1 text-left text-ui-xs leading-tight transition-colors hover:bg-[color:var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
              style={{ borderColor: nodeTone.border, color: "var(--fg-2)", background: "var(--surface)" }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: nodeTone.color }} aria-hidden />
              <span className="min-w-0 truncate">
                <MathText text={node.title} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
