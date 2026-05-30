import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { useStore } from "../store";
import { MAPS, type LoadedMap, type MapId } from "../data";
import type { GraphNode } from "../types";
import { MathProse } from "../lib/katex";
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
import "./DictionaryView.css";

export function DictionaryView() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  if (!map) return null;
  return <DictionaryBody map={map} mapId={mapId} />;
}

function DictionaryBody({ map, mapId }: { map: LoadedMap; mapId: MapId }) {
  const select = useStore((s) => s.select);
  // Shared filter state, driven by the TopBar's search palette and Filters popover.
  const kinds = useStore((s) => s.kinds);
  const topics = useStore((s) => s.topics);
  const selectedId = useStore((s) => s.selectedId);
  const meta = MAPS[mapId];
  const listRef = useRef<HTMLElement>(null);

  const entries = useMemo(() => dictionaryEntries(map), [map]);
  const facet = useMemo(() => sectionFacet(map, entries), [map, entries]);
  const [sortBy, setSortBy] = useState<DictSortMode>("alpha");

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
      <div className="dict-wrap">
        <header className="dict-header">
          <div className="dict-headrow">
            <div>
              <p className="dict-kicker">{meta.label} · Dictionary</p>
              <h1 className="dict-title font-serif">{meta.label}</h1>
            </div>
            <div className="dict-sortrow" role="radiogroup" aria-label="Sort entries">
              <span className="dict-count">{filtered.length} entries</span>
              <Chip label="A–Z" active={sortBy === "alpha"} onClick={() => setSortBy("alpha")} />
              <Chip
                label={facet.mode === "chapter" ? "Chapter" : "Domain"}
                active={sortBy === "section"}
                onClick={() => setSortBy("section")}
              />
              <Chip label="Kind" active={sortBy === "kind"} onClick={() => setSortBy("kind")} />
            </div>
          </div>
          <p className="dict-sub">{meta.description}</p>
          {lettersPresent && (
            <nav className="dict-azbar" aria-label="Jump to letter">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) =>
                lettersPresent.has(letter) ? (
                  <a key={letter} href={`#dict-L-${letter}`}>
                    {letter}
                  </a>
                ) : null,
              )}
            </nav>
          )}
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
              <section key={group.id}>
                <h2 className="dict-letter-head" id={group.id}>
                  {group.label}
                </h2>
                {group.items.map((entry) => (
                  <DictionaryCard key={entry.id} entry={entry} map={map} facet={facet} onOpen={select} />
                ))}
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

  const openInAtlas = () => {
    onOpen(entry.id);
    setSurface("atlas");
  };

  return (
    <article className="dict-card" id={`dict-entry-${entry.id}`}>
      <div className="dict-body">
        <h3 className="dict-term font-serif">{entry.title}</h3>
        <div className="dict-tags">
          <span className="dict-tag" style={{ color: tone.color, borderColor: tone.border }}>
            {KIND_LABEL[entry.kind]}
          </span>
          {entry.ref && <span className="dict-tag">{entry.ref}</span>}
          {sectionValue && <span className="dict-tag">{facet.chipLabelOf(sectionValue)}</span>}
          <button type="button" className="dict-open" onClick={openInAtlas}>
            Open in atlas <ArrowUpRight className="h-3 w-3" aria-hidden />
          </button>
        </div>

        {statement && (
          <div className="dict-statement" style={{ borderLeftColor: tone.color }}>
            <span className="dict-lab">Statement</span>
            <MathProse text={statement} asBlock />
          </div>
        )}
        {entry.gloss && (
          <div className="dict-gloss">
            <span className="dict-lab">In words</span>
            <MathProse text={entry.gloss} asBlock />
          </div>
        )}
        {entry.example && (
          <div className="dict-example">
            <span className="dict-lab">Example</span>
            <MathProse text={entry.example} asBlock />
          </div>
        )}
        {related.length > 0 && (
          <div className="dict-related">
            <span className="dict-lab">See also</span>
            {related.map((n, i) => (
              <span key={n.id}>
                {i > 0 && " · "}
                <a href={`#dict-entry-${n.id}`}>
                  <MathProse text={n.title} />
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
      {entry.diagramPath && (
        <div className="dict-dia">
          <img src={entry.diagramPath} alt={`Diagram for ${entry.title}`} loading="lazy" decoding="async" />
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
