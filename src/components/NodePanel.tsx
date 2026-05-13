import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight, ArrowDownRight, Tag, BookOpen, Route, Hash, Network, MousePointer2 } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { useStore } from "../store";
import { MathText, asDisplayMath } from "../lib/katex";
import { cn } from "../lib/utils";
import { KIND_LABEL, RELATION_LABEL, type GraphEdge, type GraphNode } from "../types";
import { Badge, Button, EmptyState, Panel, Section } from "./ui";

interface NodePanelProps {
  nodeById: Map<string, GraphNode>;
  incomingEdgesByNodeId: Map<string, GraphEdge[]>;
  outgoingEdgesByNodeId: Map<string, GraphEdge[]>;
}

export function NodePanel({ nodeById, incomingEdgesByNodeId, outgoingEdgesByNodeId }: NodePanelProps) {
  const id = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const setPathTarget = useStore((s) => s.setPathTarget);

  const node = useMemo(() => (id ? nodeById.get(id) ?? null : null), [id, nodeById]);
  const incoming = useMemo(() => (node ? incomingEdgesByNodeId.get(node.id) ?? [] : []), [node, incomingEdgesByNodeId]);
  const outgoing = useMemo(() => (node ? outgoingEdgesByNodeId.get(node.id) ?? [] : []), [node, outgoingEdgesByNodeId]);

  return (
    <AnimatePresence mode="wait">
      {!node ? (
        <motion.aside
          key="empty-node-panel"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.22 }}
          className="absolute bottom-4 right-4 top-4 z-20 w-[380px] max-w-[40vw]"
        >
          <Panel className="flex h-full items-center justify-center p-5">
            <EmptyState
              icon={<MousePointer2 className="h-4 w-4" />}
              title="Select a concept"
              description="Click a node to read its statement, intuition, prerequisites, and consequences."
              className="border-white/8 bg-transparent"
            />
          </Panel>
        </motion.aside>
      ) : (
        <motion.aside
          key={node.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
          className={cn(`kind-${node.kind}`, "absolute bottom-4 right-4 top-4 z-20 w-[420px] max-w-[44vw]")}
          aria-label={`${KIND_LABEL[node.kind]} details`}
        >
          <Panel className="flex h-full flex-col overflow-hidden shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--c),0.7)] to-transparent" />
            <header className="border-b border-white/8 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="kind" className="rounded-md uppercase tracking-[0.14em]">{KIND_LABEL[node.kind]}</Badge>
                    {node.topicCluster && <Badge tone="muted">{node.topicCluster}</Badge>}
                    {node.number && <Badge tone="muted">#{node.number}</Badge>}
                  </div>
                  <h2 className="font-display text-xl font-semibold leading-tight text-white/94">
                    <MathText text={node.title} />
                  </h2>
                </div>

                <Button variant="ghost" size="xs" onClick={() => select(null)} aria-label="Close panel" className="h-8 w-8 px-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <ConceptBody node={node} />

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
            </div>

            <footer className="border-t border-white/8 p-3">
              <Button variant="primary" onClick={() => setPathTarget(node.id)} className="w-full">
                <Route className="h-3.5 w-3.5" />
                Generate learning path to here
              </Button>
            </footer>
          </Panel>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ConceptBody({ node }: { node: GraphNode }) {
  const formalStatement = node.formalStatement?.trim() ?? "";
  const statement = node.originalText?.trim() ?? "";
  const explanation = node.explanation?.trim() ?? "";
  const mathematicalFormula = node.mathematicalFormula?.trim() ?? "";

  return (
    <>
      <Section title={formalStatement ? "Formal statement" : "Statement"} icon={<BookOpen className="h-3 w-3" />}>
        <div className="rounded-2xl border border-white/8 bg-black/16 p-3 font-serif text-[13px] leading-relaxed text-white/82">
          <MathText text={formalStatement || statement || "No statement available."} />
        </div>
      </Section>

      {explanation && (
        <Section title="Intuition">
          <p className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-[13px] leading-relaxed text-white/70"><MathText text={explanation} /></p>
        </Section>
      )}

      {mathematicalFormula && (
        <Section title="Notation / formula">
          <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-white/78">
            <MathText text={asDisplayMath(mathematicalFormula)} />
          </div>
        </Section>
      )}
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
        <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] p-3 text-[12px] text-white/38">{empty}</div>
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
                  className={cn(`kind-${other.kind}`, "group flex w-full items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition hover:border-[rgba(var(--c),0.30)] hover:bg-white/[0.055]")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[rgba(var(--c),1)]" />
                    <span className="shrink-0 text-[11px] text-white/38">{RELATION_LABEL[edge.relation]}</span>
                    <span className="truncate text-[12px] text-white/82"><MathText text={other.title} /></span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition group-hover:text-white/75" />
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
      {tags.length === 0 ? <div className="text-[12px] text-white/38">None</div> : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
        </div>
      )}
    </Section>
  );
}

function Reference({ node, incomingCount, outgoingCount }: { node: GraphNode; incomingCount: number; outgoingCount: number }) {
  return (
    <Section title="Reference" icon={<Hash className="h-3 w-3" />}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-[11px]">
        <dt className="text-white/38">Group</dt>
        <dd className="min-w-0 truncate text-white/68">{node.topicCluster}</dd>
        <dt className="text-white/38">Kind</dt>
        <dd className="min-w-0 truncate text-white/68">{KIND_LABEL[node.kind]}</dd>
        <dt className="text-white/38">Links</dt>
        <dd className="min-w-0 text-white/68"><Network className="mr-1 inline h-3 w-3" />{incomingCount} in · {outgoingCount} out</dd>
        <dt className="text-white/38">ID</dt>
        <dd className="min-w-0 truncate font-mono text-white/50">{node.id}</dd>
      </dl>
    </Section>
  );
}
