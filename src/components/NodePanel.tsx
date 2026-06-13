import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  XIcon,
  CaretUpIcon,
  CaretDownIcon,
  BookOpenTextIcon,
  CardsIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";

import { useStore } from "../store";
import type { LoadedMap, MapId } from "../data";
import { KIND_LABEL, type GraphNode } from "../types";
import { useConceptView } from "../lib/conceptView";
import { Steps, Collapsible } from "./Specimen";
import { ConceptHeader, ConceptBody, ConceptRelations } from "./concept";
import { NodeEditorPanel } from "./authoring/NodeEditorPanel";

const USED_BY_INITIAL = 8;

type TabId = "overview" | "proof" | "links" | "source";

export function NodePanel() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const editMode = useStore((s) => s.editMode);
  const nodeEditor = useStore((s) => s.nodeEditor);
  const closeNodeEditor = useStore((s) => s.closeNodeEditor);
  const reduceMotion = useReducedMotion();

  const node = id && map ? (map.nodeById.get(id) ?? null) : null;
  // The side sheet hosts three things: a new-concept form, an inline editor for
  // the selected node (edit mode), or the read-only reader.
  const creating = nodeEditor?.mode === "create";
  const editing = editMode && node !== null;
  const open = creating || node !== null;
  const key = creating ? "__create__" : node ? node.id : "__none__";

  const closeCreate = () => {
    closeNodeEditor();
    select(null);
  };

  return (
    <AnimatePresence>
      {open && map && (
        <motion.aside
          key={key}
          initial={reduceMotion ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
          transition={{
            duration: reduceMotion ? 0 : 0.22,
            ease: [0.2, 0.7, 0.2, 1],
          }}
          className="pointer-events-auto absolute left-3 right-3 top-[72px] bottom-3 z-20 flex flex-col overflow-hidden rounded-[var(--radius-xl)] border sm:left-4 sm:top-[76px] sm:right-auto sm:w-[min(560px,calc(100vw-32px))]"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-3)",
          }}
        >
          {creating ? (
            <NodeEditorPanel editingId={null} map={map} mapId={mapId} onClose={closeCreate} />
          ) : editing && node ? (
            <NodeEditorPanel
              editingId={node.id}
              map={map}
              mapId={mapId}
              onClose={() => select(null)}
            />
          ) : node ? (
            <PanelContent node={node} map={map} mapId={mapId} onClose={() => select(null)} />
          ) : null}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelContent({
  node,
  map,
  mapId,
  onClose,
}: {
  node: GraphNode;
  map: LoadedMap;
  mapId: MapId;
  onClose: () => void;
}) {
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const toggleEditMode = useStore((s) => s.toggleEditMode);
  const view = useConceptView(node, map, mapId);
  const [tab, setTab] = useState<TabId>("overview");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ordered domain peers drive the prev/next pager in the header.
  const peers = useMemo(
    () => map.data.nodes.filter((n) => n.domain === node.domain),
    [map, node.domain],
  );
  const peerIdx = peers.findIndex((n) => n.id === node.id);
  const prev = peerIdx > 0 ? peers[peerIdx - 1] : null;
  const next =
    peerIdx >= 0 && peerIdx < peers.length - 1 ? peers[peerIdx + 1] : null;

  const hasProof = view.proof.hasProof;
  const linkCount = view.relations.count;
  // The overview body shows prose/visual only; relations live in the Links tab.
  const bodyEmpty = !(
    view.statement ||
    view.formalStatement ||
    view.definition ||
    view.formula ||
    view.intuition ||
    view.gloss ||
    view.example ||
    view.assumptions.length ||
    view.notation.length
  );

  // Tabs are content-driven: a tab only appears when it has something to show.
  const tabs = useMemo(() => {
    const t: { id: TabId; label: string; badge?: number }[] = [
      { id: "overview", label: "Overview" },
    ];
    if (hasProof) t.push({ id: "proof", label: view.proof.label });
    if (linkCount > 0)
      t.push({ id: "links", label: "Links", badge: linkCount });
    t.push({ id: "source", label: "Source" });
    return t;
  }, [hasProof, view.proof.label, linkCount]);

  const activeTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  useEffect(() => {
    setTab("overview");
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
  };

  return (
    <>
      {/* Sticky header */}
      <header
        className="relative shrink-0 px-5 pt-3.5"
        style={{ background: "var(--surface)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <IconButton
              label="Previous in domain"
              disabled={!prev}
              onClick={() => prev && select(prev.id)}
            >
              <CaretUpIcon className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Next in domain"
              disabled={!next}
              onClick={() => next && select(next.id)}
            >
              <CaretDownIcon className="h-4 w-4" />
            </IconButton>
            {peerIdx >= 0 && (
              <span
                className="ml-1.5 font-mono text-ui-meta"
                style={{ color: "var(--fg-3)" }}
              >
                {peerIdx + 1}/{peers.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton label="Edit concept" onClick={toggleEditMode}>
              <PencilSimpleIcon className="h-4 w-4" />
            </IconButton>
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

        <ConceptHeader view={view} />

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
                className="relative flex items-center gap-1.5 rounded-t-[var(--radius-sm)] px-3 pb-2 pt-1.5 font-mono text-ui-xs transition-colors focus:outline-none"
                style={{ color: active ? "var(--fg-1)" : "var(--fg-3)" }}
              >
                {t.label}
                {t.badge != null && (
                  <span
                    className="rounded-[var(--radius-xs)] px-1.5 py-px text-ui-2xs leading-none"
                    style={{
                      background: active ? view.tone.tint : "var(--surface-3)",
                      color: active ? view.tone.text : "var(--fg-3)",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="panel-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                    style={{ background: view.tone.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div
          className="-mx-5 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        />
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
      >
        {activeTab === "overview" &&
          (bodyEmpty ? (
            <p className="text-ui-sm italic" style={{ color: "var(--fg-3)" }}>
              No written content recorded for this concept yet.
            </p>
          ) : (
            <ConceptBody view={view} map={map} density="panel" onSelect={select} />
          ))}

        {activeTab === "proof" && (
          <section id="sec-proof">
            <Collapsible toneColor={view.tone.color} defaultOpen>
              <Steps
                steps={view.proof.steps}
                toneColor={view.tone.color}
                map={map}
                onSelect={select}
              />
            </Collapsible>
          </section>
        )}

        {activeTab === "links" && (
          <ConceptRelations
            relations={view.relations}
            map={map}
            onSelect={select}
            includeSeeAlso
            initialPerGroup={USED_BY_INITIAL}
          />
        )}

        {activeTab === "source" && (
          <section id="sec-metadata">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-ui-xs">
              <dt style={{ color: "var(--fg-3)" }}>Tags</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.tags.length > 0
                  ? node.tags.join(", ")
                  : "No tags recorded."}
              </dd>
              <dt style={{ color: "var(--fg-3)" }}>Domain</dt>
              <dd style={{ color: "var(--fg-2)" }}>{view.domainLabel}</dd>
              <dt style={{ color: "var(--fg-3)" }}>Kind</dt>
              <dd style={{ color: "var(--fg-2)" }}>{view.kindLabel}</dd>
              <dt style={{ color: "var(--fg-3)" }}>Map position</dt>
              <dd style={{ color: "var(--fg-2)" }}>
                {node.topicCluster} · {node.priority || "unranked"} · #
                {node.number}
              </dd>
              {view.compactRef && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Reference</dt>
                  <dd style={{ color: "var(--fg-2)" }}>{view.compactRef}</dd>
                </>
              )}
              {view.sourceCitation && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Citation</dt>
                  <dd style={{ color: "var(--fg-2)" }}>{view.sourceCitation}</dd>
                </>
              )}
              {(node.source?.references ?? []).length > 0 && (
                <>
                  <dt style={{ color: "var(--fg-3)" }}>Textbook</dt>
                  <dd
                    className="flex flex-wrap gap-1"
                    style={{ color: "var(--fg-2)" }}
                  >
                    {(node.source?.references ?? []).map((r) => (
                      <span
                        key={r}
                        className="rounded font-mono text-ui-2xs"
                        style={{
                          background: "var(--surface-3)",
                          color: "var(--fg-3)",
                          padding: "1px 5px",
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </dd>
                </>
              )}
              <dt style={{ color: "var(--fg-3)" }}>ID</dt>
              <dd
                className="truncate font-mono text-ui-hint"
                style={{ color: "var(--fg-2)" }}
                title={node.id}
              >
                {node.id}
              </dd>
            </dl>
          </section>
        )}
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
      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[color:var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
      style={{ color: "var(--fg-2)" }}
    >
      {children}
    </button>
  );
}
