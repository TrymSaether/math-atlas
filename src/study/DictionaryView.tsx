import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ArrowLeft, ChevronLeft, ChevronRight, FileText, GraduationCap, Search } from "lucide-react";

import { useStore } from "@/app/store";
import type { AtlasMap } from "@/atlas/model";
import type { MapId } from "@/maps";
import type { GraphNode } from "@/maps/types";
import { MathText } from "@/math/MathText";
import { KIND_LABEL } from "@/maps/types";
import { getDomainTone } from "@/atlas/colors";
import { useConceptView } from "./concept/view";
import { kindAbbrev } from "@shared/maps/nodeCategory";
import { kindIcon } from "@/atlas/nodeCategoryIcons";
import {
  KIND_ORDER,
  buildSearchIndex,
  dictionaryEntries,
  normalizeSearchText,
  searchHit,
  sectionFacet,
  type DictSortMode,
  type SectionFacet,
} from "./dictionary";
import { ConceptHeader, ConceptBody, ConceptRelations } from "./concept";
import { hasNodeVisual } from "./concept/visualModel";
import { useDrill, prerequisiteDeck } from "./drill";
import type { ProgressStatus } from "@/progress/api";
import { Chip } from "@/ui/chip";
import { useRegisterShellActions, type ShellAction } from "@/app/ShellActions";

export function DictionaryView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <DictionaryBody map={map} mapId={mapId} />;
}

function DictionaryBody({ map, mapId }: { map: AtlasMap; mapId: MapId }) {
  const select = useStore((s) => s.select);
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const selectedId = useStore((s) => s.selectedId);
  const setSurface = useStore((s) => s.setSurface);
  const setMode = useStore((s) => s.setMode);
  const progress = useStore((s) => s.progress[mapId]);
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
  const indexRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const entries = useMemo(() => {
    const base = dictionaryEntries(map);
    const seen = new Set(base.map((node) => node.id));
    const visualOnly = map.data.nodes.filter((node) => !seen.has(node.id) && hasNodeVisual(node));
    return [...base, ...visualOnly];
  }, [map]);
  const facet = useMemo(() => sectionFacet(map, entries), [map, entries]);
  const searchIndex = useMemo(() => buildSearchIndex(entries), [entries]);
  const [sortBy, setSortBy] = useState<DictSortMode>("alpha");
  const [query, setQuery] = useState("");
  const [learningOnly, setLearningOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const [mobileDetail, setMobileDetail] = useState(false);

  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1);
    return map.data.domains
      .map((d) => ({ id: d.id, label: d.label, count: counts.get(d.id) ?? 0 }))
      .filter((d) => d.count > 0);
  }, [entries, map]);

  // Full-text filter: the query matches through titles, source refs, and every
  // content field (LaTeX-normalized). `textOnly` marks entries that matched in
  // their body but not their title, so the index can hint why they're listed.
  const { filtered, textOnly } = useMemo(() => {
    const nq = normalizeSearchText(query);
    const textOnly = new Set<string>();
    const items = entries.filter((e) => {
      if (kinds.size > 0 && !kinds.has(e.kind)) return false;
      if (topics.size > 0 && !topics.has(e.domain)) return false;
      if (learningOnly && progress?.[e.id] !== "learning") return false;
      const hit = searchHit(e, nq, searchIndex);
      if (!hit) return false;
      if (nq && hit === "text") textOnly.add(e.id);
      return true;
    });
    items.sort((a, b) => compareEntries(a, b, sortBy, facet));
    return { filtered: items, textOnly };
  }, [entries, facet, kinds, topics, sortBy, query, learningOnly, progress, searchIndex]);

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
  const activeIndex = activeId ? filtered.findIndex((e) => e.id === activeId) : -1;
  const shellActions = useMemo<readonly ShellAction[]>(
    () =>
      activeId
        ? [
            {
              id: "show-in-atlas",
              label: "Show in Atlas",
              icon: ArrowUpRight,
              onSelect: () => {
                select(activeId);
                setMode("explore");
                setSurface("atlas");
              },
            },
          ]
        : [],
    [activeId, select, setMode, setSurface],
  );
  useRegisterShellActions("dictionary", shellActions);

  const openRow = (id: string) => {
    setActiveId(id);
    select(id);
    setMobileDetail(true);
  };

  const step = (delta: number) => {
    if (filtered.length === 0) return;
    const next = filtered[Math.max(0, Math.min(filtered.length - 1, activeIndex + delta))];
    if (next && next.id !== activeId) {
      setActiveId(next.id);
      select(next.id);
    }
  };

  // ↑/↓ walk the index (also from the filter input); Enter opens the entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inSearch = t === searchRef.current;
      if (!inSearch && t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        step(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter" && activeId) {
        if (inSearch) e.preventDefault();
        openRow(activeId);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const jumpToGroup = (groupId: string) => {
    const el = indexRef.current?.querySelector<HTMLElement>(`#${CSS.escape(groupId)}`);
    el?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 top-(--shell-dock-top) bottom-[var(--shell-content-bottom)] grid grid-cols-[minmax(300px,360px)_minmax(0,1fr)] max-[860px]:grid-cols-1">
        {/* ---- Index column ---- */}
        <aside
          className={`relative flex min-h-0 flex-col border-r border-border bg-muted ${mobileDetail ? "max-[860px]:hidden" : ""}`}
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
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter this index…"
                aria-label="Filter this index"
                className="min-h-(--control-h-lg) w-full rounded-md border border-border bg-muted py-1.5 pl-7 pr-2.5 font-sans text-footnote text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card"
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
                      className="inline-flex min-h-(--control-h-xs) max-w-full items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-[3px] text-caption-2 font-medium text-muted-foreground transition hover:border-input"
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
                    className="px-1.5 py-[3px] text-caption-2 text-primary-text hover:underline"
                    onClick={resetTopics}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="mr-0.5 text-caption-2 font-semibold uppercase tracking-label-tight text-muted-foreground">
                Sort
              </span>
              <Chip size="xs" variant="mono" active={sortBy === "alpha"} onClick={() => setSortBy("alpha")}>
                A–Z
              </Chip>
              <Chip size="xs" variant="label" active={sortBy === "section"} onClick={() => setSortBy("section")}>
                {facet.mode === "chapter" ? "Chapter" : "Domain"}
              </Chip>
              <Chip size="xs" variant="label" active={sortBy === "kind"} onClick={() => setSortBy("kind")}>
                Kind
              </Chip>
              <span aria-hidden className="mx-0.5 h-3.5 w-px bg-border" />
              <Chip size="xs" variant="label" active={learningOnly} onClick={() => setLearningOnly((v) => !v)}>
                Learning
              </Chip>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            <div
              className={`panel-scrollbar h-full overflow-y-auto px-2 pb-10 pt-1.5 ${
                sortBy === "alpha" && groups.length > 2 ? "pr-6" : ""
              }`}
              ref={indexRef}
            >
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
                    <h2
                      id={group.id}
                      className="sticky top-0 z-[1] m-0 flex items-baseline gap-1.5 bg-gradient-to-b from-muted from-70% to-transparent px-2.5 pb-1 pt-1.5 font-mono text-caption-2 font-semibold uppercase tracking-label-tight text-muted-foreground [scroll-margin-top:4px]"
                    >
                      {group.label}
                      <span className="text-caption-2 font-medium text-muted-foreground/70">{group.items.length}</span>
                    </h2>
                    {group.items.map((entry) => (
                      <IndexRow
                        key={entry.id}
                        entry={entry}
                        active={entry.id === activeId}
                        status={progress?.[entry.id]}
                        textHit={textOnly.has(entry.id)}
                        onClick={() => openRow(entry.id)}
                      />
                    ))}
                  </section>
                ))
              )}
            </div>

            {/* Alphabet rail — jump to a letter group when sorted A–Z. */}
            {sortBy === "alpha" && groups.length > 2 && (
              <nav
                aria-label="Jump to letter"
                className="absolute inset-y-2 right-0.5 flex flex-col items-center justify-center gap-px overflow-hidden"
              >
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => jumpToGroup(group.id)}
                    className="rounded-sm px-1 font-mono text-caption-2 leading-[1.35] text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {group.label}
                  </button>
                ))}
              </nav>
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
              prev={activeIndex > 0 ? filtered[activeIndex - 1] : null}
              next={activeIndex >= 0 && activeIndex < filtered.length - 1 ? filtered[activeIndex + 1] : null}
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

function ProgressDot({ status }: { status: ProgressStatus }) {
  const known = status === "known";
  return (
    <span
      aria-hidden
      title={known ? "Known" : "Still learning"}
      className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${known ? "bg-success" : ""}`}
      style={known ? undefined : { background: "var(--domain-orange)" }}
    />
  );
}

function IndexRow({
  entry,
  active,
  status,
  textHit,
  onClick,
}: {
  entry: GraphNode;
  active: boolean;
  status?: ProgressStatus;
  textHit?: boolean;
  onClick: () => void;
}) {
  const tone = getDomainTone(entry.domain);
  const icon = kindIcon(entry.kind);
  return (
    <button
      type="button"
      id={`dict-row-${entry.id}`}
      className="relative flex min-h-(--control-h-lg) w-full items-center gap-2 rounded-md border-none bg-transparent py-1.5 pl-3 pr-2.5 text-left [scroll-margin:48px_0] transition-colors hover:bg-accent"
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
      {textHit && (
        <span title="Matches entry text" className="flex flex-shrink-0 items-center">
          <FileText className="h-3 w-3 text-muted-foreground/60" aria-label="Matches entry text" />
        </span>
      )}
      {status && <ProgressDot status={status} />}
      <span className="flex-shrink-0 font-mono text-caption-1 text-muted-foreground">{kindAbbrev(entry.kind)}</span>
    </button>
  );
}

function DetailPane({
  entry,
  map,
  mapId,
  prev,
  next,
  onBack,
  onPickRelated,
}: {
  entry: GraphNode;
  map: AtlasMap;
  mapId: MapId;
  prev: GraphNode | null;
  next: GraphNode | null;
  onBack: () => void;
  onPickRelated: (id: string) => void;
}) {
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const setScoped = useDrill((s) => s.setScoped);
  const view = useConceptView(entry, map, mapId);

  const openInAtlas = () => {
    select(entry.id);
    setSurface("atlas");
  };

  // Prerequisite closure: this entry plus everything its statement depends on.
  const practiceIds = useMemo(
    () => prerequisiteDeck(entry.id, (id) => map.nodeById.get(id)?.statementDependencies),
    [entry, map],
  );

  const practice = () => {
    setScoped({ title: entry.label, ids: practiceIds });
    setSurface("flashcards");
  };

  return (
    <article key={entry.id}>
      <div className="mx-auto max-w-[760px] px-10 pb-24 pt-9 max-[860px]:px-[22px] max-[860px]:pb-20 max-[860px]:pt-6">
        <button
          type="button"
          className="mb-4 hidden items-center gap-1.5 border-none bg-transparent p-0 font-mono text-caption-1 text-primary-text max-[860px]:inline-flex"
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-(--control-h-md) items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-caption-1 text-primary-text transition hover:bg-primary/20"
              onClick={openInAtlas}
            >
              Show in atlas <ArrowUpRight className="h-3 w-3" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex min-h-(--control-h-md) items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-caption-1 text-muted-foreground transition hover:border-input hover:text-foreground"
              onClick={practice}
              title={
                practiceIds.length > 1
                  ? `Drill this entry and its ${practiceIds.length - 1} prerequisites as flashcards`
                  : "Drill this entry as a flashcard"
              }
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              Practice this
              {practiceIds.length > 1 && <span className="opacity-70">+{practiceIds.length - 1} prereqs</span>}
            </button>
          </div>

          {(prev || next) && (
            <nav
              className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-3.5"
              aria-label="Adjacent entries"
            >
              {prev ? (
                <button
                  type="button"
                  onClick={() => onPickRelated(prev.id)}
                  className="group inline-flex min-w-0 items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-footnote text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft
                    className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    <MathText text={prev.label} />
                  </span>
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => onPickRelated(next.id)}
                  className="group inline-flex min-w-0 items-center gap-1.5 rounded-sm py-1 pl-2 text-right text-footnote text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="min-w-0 truncate">
                    <MathText text={next.label} />
                  </span>
                  <ChevronRight
                    className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground"
                    aria-hidden
                  />
                </button>
              )}
            </nav>
          )}
        </footer>
      </div>
    </article>
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
