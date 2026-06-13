import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";

import { useStore } from "../store";
import { MAPS, type LoadedMap, type MapId } from "../data";
import type { GraphNode } from "../types";
import { MathText, MathProse } from "../lib/katex";
import { KIND_LABEL } from "../types";
import { getDomainTone } from "../lib/colors";
import {
  nodeDefinition,
  nodeFormula,
  proofBlockLabel,
} from "../lib/nodeContent";
import { CATEGORY_META, categoryOf, kindAbbrev } from "../lib/nodeCategory";
import {
  KIND_ORDER,
  dictionaryEntries,
  entryStatement,
  entryFormalStatement,
  sectionFacet,
  type DictSortMode,
  type SectionFacet,
} from "../lib/dictionary";
import {
  Spine,
  Facet,
  MathBox,
  Proof,
  Steps,
  StepLabel,
  specimenMeta,
} from "./Specimen";
import { hasNodeVisual, NodeVisual } from "./NodeVisual";
import "./DictionaryView.css";

export function DictionaryView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <DictionaryBody map={map} mapId={mapId} />;
}

function DictionaryBody({ map, mapId }: { map: LoadedMap; mapId: MapId }) {
  const select = useStore((s) => s.select);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const selectedId = useStore((s) => s.selectedId);
  const meta = MAPS[mapId];
  const indexRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    const base = dictionaryEntries(map);
    const seen = new Set(base.map((node) => node.id));
    const visualOnly = map.data.nodes.filter(
      (node) => !seen.has(node.id) && hasNodeVisual(node),
    );
    return [...base, ...visualOnly];
  }, [map]);
  const facet = useMemo(() => sectionFacet(map, entries), [map, entries]);
  const [sortBy, setSortBy] = useState<DictSortMode>("alpha");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const [mobileDetail, setMobileDetail] = useState(false);

  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries)
      counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1);
    return map.data.domains
      .map((d) => ({ id: d.id, label: d.label, count: counts.get(d.id) ?? 0 }))
      .filter((d) => d.count > 0);
  }, [entries, map]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = entries.filter((e) => {
      if (kinds.size > 0 && !kinds.has(e.kind)) return false;
      if (topics.size > 0 && !topics.has(e.domain)) return false;
      if (
        q &&
        !e.label.toLowerCase().includes(q) &&
        !(e.source?.ref ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    return items.sort((a, b) => compareEntries(a, b, sortBy, facet));
  }, [entries, facet, kinds, topics, sortBy, query]);

  const groups = useMemo(
    () => groupEntries(filtered, sortBy, facet),
    [filtered, sortBy, facet],
  );

  // Keep a valid selection: honor an external (⌘K) selection, else fall back to
  // the first entry that survives the current filters.
  useEffect(() => {
    if (selectedId && entries.some((e) => e.id === selectedId)) {
      setActiveId(selectedId);
      setMobileDetail(true);
    }
  }, [selectedId, entries]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!activeId || !filtered.some((e) => e.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  // Reveal the active row in the index list.
  useEffect(() => {
    if (!activeId) return;
    const el = indexRef.current?.querySelector<HTMLElement>(
      `#dict-row-${CSS.escape(activeId)}`,
    );
    el?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
  }, [activeId]);

  const activeEntry = activeId ? (map.nodeById.get(activeId) ?? null) : null;

  const openRow = (id: string) => {
    setActiveId(id);
    select(id);
    setMobileDetail(true);
  };

  return (
    <div
      className="dictionary-view"
      style={{ background: "var(--bg)", color: "var(--fg-1)" }}
    >
      <div className={`dict-md${mobileDetail ? " dict-md--detail" : ""}`}>
        {/* ---- Index column ---- */}
        <aside className="dict-index" aria-label="Dictionary index">
          <header className="dict-index-head">
            <p className="dict-kicker">{meta.label} · Dictionary</p>
            <div className="dict-headrow">
              <h1 className="dict-title font-serif">{meta.label}</h1>
              <span className="dict-count">
                {filtered.length}/{entries.length}
              </span>
            </div>

            <div className="dict-search">
              <MagnifyingGlassIcon className="dict-search-icon" aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter entries…"
                aria-label="Filter entries"
              />
            </div>

            {domainCounts.length > 1 && (
              <div
                className="dict-facets"
                role="group"
                aria-label="Filter by domain"
              >
                {domainCounts.map((d) => {
                  const tone = getDomainTone(d.id);
                  const active = topics.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className="dict-facet"
                      aria-pressed={active}
                      onClick={() => toggleTopic(d.id)}
                      style={
                        active
                          ? {
                              background: tone.tint,
                              borderColor: tone.border,
                              color: tone.text,
                            }
                          : undefined
                      }
                      title={d.label}
                    >
                      <span
                        className="dict-facet-dot"
                        style={{ background: tone.color }}
                      />
                      <span className="dict-facet-lab">{d.label}</span>
                      <span className="dict-facet-n">{d.count}</span>
                    </button>
                  );
                })}
                {topics.size > 0 && (
                  <button
                    type="button"
                    className="dict-facet-reset"
                    onClick={resetTopics}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="dict-controls">
              <span className="dict-controls-lab">Sort</span>
              <Chip
                label="A–Z"
                active={sortBy === "alpha"}
                onClick={() => setSortBy("alpha")}
              />
              <Chip
                label={facet.mode === "chapter" ? "Chapter" : "Domain"}
                active={sortBy === "section"}
                onClick={() => setSortBy("section")}
              />
              <Chip
                label="Kind"
                active={sortBy === "kind"}
                onClick={() => setSortBy("kind")}
              />
            </div>
          </header>

          <div className="dict-rows" ref={indexRef}>
            {entries.length === 0 ? (
              <p className="dict-empty">
                No dictionary entries for {meta.label} yet.
              </p>
            ) : groups.length === 0 ? (
              <p className="dict-empty">
                No entries match the current filters.
              </p>
            ) : (
              groups.map((group) => (
                <section key={group.id} className="dict-rowgroup">
                  <h2 className="dict-grouphead">
                    {group.label}
                    <span className="dict-group-n">{group.items.length}</span>
                  </h2>
                  {group.items.map((entry) => (
                    <IndexRow
                      key={entry.id}
                      entry={entry}
                      active={entry.id === activeId}
                      onClick={() => openRow(entry.id)}
                    />
                  ))}
                </section>
              ))
            )}
          </div>
        </aside>

        {/* ---- Detail pane ---- */}
        <main className="dict-detail">
          {activeEntry ? (
            <DetailPane
              entry={activeEntry}
              map={map}
              onBack={() => setMobileDetail(false)}
              onPickRelated={openRow}
            />
          ) : (
            <div className="dict-detail-empty">
              <p>Select an entry to read its definition.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function IndexRow({
  entry,
  active,
  onClick,
}: {
  entry: GraphNode;
  active: boolean;
  onClick: () => void;
}) {
  const tone = getDomainTone(entry.domain);
  const Icon = CATEGORY_META[categoryOf(entry.kind)].icon;
  return (
    <button
      type="button"
      id={`dict-row-${entry.id}`}
      className={`dict-row${active ? " dict-row--active" : ""}`}
      onClick={onClick}
      aria-current={active}
      style={active ? { background: tone.tint } : undefined}
    >
      <span
        className="dict-row-rail"
        style={{ background: active ? tone.color : "transparent" }}
        aria-hidden
      />
      <span className="dict-row-glyph" style={{ color: tone.color }}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="dict-row-term font-serif">
        <MathText text={entry.label} />
      </span>
      <span className="dict-row-meta">{kindAbbrev(entry.kind)}</span>
    </button>
  );
}

function DetailPane({
  entry,
  map,
  onBack,
  onPickRelated,
}: {
  entry: GraphNode;
  map: LoadedMap;
  onBack: () => void;
  onPickRelated: (id: string) => void;
}) {
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const tone = getDomainTone(entry.domain);
  const domain = map.domainById.get(entry.domain);
  const statement = entryStatement(entry);
  const formalStatement = entryFormalStatement(entry);
  const definition = nodeDefinition(entry, [statement, formalStatement]);
  const formula = nodeFormula(entry, [statement, formalStatement, definition]);
  const proofSteps = entry.proof?.steps ?? [];
  const proofLabel = proofBlockLabel(entry.kind);
  const prereqIds = [
    ...new Set([...entry.statementDependencies, ...entry.proofDependencies]),
  ];
  const usedByIds = [
    ...new Set(
      (map.outgoingEdgesByNodeId.get(entry.id) ?? []).map((edge) => edge.to),
    ),
  ].filter((id) => {
    const node = map.nodeById.get(id);
    return (
      node && !RELATED_CASE_KINDS.has(node.kind) && node.kind !== "exercise"
    );
  });
  const relatedCaseIds = (() => {
    const ids = new Set<string>();
    for (const edge of map.outgoingEdgesByNodeId.get(entry.id) ?? [])
      ids.add(edge.to);
    for (const edge of map.incomingEdgesByNodeId.get(entry.id) ?? [])
      ids.add(edge.from);
    return [...ids].filter((id) => {
      const node = map.nodeById.get(id);
      return node && RELATED_CASE_KINDS.has(node.kind);
    });
  })();
  const exerciseIds = (map.outgoingEdgesByNodeId.get(entry.id) ?? [])
    .map((edge) => edge.to)
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .filter((id) => map.nodeById.get(id)?.kind === "exercise");
  const related = [
    ...new Set([
      ...(map.outgoingEdgesByNodeId.get(entry.id) ?? [])
        .filter((e) => e.relation === "related_to")
        .map((e) => e.to),
      ...(map.incomingEdgesByNodeId.get(entry.id) ?? [])
        .filter((e) => e.relation === "related_to")
        .map((e) => e.from),
    ]),
  ]
    .map((id) => map.nodeById.get(id))
    .filter((n): n is GraphNode => Boolean(n));

  const openInAtlas = () => {
    select(entry.id);
    setSurface("atlas");
  };

  return (
    <article className="dict-doc" key={entry.id}>
      <div className="dict-doc-inner">
        <button type="button" className="dict-back" onClick={onBack}>
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden /> All entries
        </button>

        <header className="dict-doc-head">
          <span
            className="dict-doc-rail"
            style={{ background: tone.color }}
            aria-hidden
          />
          <h2 className="dict-doc-term font-serif">
            <MathText text={entry.label} />
          </h2>
          <div className="dict-doc-meta">
            <span className="dict-doc-domain" style={{ color: tone.color }}>
              {domain?.label ?? entry.topicCluster}
            </span>
            <span className="dict-doc-sep" aria-hidden>
              ·
            </span>
            <span>{specimenMeta(entry)}</span>
          </div>
        </header>

        {hasNodeVisual(entry) && (
          <div className="dict-doc-dia">
            <NodeVisual node={entry} className="dict-doc-visual" />
          </div>
        )}

        <div className="dict-doc-body">
          {statement && (
            <Spine tone={tone} kind={entry.kind} label="Statement" size="dict">
              <MathProse text={statement} asBlock />
            </Spine>
          )}
          {entry.assumptions.length > 0 && (
            <Facet label="Assumptions">
              <ul className="m-0 space-y-1.5 p-0">
                {entry.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                      style={{ background: tone.color }}
                    />
                    <span>
                      <MathProse text={a} />
                    </span>
                  </li>
                ))}
              </ul>
            </Facet>
          )}
          {formalStatement && formalStatement !== statement && (
            <Facet label="Formal statement">
              <MathProse text={formalStatement} asBlock />
            </Facet>
          )}
          {definition && (
            <Facet label="Definition" toneColor={tone.color}>
              <MathBox text={definition} />
            </Facet>
          )}
          {formula && (
            <Facet label="Formula" toneColor={tone.color}>
              <MathBox text={formula} />
            </Facet>
          )}
          {entry.content.notation.length > 0 && (
            <Facet label="Notation" muted>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {entry.content.notation.map((n, i) => (
                  <span
                    key={i}
                    className="font-math"
                    style={{ color: "var(--fg-1)" }}
                  >
                    <MathText text={n} />
                  </span>
                ))}
              </div>
            </Facet>
          )}
          {entry.content.gloss && (
            <Facet label="In words">
              <MathProse text={entry.content.gloss} asBlock />
            </Facet>
          )}
          {entry.examples[0]?.tex && (
            <Facet label="Example" muted>
              <MathProse text={entry.examples[0].tex} asBlock />
            </Facet>
          )}
          {proofSteps.length > 0 && (
            <div>
              <StepLabel label={proofLabel} toneColor={tone.color} />
              <Steps
                steps={proofSteps}
                toneColor={tone.color}
                map={map}
                onSelect={onPickRelated}
              />
            </div>
          )}
        </div>

        <footer className="dict-doc-foot">
          <DictionaryLinkGroup
            label="Depends on"
            ids={prereqIds}
            map={map}
            onPick={onPickRelated}
          />
          <DictionaryLinkGroup
            label="Used by"
            ids={usedByIds}
            map={map}
            onPick={onPickRelated}
          />
          <DictionaryLinkGroup
            label="Related cases"
            ids={relatedCaseIds}
            map={map}
            onPick={onPickRelated}
          />
          <DictionaryLinkGroup
            label="Exercises"
            ids={exerciseIds}
            map={map}
            onPick={onPickRelated}
          />
          {related.length > 0 && (
            <div className="dict-related">
              <span className="dict-related-lab">See also</span>
              <div className="dict-related-chips">
                {related.map((n) => {
                  const rtone = getDomainTone(n.domain);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className="dict-related-chip"
                      onClick={() => onPickRelated(n.id)}
                      style={{ borderColor: rtone.border }}
                    >
                      <span
                        className="dict-related-dot"
                        style={{ background: rtone.color }}
                        aria-hidden
                      />
                      <MathText text={n.label} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button type="button" className="dict-open" onClick={openInAtlas}>
            Show in atlas <ArrowUpRightIcon className="h-3 w-3" aria-hidden />
          </button>
        </footer>
      </div>
    </article>
  );
}

const RELATED_CASE_KINDS = new Set([
  "example",
  "non_example",
  "counterexample",
]);

function DictionaryLinkGroup({
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
    <div className="dict-related">
      <span className="dict-related-lab">{label}</span>
      <div className="dict-related-chips">
        {nodes.map((node) => {
          const tone = getDomainTone(node.domain);
          return (
            <button
              key={node.id}
              type="button"
              className="dict-related-chip"
              onClick={() => onPick(node.id)}
              style={{ borderColor: tone.border }}
            >
              <span
                className="dict-related-dot"
                style={{ background: tone.color }}
                aria-hidden
              />
              <MathText text={node.label} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="dict-chip"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function compareEntries(
  a: GraphNode,
  b: GraphNode,
  sortBy: DictSortMode,
  facet: SectionFacet,
): number {
  const alpha = dictionarySortTitle(a.label).localeCompare(
    dictionarySortTitle(b.label),
    undefined,
    {
      sensitivity: "base",
    },
  );
  if (sortBy === "section") {
    const order = facet.values;
    return (
      order.indexOf(facet.valueOf(a)) - order.indexOf(facet.valueOf(b)) || alpha
    );
  }
  if (sortBy === "kind") {
    return (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99) || alpha;
  }
  return alpha;
}

function dictionarySortTitle(title: string): string {
  return title
    .trim()
    .replace(/^(\${1,2}|\\\(|\\\[)\s*/, "")
    .replace(
      /^\\(?:mathrm|mathbf|mathbb|mathcal|operatorname|text)\{([^{}]+)\}/,
      "$1",
    )
    .replace(/^\\ell\b/, "L")
    .replace(/^\\([A-Za-z]+)\b/, "$1");
}

function dictionaryLetter(title: string): string {
  const match = dictionarySortTitle(title).match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "#";
}

interface Group {
  id: string;
  label: string;
  items: GraphNode[];
}

function groupEntries(
  items: GraphNode[],
  sortBy: DictSortMode,
  facet: SectionFacet,
): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  for (const entry of items) {
    let label: string;
    let id: string;
    if (sortBy === "section") {
      const v = facet.valueOf(entry);
      label = facet.labelOf(v);
      id = `dict-sec-${v}`;
    } else if (sortBy === "kind") {
      label = `${KIND_LABEL[entry.kind]}s`;
      id = `dict-kind-${entry.kind}`;
    } else {
      const letter = dictionaryLetter(entry.label);
      label = letter;
      id = `dict-L-${letter}`;
    }
    if (!current || current.label !== label) {
      current = { id, label, items: [] };
      groups.push(current);
    }
    current.items.push(entry);
  }
  return groups;
}
