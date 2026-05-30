import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { useStore } from "../store";
import { MAPS, type LoadedMap, type MapId } from "../data";
import type { GraphNode } from "../types";
import { MathText, MathProse } from "../lib/katex";
import { KIND_LABEL } from "../types";
import { getDomainTone } from "../lib/colors";
import {
  KIND_ORDER,
  dictionaryEntries,
  entryStatement,
  sectionFacet,
  type DictSortMode,
  type SectionFacet,
} from "../lib/dictionary";
import { Spine, Facet, specimenMeta } from "./Specimen";
import { ThemedDiagram } from "./ThemedDiagram";
import "./DictionaryView.css";

export function DictionaryView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <DictionaryBody map={map} mapId={mapId} />;
}

function DictionaryBody({ map, mapId }: { map: LoadedMap; mapId: MapId }) {
  const select = useStore((s) => s.select);
  // Shared filter state, driven by the TopBar's search palette and the header facets.
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const selectedId = useStore((s) => s.selectedId);
  const meta = MAPS[mapId];
  const listRef = useRef<HTMLElement>(null);

  const entries = useMemo(() => dictionaryEntries(map), [map]);
  const facet = useMemo(() => sectionFacet(map, entries), [map, entries]);
  const [sortBy, setSortBy] = useState<DictSortMode>("alpha");

  // Domain facet counts power the header rail.
  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.domainId, (counts.get(e.domainId) ?? 0) + 1);
    return map.data.domains
      .map((d) => ({ id: d.id, label: d.label, count: counts.get(d.id) ?? 0 }))
      .filter((d) => d.count > 0);
  }, [entries, map]);

  const filtered = useMemo(() => {
    const items = entries.filter((e) => {
      if (kinds.size > 0 && !kinds.has(e.kind)) return false;
      if (topics.size > 0 && !topics.has(e.domainId)) return false;
      return true;
    });
    return items.sort((a, b) => compareEntries(a, b, sortBy, facet));
  }, [entries, facet, kinds, topics, sortBy]);

  const groups = useMemo(() => groupEntries(filtered, sortBy, facet), [filtered, sortBy, facet]);
  const lettersPresent = useMemo(
    () => (sortBy === "alpha" ? new Set(filtered.map((e) => e.title[0]?.toUpperCase()).filter(Boolean)) : null),
    [filtered, sortBy],
  );

  // The shared ⌘K palette selects a concept by id; reveal it here in the list.
  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current?.querySelector<HTMLElement>(`#dict-entry-${CSS.escape(selectedId)}`);
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    el.classList.remove("dict-flash");
    void el.offsetWidth;
    el.classList.add("dict-flash");
  }, [selectedId, filtered]);

  return (
    <div className="dictionary-view" style={{ background: "var(--bg)", color: "var(--fg-1)" }}>
      {lettersPresent && lettersPresent.size > 1 && (
        <nav className="dict-azrail" aria-label="Jump to letter">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) =>
            lettersPresent.has(letter) ? (
              <a key={letter} href={`#dict-L-${letter}`}>
                {letter}
              </a>
            ) : (
              <span key={letter} aria-hidden>
                {letter}
              </span>
            ),
          )}
        </nav>
      )}

      <div className="dict-wrap">
        <header className="dict-header">
          <p className="dict-kicker">{meta.label} · Dictionary</p>
          <div className="dict-headrow">
            <h1 className="dict-title font-serif">{meta.label}</h1>
            <span className="dict-count">{filtered.length} of {entries.length} entries</span>
          </div>
          <p className="dict-sub">{meta.description}</p>

          {domainCounts.length > 1 && (
            <div className="dict-facets" role="group" aria-label="Filter by domain">
              {domainCounts.map((d) => {
                const tone = getDomainTone(d.id);
                const active = topics.size === 0 || topics.has(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="dict-facet"
                    aria-pressed={topics.has(d.id)}
                    onClick={() => toggleTopic(d.id)}
                    style={
                      active
                        ? { background: tone.tint, borderColor: tone.border, color: tone.color }
                        : undefined
                    }
                  >
                    <span className="dict-facet-dot" style={{ background: active ? tone.color : "var(--fg-4)" }} />
                    {d.label}
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

        <main className="dict-list" ref={listRef}>
          {entries.length === 0 ? (
            <p className="dict-empty">
              No dictionary entries for {meta.label} yet. Entries appear here once nodes carry a gloss or diagram.
            </p>
          ) : groups.length === 0 ? (
            <p className="dict-empty">No entries match the current filters.</p>
          ) : (
            groups.map((group) => (
              <section key={group.id} className="dict-group">
                <h2 className="dict-letter-head" id={group.id}>
                  {group.label}
                  <span className="dict-letter-n">{group.items.length}</span>
                </h2>
                <div className="dict-cards">
                  {group.items.map((entry) => (
                    <DictionaryCard key={entry.id} entry={entry} map={map} facet={facet} onOpen={select} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function DictionaryCard({
  entry,
  map,
  facet,
  onOpen,
}: {
  entry: GraphNode;
  map: LoadedMap;
  facet: SectionFacet;
  onOpen: (id: string) => void;
}) {
  const setSurface = useStore((s) => s.setSurface);
  const tone = getDomainTone(entry.domainId);
  const statement = entryStatement(entry);
  const related = entry.related
    .map((id) => map.nodeById.get(id))
    .filter((n): n is GraphNode => Boolean(n));
  const sectionValue = facet.valueOf(entry);

  // Content-driven density: an entry with only a short gloss becomes a compact
  // card, giving the page rhythm instead of 100+ identical blocks.
  const compact = !entry.diagramPath && !statement && !entry.example;

  const openInAtlas = () => {
    onOpen(entry.id);
    setSurface("atlas");
  };

  if (compact) {
    return (
      <article className={`dict-card dict-card--compact`} id={`dict-entry-${entry.id}`}>
        <span className="dict-card-rail" style={{ background: tone.color }} aria-hidden />
        <div className="dict-cardhead">
          <h3 className="dict-term font-serif">
            <MathText text={entry.title} />
          </h3>
          <span className="dict-ref" style={{ color: tone.color }}>{specimenMeta(entry)}</span>
        </div>
        {entry.gloss && (
          <div className="dict-compact-gloss">
            <MathProse text={entry.gloss} asBlock />
          </div>
        )}
        <button type="button" className="dict-open" onClick={openInAtlas}>
          Open <ArrowUpRight className="h-3 w-3" aria-hidden />
        </button>
      </article>
    );
  }

  return (
    <article
      className={`dict-card${entry.diagramPath ? " dict-card--media" : ""}`}
      id={`dict-entry-${entry.id}`}
    >
      <span className="dict-card-rail" style={{ background: tone.color }} aria-hidden />
      <div className="dict-cardmain">
        <div className="dict-cardhead">
          <h3 className="dict-term font-serif">
            <MathText text={entry.title} />
          </h3>
          <span className="dict-ref" style={{ color: tone.color }}>{specimenMeta(entry)}</span>
        </div>

        {statement && (
          <Spine tone={tone} kind={entry.kind} label="Statement" size="dict">
            <MathProse text={statement} asBlock />
          </Spine>
        )}
        {entry.gloss && (
          <Facet label="In words">
            <MathProse text={entry.gloss} asBlock />
          </Facet>
        )}
        {entry.example && (
          <Facet label="Example" muted>
            <MathProse text={entry.example} asBlock />
          </Facet>
        )}

        <div className="dict-cardfoot">
          {related.length > 0 && (
            <div className="dict-related">
              <span className="dict-related-lab">See also</span>
              {related.map((n, i) => (
                <span key={n.id}>
                  {i > 0 && <span className="dict-related-sep">·</span>}
                  <a href={`#dict-entry-${n.id}`} style={{ color: tone.color }}>
                    <MathProse text={n.title} />
                  </a>
                </span>
              ))}
            </div>
          )}
          <button type="button" className="dict-open" onClick={openInAtlas}>
            Open <ArrowUpRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      {entry.diagramPath && (
        <div className="dict-dia">
          <ThemedDiagram src={entry.diagramPath} alt={`Diagram for ${entry.title}`} />
        </div>
      )}
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

function compareEntries(a: GraphNode, b: GraphNode, sortBy: DictSortMode, facet: SectionFacet): number {
  const alpha = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  if (sortBy === "section") {
    const order = facet.values;
    return order.indexOf(facet.valueOf(a)) - order.indexOf(facet.valueOf(b)) || alpha;
  }
  if (sortBy === "kind") {
    return (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99) || alpha;
  }
  return alpha;
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
      const letter = entry.title[0]?.toUpperCase() || "#";
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
