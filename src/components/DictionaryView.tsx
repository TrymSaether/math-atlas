import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRightIcon, ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

import { useStore } from "../store";
import { MAPS, type LoadedMap, type MapId } from "../data";
import type { GraphNode } from "../types";
import { MathText } from "../lib/katex";
import { KIND_LABEL } from "../types";
import { getDomainTone } from "../lib/colors";
import { useConceptView } from "../lib/conceptView";
import { kindAbbrev } from "../lib/nodeCategory";
import { kindIcon } from "../lib/nodeCategoryIcons";
import {
  KIND_ORDER,
  dictionaryEntries,
  sectionFacet,
  type DictSortMode,
  type SectionFacet,
} from "../lib/dictionary";
import { ConceptHeader, ConceptBody, ConceptRelations } from "./concept";
import { hasNodeVisual } from "./NodeVisual";
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
    const visualOnly = map.data.nodes.filter((node) => !seen.has(node.id) && hasNodeVisual(node));
    return [...base, ...visualOnly];
  }, [map]);
  const facet = useMemo(() => sectionFacet(map, entries), [map, entries]);
  const [sortBy, setSortBy] = useState<DictSortMode>("alpha");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const [mobileDetail, setMobileDetail] = useState(false);

  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1);
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

  const groups = useMemo(() => groupEntries(filtered, sortBy, facet), [filtered, sortBy, facet]);

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
    const el = indexRef.current?.querySelector<HTMLElement>(`#dict-row-${CSS.escape(activeId)}`);
    el?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
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
    <div className="dictionary-view" style={{ background: "var(--bg)", color: "var(--fg-1)" }}>
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
              <div className="dict-facets" role="group" aria-label="Filter by domain">
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
                      <span className="dict-facet-dot" style={{ background: tone.color }} />
                      <span className="dict-facet-lab">{d.label}</span>
                      <span className="dict-facet-n">{d.count}</span>
                    </button>
                  );
                })}
                {topics.size > 0 && (
                  <button type="button" className="dict-facet-reset" onClick={resetTopics}>
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="dict-controls">
              <span className="dict-controls-lab">Sort</span>
              <Chip label="A–Z" active={sortBy === "alpha"} onClick={() => setSortBy("alpha")} />
              <Chip
                label={facet.mode === "chapter" ? "Chapter" : "Domain"}
                active={sortBy === "section"}
                onClick={() => setSortBy("section")}
              />
              <Chip label="Kind" active={sortBy === "kind"} onClick={() => setSortBy("kind")} />
            </div>
          </header>

          <div className="dict-rows" ref={indexRef}>
            {entries.length === 0 ? (
              <p className="dict-empty">No dictionary entries for {meta.label} yet.</p>
            ) : groups.length === 0 ? (
              <p className="dict-empty">No entries match the current filters.</p>
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
              mapId={mapId}
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
  const Icon = kindIcon(entry.kind);
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
  mapId,
  onBack,
  onPickRelated,
}: {
  entry: GraphNode;
  map: LoadedMap;
  mapId: MapId;
  onBack: () => void;
  onPickRelated: (id: string) => void;
}) {
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const view = useConceptView(entry, map, mapId);

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
          <ConceptHeader view={view} />
        </header>

        <div className="dict-doc-body">
          <ConceptBody view={view} map={map} density="full" onSelect={onPickRelated} />
        </div>

        <footer className="dict-doc-foot">
          <ConceptRelations
            relations={view.relations}
            map={map}
            onSelect={onPickRelated}
            includeSeeAlso
          />
          <button type="button" className="dict-open" onClick={openInAtlas}>
            Show in atlas <ArrowUpRightIcon className="h-3 w-3" aria-hidden />
          </button>
        </footer>
      </div>
    </article>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className="dict-chip" aria-pressed={active} onClick={onClick}>
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
    return order.indexOf(facet.valueOf(a)) - order.indexOf(facet.valueOf(b)) || alpha;
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
    .replace(/^\\(?:mathrm|mathbf|mathbb|mathcal|operatorname|text)\{([^{}]+)\}/, "$1")
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

function groupEntries(items: GraphNode[], sortBy: DictSortMode, facet: SectionFacet): Group[] {
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
