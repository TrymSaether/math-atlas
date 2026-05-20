import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight, ArrowDownRight, Tag, BookOpen, Route, Hash, Network, Flag } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useStore } from "../store";
import { MathText, asDisplayMath } from "../lib/katex";
import { cn } from "../lib/utils";
import { KIND_LABEL, RELATION_LABEL, type GraphEdge, type GraphNode } from "../types";
import { Badge, Button, Panel, Section } from "./ui";
import { StateGlyph, LEARNING_STATE_LABEL } from "./StateGlyph";

interface NodePanelProps {
  nodeById: Map<string, GraphNode>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
}

type Tab = "overview" | "notes" | "references";

export function NodePanel({ nodeById, incomingEdgesByNodeId, outgoingEdgesByNodeId }: NodePanelProps) {
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  // Esc closes the overlay without affecting the rail.
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, select]);

  const node = useMemo(() => (id ? nodeById.get(id) ?? null : null), [id, nodeById]);
  const incoming = useMemo(() => (node ? incomingEdgesByNodeId.get(node.id) ?? [] : []), [node, incomingEdgesByNodeId]);
  const outgoing = useMemo(() => (node ? outgoingEdgesByNodeId.get(node.id) ?? [] : []), [node, outgoingEdgesByNodeId]);

  return (
    <AnimatePresence mode="wait">
      {node && (
        <motion.aside
          key={node.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className={cn(`kind-${node.kind}`, "absolute bottom-4 right-4 top-4 z-20 w-[380px] max-w-[40vw]")}
          aria-label={`${KIND_LABEL[node.kind]} details`}
        >
          <Panel className="flex h-full flex-col overflow-hidden">
            <PanelInner node={node} incoming={incoming} outgoing={outgoing} nodeById={nodeById} />
          </Panel>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelInner({
  node,
  incoming,
  outgoing,
  nodeById,
}: {
  node: GraphNode;
  incoming: GraphEdge[];
  outgoing: GraphEdge[];
  nodeById: Map<string, GraphNode>;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const select = useStore((s) => s.select);
  const learningState = useStore((s) => s.learningStates[node.id] ?? "not-started");
  const cycleLearningState = useStore((s) => s.cycleLearningState);

  return (
    <>
      <header className="border-b border-[var(--border-soft)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="kind" className="rounded-md uppercase tracking-[0.14em]">{KIND_LABEL[node.kind]}</Badge>
              {node.topicCluster && <Badge tone="muted">{node.topicCluster}</Badge>}
            </div>
            {node.number && (
              <div className="font-mono text-[12px] font-semibold tabular-nums tracking-[0.02em] text-[var(--muted)]">
                {node.number}
              </div>
            )}
            <h2 className="mt-0.5 font-display text-[26px] leading-[1.12] text-[var(--text)]">
              <MathText text={node.title} />
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => cycleLearningState(node.id)}
              title={`Learning state: ${LEARNING_STATE_LABEL[learningState]} — click to change`}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] transition hover:bg-[var(--surface-muted)]"
            >
              <StateGlyph state={learningState} size={16} />
            </button>
            <Button variant="ghost" size="xs" onClick={() => select(null)} aria-label="Close panel" className="h-8 w-8 px-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <TabBar tab={tab} setTab={setTab} />

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {tab === "overview" && <OverviewTab node={node} />}
        {tab === "notes" && <NotesTab node={node} />}
        {tab === "references" && (
          <ReferencesTab node={node} incoming={incoming} outgoing={outgoing} nodeById={nodeById} />
        )}
      </div>
    </>
  );
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: [Tab, string][] = [
    ["overview", "Overview"],
    ["notes", "Notes"],
    ["references", "References"],
  ];
  return (
    <div className="flex gap-6 border-b border-[var(--border-soft)] px-4">
      {tabs.map(([id, label]) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 py-3 text-[13px] transition",
              active
                ? "border-[var(--primary)] font-semibold text-[var(--primary)]"
                : "border-transparent font-medium text-[var(--muted)] hover:text-[var(--text-soft)]"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function OverviewTab({ node }: { node: GraphNode }) {
  const setRouteFrom = useStore((s) => s.setRouteFrom);
  const setRouteTo = useStore((s) => s.setRouteTo);
  const planRoute = useStore((s) => s.planRoute);
  const setPathTarget = useStore((s) => s.setPathTarget);
  const routeFrom = useStore((s) => s.routeFrom);

  const formalStatement = node.formalStatement?.trim() ?? "";
  const statement = node.originalText?.trim() ?? "";
  const explanation = node.explanation?.trim() ?? "";
  const mathematicalFormula = node.mathematicalFormula?.trim() ?? "";

  return (
    <>
      <Section title={formalStatement ? "Formal statement" : "Statement"} icon={<BookOpen className="h-3 w-3" />}>
        <div className="rounded-[14px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 font-serif text-[14px]">
          <MathText text={formalStatement || statement || "No statement available."} />
        </div>
      </Section>

      {explanation && (
        <Section title="Intuition">
          <p className="rounded-[14px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 text-[14px] leading-relaxed text-[var(--text-soft)]">
            <MathText text={explanation} />
          </p>
        </Section>
      )}

      {mathematicalFormula && (
        <Section title="Notation / formula">
          <div className="overflow-x-auto rounded-[14px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 text-[var(--text-soft)]">
            <MathText text={asDisplayMath(mathematicalFormula)} />
          </div>
        </Section>
      )}

      <Section title="Route" icon={<Route className="h-3 w-3" />}>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setRouteFrom(node.id);
              if (routeFrom && routeFrom !== node.id) planRoute();
            }}
          >
            <Route className="h-3.5 w-3.5" /> Route from here
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              setRouteTo(node.id);
              if (routeFrom && routeFrom !== node.id) planRoute();
            }}
          >
            <Flag className="h-3.5 w-3.5" /> Route to here
          </Button>
        </div>
        <Button variant="quiet" onClick={() => setPathTarget(node.id)} className="mt-2 w-full justify-center">
          <Route className="h-3.5 w-3.5" /> Generate learning path to here
        </Button>
      </Section>
    </>
  );
}

function NotesTab({ node }: { node: GraphNode }) {
  const note = useStore((s) => s.notes[node.id] ?? "");
  const setNote = useStore((s) => s.setNote);

  return (
    <Section title="Personal notes" icon={<BookOpen className="h-3 w-3" />}>
      <textarea
        value={note}
        onChange={(e) => setNote(node.id, e.target.value)}
        placeholder="Write a note for this concept. Notes are saved to this browser, per map."
        className="min-h-[180px] w-full resize-y rounded-[14px] border border-[var(--gold-200)] bg-[var(--gold-50)] p-3 text-[14px] leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--gold)_24%,transparent)]"
      />
      <div className="mt-2 text-[11px] text-[var(--muted)]">{note.trim() ? "Saved to this browser" : "No personal notes yet"}</div>
    </Section>
  );
}

function ReferencesTab({
  node,
  incoming,
  outgoing,
  nodeById,
}: {
  node: GraphNode;
  incoming: GraphEdge[];
  outgoing: GraphEdge[];
  nodeById: Map<string, GraphNode>;
}) {
  return (
    <>
      <EdgeSection
        title="Prerequisites"
        edges={incoming}
        nodeById={nodeById}
        direction="source"
        icon={<ArrowUpRight className="h-3 w-3 rotate-180" />}
        empty="No upstream dependencies in this map."
      />
      <EdgeSection
        title="Consequences"
        edges={outgoing}
        nodeById={nodeById}
        direction="target"
        icon={<ArrowDownRight className="h-3 w-3" />}
        empty="No downstream consequences in this map."
      />
      <Tags tags={node.tags ?? []} />
      <Reference node={node} incomingCount={incoming.length} outgoingCount={outgoing.length} />
    </>
  );
}

function EdgeSection({
  title,
  edges,
  nodeById,
  direction,
  icon,
  empty,
}: {
  title: string;
  edges: GraphEdge[];
  nodeById: Map<string, GraphNode>;
  direction: "source" | "target";
  icon: ReactNode;
  empty: string;
}) {
  const select = useStore((s) => s.select);

  return (
    <Section title={title} icon={icon}>
      {edges.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 text-[12px] text-[var(--muted)]">{empty}</div>
      ) : (
        <ul className="space-y-1.5">
          {edges.map((edge) => {
            const other = nodeById.get(direction === "source" ? edge.from : edge.to);
            if (!other) return null;
            return (
              <li key={edge.id}>
                <button
                  type="button"
                  onClick={() => select(other.id)}
                  className={cn(`kind-${other.kind}`, "group flex w-full items-center justify-between gap-2 rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-left transition hover:border-[rgba(var(--c),0.4)] hover:bg-[var(--surface-hover)]")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[rgba(var(--c),1)]" />
                    <span className="shrink-0 text-[11px] text-[var(--muted)]">{RELATION_LABEL[edge.relation]}</span>
                    <span className="truncate text-[12px] text-[var(--text-soft)]"><MathText text={other.title} /></span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--faint)] transition group-hover:text-[var(--text-soft)]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <Section title="Tags" icon={<Tag className="h-3 w-3" />}>
      {tags.length === 0 ? (
        <div className="text-[12px] text-[var(--muted)]">None</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} tone="muted">{tag}</Badge>
          ))}
        </div>
      )}
    </Section>
  );
}

function Reference({ node, incomingCount, outgoingCount }: { node: GraphNode; incomingCount: number; outgoingCount: number }) {
  return (
    <Section title="Reference" icon={<Hash className="h-3 w-3" />}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-[14px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 text-[11px]">
        <dt className="text-[var(--muted)]">Group</dt>
        <dd className="min-w-0 truncate text-[var(--text-soft)]">{node.topicCluster}</dd>
        <dt className="text-[var(--muted)]">Kind</dt>
        <dd className="min-w-0 truncate text-[var(--text-soft)]">{KIND_LABEL[node.kind]}</dd>
        <dt className="text-[var(--muted)]">Links</dt>
        <dd className="min-w-0 text-[var(--text-soft)]"><Network className="mr-1 inline h-3 w-3" />{incomingCount} in · {outgoingCount} out</dd>
        <dt className="text-[var(--muted)]">ID</dt>
        <dd className="min-w-0 truncate font-mono text-[var(--muted)]">{node.id}</dd>
      </dl>
    </Section>
  );
}
