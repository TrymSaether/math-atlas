import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ArrowLeft, Search } from "lucide-react";

import { useStore } from "../store";
import { type LoadedMap, type MapId } from "../data";
import type { GraphNode } from "../types";
import { MathText } from "../lib/katex";
import { KIND_LABEL } from "../types";
import { getDomainTone } from "../lib/colors";
import { useConceptView } from "../lib/conceptView";
import { kindAbbrev } from "../lib/nodeCategory";
import { kindIcon } from "../lib/nodeCategoryIcons";
import { KIND_ORDER, dictionaryEntries, sectionFacet, type DictSortMode, type SectionFacet } from "../lib/dictionary";
import { ConceptHeader, ConceptBody, ConceptRelations } from "./concept";
import { hasNodeVisual } from "./nodeVisualModel";

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
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
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
      if (q && !e.label.toLowerCase().includes(q) && !(e.source?.ref ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
    return items.sort((a, b) => compareEntries(a, b, sortBy, facet));
  }, [entries, facet, kinds, topics, sortBy, query]);

  const groups = useMemo(() => groupEntries(filtered, sortBy, facet), [filtered, sortBy, facet]);

  // Keep a valid selection: honor an external (⌘K) selection, else fall back to
  // the first entry that survives the current filters. Both adjustments run during
  // render (the fallback is self-converging) rather than in effects.
  const [prevSelectedId, setPrevSelectedId] = useState(selectedId);
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId);
    if (selectedId && entries.some((e) => e.id === selectedId)) {
      setActiveId(selectedId);
      setMobileDetail(true);
    }
  }

  if (filtered.length > 0 && (!activeId || !filtered.some((e) => e.id === activeId))) {
    setActiveId(filtered[0].id);
  }

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
    <div className="absolute inset-0 overflow-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 bottom-0 top-[var(--shell-dock-top)] grid h-[calc(100%-var(--shell-dock-top))] grid-cols-[minmax(300px,360px)_minmax(0,1fr)] max-[860px]:grid-cols-1">
        {/* ---- Index column ---- */}
        <aside
          className={`flex min-h-0 flex-col border-r border-border bg-muted ${mobileDetail ? "max-[860px]:hidden" : ""}`}
          aria-label="Dictionary index"
        >
          <header className="flex-shrink-0 border-b border-border bg-card px-4 pb-3 pt-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="mt-1 text-title-3 font-medium leading-[1.08] text-foreground">{mapTitle}</h1>
              <span className="flex-shrink-0 whitespace-nowrap font-mono text-caption-2 text-muted-foreground">
                {filtered.length}/{entries.length}
              </span>
            </div>

            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute left-[9px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-muted-foreground/70"
                aria-hidden
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter entries…"
                aria-label="Filter entries"
                className="min-h-[34px] w-full rounded-md border border-border bg-muted py-1.5 pl-7 pr-2.5 font-sans text-footnote text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card"
              />
            </div>

            {domainCounts.length > 1 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by domain">
                {domainCounts.map((d) => {
                  const tone = getDomainTone(d.id);
                  const active = topics.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className="inline-flex min-h-[24px] max-w-full items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-[3px] text-caption-2 font-medium text-muted-foreground transition hover:border-input"
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
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: tone.color }} />
                      <span className="max-w-[12ch] overflow-hidden text-ellipsis whitespace-nowrap">{d.label}</span>
                      <span className="font-mono text-caption-2 opacity-70">{d.count}</span>
                    </button>
                  );
                })}
                {topics.size > 0 && (
                  <button
                    type="button"
                    className="px-1.5 py-[3px] text-caption-2 text-primary hover:underline"
                    onClick={resetTopics}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="mr-0.5 font-mono text-caption-2 uppercase tracking-label-tight text-muted-foreground">
                Sort
              </span>
              <Chip label="A–Z" active={sortBy === "alpha"} onClick={() => setSortBy("alpha")} />
              <Chip
                label={facet.mode === "chapter" ? "Chapter" : "Domain"}
                active={sortBy === "section"}
                onClick={() => setSortBy("section")}
              />
              <Chip label="Kind" active={sortBy === "kind"} onClick={() => setSortBy("kind")} />
            </div>
          </header>

          <div className="panel-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-10 pt-1.5" ref={indexRef}>
            {entries.length === 0 ? (
              <p className="px-6 py-16 text-center italic text-muted-foreground">
                No dictionary entries for {mapTitle} yet.
              </p>
            ) : groups.length === 0 ? (
              <p className="px-6 py-16 text-center italic text-muted-foreground">
                No entries match the current filters.
              </p>
            ) : (
              groups.map((group) => (
                <section key={group.id} className="mt-2.5 first:mt-0.5">
                  <h2 className="sticky top-0 z-[1] m-0 flex items-baseline gap-1.5 bg-gradient-to-b from-muted from-70% to-transparent px-2.5 pb-1 pt-1.5 font-mono text-caption-2 font-semibold uppercase tracking-label-tight text-muted-foreground">
                    {group.label}
                    <span className="text-caption-2 font-medium text-muted-foreground/70">{group.items.length}</span>
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
        <main
          className={`panel-scrollbar block min-h-0 overflow-y-auto bg-background ${mobileDetail ? "" : "max-[860px]:hidden"}`}
        >
          {activeEntry ? (
            <DetailPane
              entry={activeEntry}
              map={map}
              mapId={mapId}
              onBack={() => setMobileDetail(false)}
              onPickRelated={openRow}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-16 text-center italic text-muted-foreground">
              <p>Select an entry to read its definition.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function IndexRow({ entry, active, onClick }: { entry: GraphNode; active: boolean; onClick: () => void }) {
  const tone = getDomainTone(entry.domain);
  const icon = kindIcon(entry.kind);
  return (
    <button
      type="button"
      id={`dict-row-${entry.id}`}
      className="relative flex min-h-[34px] w-full items-center gap-2 rounded-md border-none bg-transparent py-1.5 pl-3 pr-2.5 text-left [scroll-margin:48px_0] transition-colors hover:bg-accent"
      onClick={onClick}
      aria-current={active}
      style={active ? { background: tone.tint } : undefined}
    >
      <span
        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
        style={{ background: active ? tone.color : "transparent" }}
        aria-hidden
      />
      <span
        className={`flex flex-shrink-0 items-center justify-center ${active ? "opacity-100" : "opacity-85"}`}
        style={{ color: tone.color }}
      >
        {createElement(icon, { className: "h-3.5 w-3.5", "aria-hidden": true })}
      </span>
      <span
        className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-body leading-[1.35] text-foreground ${
          active ? "font-semibold" : "font-[450]"
        }`}
      >
        <MathText text={entry.label} />
      </span>
      <span className="flex-shrink-0 font-mono text-caption-1 text-muted-foreground">{kindAbbrev(entry.kind)}</span>
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
    <article key={entry.id}>
      <div className="mx-auto max-w-[760px] px-10 pb-24 pt-9 max-[860px]:px-[22px] max-[860px]:pb-20 max-[860px]:pt-6">
        <button
          type="button"
          className="mb-4 hidden items-center gap-1.5 border-none bg-transparent p-0 font-mono text-caption-1 text-primary max-[860px]:inline-flex"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All entries
        </button>

        <header className="mb-6">
          <ConceptHeader view={view} />
        </header>

        <div className="[&>*+*]:mt-[18px]">
          <ConceptBody view={view} map={map} density="full" onSelect={onPickRelated} />
        </div>

        <footer className="mt-7 flex flex-col gap-4 border-t border-dashed border-border pt-[18px]">
          <ConceptRelations relations={view.relations} map={map} onSelect={onPickRelated} includeSeeAlso />
          <button
            type="button"
            className="inline-flex min-h-[30px] items-center gap-1 self-start rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-caption-1 text-primary transition hover:bg-primary/20"
            onClick={openInAtlas}
          >
            Show in atlas <ArrowUpRight className="h-3 w-3" aria-hidden />
          </button>
        </footer>
      </div>
    </article>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="min-h-[24px] rounded-sm border border-border bg-card px-2.5 py-[3px] font-mono text-caption-2 text-muted-foreground transition hover:border-input hover:text-foreground aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function compareEntries(a: GraphNode, b: GraphNode, sortBy: DictSortMode, facet: SectionFacet): number {
  const alpha = dictionarySortTitle(a.label).localeCompare(dictionarySortTitle(b.label), undefined, {
    sensitivity: "base",
  });
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
