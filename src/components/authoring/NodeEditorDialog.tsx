import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XIcon, TrashIcon, PlusIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";

import { useStore } from "../../store";
import { MathText } from "../../lib/katex";
import { getDomainTone } from "../../lib/colors";
import { graphDataToSource } from "../../data/toSource";
import { KIND_VALUES } from "../../data/sourceSchema";
import { KIND_LABEL } from "../../types";
import { AUTHORABLE_RELATIONS, RELATIONS, type AuthorableRelation } from "../../data/relations";
import {
  conceptToDraft,
  edgeKey,
  emptyDraft,
  incidentEdges,
  type NodeDraft,
  type Priority,
} from "../../data/authoring";

const PRIORITIES: Priority[] = ["core", "standard", "peripheral"];

/** A single labelled text/area control bound to a draft field. */
function Field({
  label,
  value,
  onChange,
  area,
  mono,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  mono?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const className =
    "w-full rounded-[var(--radius-md)] border bg-[color:var(--surface-2)] px-2.5 py-1.5 text-ui-sm outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]";
  const style = {
    borderColor: "var(--border)",
    color: "var(--fg-1)",
    fontFamily: mono ? "var(--font-mono, monospace)" : undefined,
  } as const;
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>
        {label}
        {hint && <span className="ml-1.5 normal-case tracking-normal" style={{ color: "var(--fg-4)" }}>{hint}</span>}
      </span>
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={className}
          style={style}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          style={style}
        />
      )}
    </label>
  );
}

/** Lightweight filterable picker over the map's nodes (for edge targets). */
function NodePicker({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.id.includes(q)).slice(0, 8);
  }, [options, query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : selected?.label ?? ""}
        placeholder={placeholder ?? "Search concept…"}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-[var(--radius-md)] border bg-[color:var(--surface-2)] px-2.5 py-1.5 text-ui-sm outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
        style={{ borderColor: "var(--border)", color: "var(--fg-1)" }}
      />
      {open && matches.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-md)] border p-1 shadow-[var(--shadow-3)]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {matches.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-ui-sm hover:bg-[color:var(--surface-3)]"
                style={{ color: "var(--fg-1)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: getDomainTone(o.id).color }} aria-hidden />
                <span className="min-w-0 truncate"><MathText text={o.label} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EdgeEditor({ nodeId }: { nodeId: string }) {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const editSource = useStore((s) => s.editSources[mapId]);
  const source = useMemo(
    () => editSource ?? (map ? graphDataToSource(map.data) : null),
    [editSource, map],
  );
  const addNodeEdge = useStore((s) => s.addNodeEdge);
  const removeNodeEdge = useStore((s) => s.removeNodeEdge);

  const [relation, setRelation] = useState<AuthorableRelation>("uses");
  const [other, setOther] = useState("");
  const [outgoing, setOutgoing] = useState(true); // this → other, vs other → this
  const [error, setError] = useState<string | null>(null);

  if (!source || !map) return null;

  const incident = incidentEdges(source, nodeId);
  const nodeLabel = (id: string) => map.nodeById.get(id)?.label ?? id;
  const others = map.data.nodes.filter((n) => n.id !== nodeId).map((n) => ({ id: n.id, label: n.label }));

  const submit = () => {
    if (!other) {
      setError("Pick a concept to link.");
      return;
    }
    const edge = outgoing
      ? { source: nodeId, target: other, relation }
      : { source: other, target: nodeId, relation };
    const result = addNodeEdge(edge);
    if (!result.ok) setError(result.error ?? "Could not add link.");
    else {
      setError(null);
      setOther("");
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>
        Links ({incident.length})
      </div>

      {incident.length > 0 && (
        <ul className="space-y-1">
          {incident.map(({ edge, role }) => {
            const otherId = role === "source" ? edge.target : edge.source;
            const reads = RELATIONS[edge.relation].reads;
            return (
              <li
                key={edgeKey(edge)}
                className="flex items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-1.5 text-ui-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <span className="min-w-0 flex-1 truncate" style={{ color: "var(--fg-2)" }}>
                  {role === "source" ? (
                    <>this <em style={{ color: "var(--fg-3)" }}>{reads}</em> <MathText text={nodeLabel(otherId)} /></>
                  ) : (
                    <><MathText text={nodeLabel(otherId)} /> <em style={{ color: "var(--fg-3)" }}>{reads}</em> this</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeNodeEdge(edgeKey(edge))}
                  aria-label="Remove link"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] hover:bg-[color:var(--surface-3)]"
                  style={{ color: "var(--fg-3)" }}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add link */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-[var(--radius-md)] border border-dashed p-2" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => setOutgoing((o) => !o)}
          title={outgoing ? "this → concept" : "concept → this"}
          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-ui-xs font-medium hover:bg-[color:var(--surface-3)]"
          style={{ color: "var(--fg-2)" }}
        >
          <ArrowsLeftRightIcon className="h-3.5 w-3.5" />
          {outgoing ? "from this" : "to this"}
        </button>
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as AuthorableRelation)}
          className="h-8 rounded-[var(--radius-sm)] border bg-[color:var(--surface-2)] px-2 text-ui-xs outline-none"
          style={{ borderColor: "var(--border)", color: "var(--fg-1)" }}
        >
          {AUTHORABLE_RELATIONS.map((r) => (
            <option key={r} value={r}>{RELATIONS[r].reads}</option>
          ))}
        </select>
        <div className="col-span-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <NodePicker options={others} value={other} onChange={setOther} />
          </div>
          <button
            type="button"
            onClick={submit}
            className="flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-ui-xs font-semibold"
            style={{ background: "var(--accent)", color: "var(--fg-on-color)" }}
          >
            <PlusIcon className="h-3.5 w-3.5" /> Link
          </button>
        </div>
        {error && <p className="col-span-2 text-ui-xs" style={{ color: "var(--danger, #c0392b)" }}>{error}</p>}
      </div>
    </div>
  );
}

export function NodeEditorDialog() {
  const editor = useStore((s) => s.nodeEditor);
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const editSource = useStore((s) => s.editSources[mapId]);
  const source = useMemo(
    () => editSource ?? (map ? graphDataToSource(map.data) : null),
    [editSource, map],
  );
  const commitNode = useStore((s) => s.commitNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const close = useStore((s) => s.closeNodeEditor);
  const editError = useStore((s) => s.editError);
  const reduceMotion = useReducedMotion();

  const editingId = editor?.mode === "edit" ? editor.nodeId : null;
  const concept = editingId && source ? source.concepts.find((c) => c.id === editingId) ?? null : null;

  const [draft, setDraft] = useState<NodeDraft>(() => emptyDraft(map?.data.domains[0]?.id ?? ""));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Reseed the form whenever the editor target changes.
  useEffect(() => {
    if (!editor) return;
    setConfirmDelete(false);
    if (editor.mode === "edit" && concept) setDraft(conceptToDraft(concept));
    else setDraft(emptyDraft(map?.data.domains[0]?.id ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor?.mode, editingId]);

  if (!editor || !map) return null;

  const set = (patch: Partial<NodeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const save = () => commitNode(draft);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && close()}>
      <AnimatePresence>
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="fixed inset-0 z-50 backdrop-blur-[2px]"
              style={{ background: "color-mix(in srgb, var(--bg-deep) 55%, transparent)" }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-lg)] border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-3)" }}
            >
              <header className="flex shrink-0 items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                <Dialog.Title className="font-serif text-node-panel-title" style={{ color: "var(--fg-1)", fontWeight: 600 }}>
                  {editor.mode === "create" ? "New concept" : "Edit concept"}
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  {editor.mode === "create" ? "Create a new concept node." : "Edit this concept and its links."}
                </Dialog.Description>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[color:var(--surface-3)]"
                  style={{ color: "var(--fg-2)" }}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <Field label="Label" value={draft.label} onChange={(v) => set({ label: v })} placeholder="e.g. Banach space" />
                {draft.label.trim() && (
                  <div className="-mt-1 text-ui-sm" style={{ color: "var(--fg-3)" }}>
                    Preview: <MathText text={draft.label} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>Kind</span>
                    <select
                      value={draft.kind}
                      onChange={(e) => set({ kind: e.target.value })}
                      className="w-full rounded-[var(--radius-md)] border bg-[color:var(--surface-2)] px-2.5 py-1.5 text-ui-sm outline-none"
                      style={{ borderColor: "var(--border)", color: "var(--fg-1)" }}
                    >
                      {KIND_VALUES.map((k) => (
                        <option key={k} value={k}>{KIND_LABEL[k]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>Domain</span>
                    <select
                      value={draft.domain}
                      onChange={(e) => set({ domain: e.target.value })}
                      className="w-full rounded-[var(--radius-md)] border bg-[color:var(--surface-2)] px-2.5 py-1.5 text-ui-sm outline-none"
                      style={{ borderColor: "var(--border)", color: "var(--fg-1)" }}
                    >
                      {map.data.domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <span className="mb-1 block font-mono text-ui-2xs uppercase tracking-label" style={{ color: "var(--fg-3)" }}>Priority</span>
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => {
                      const active = draft.priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => set({ priority: p })}
                          className="rounded-[var(--radius-sm)] border px-2.5 py-1 text-ui-xs font-medium capitalize"
                          style={
                            active
                              ? { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent)" }
                              : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-3)" }
                          }
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field label="Statement" value={draft.statement} onChange={(v) => set({ statement: v })} area mono hint="LaTeX" />
                <Field label="Definition" value={draft.definition} onChange={(v) => set({ definition: v })} area mono hint="LaTeX" />
                <Field label="Formal statement" value={draft.formal} onChange={(v) => set({ formal: v })} area mono hint="LaTeX" />
                <Field label="Formula" value={draft.formula} onChange={(v) => set({ formula: v })} area mono hint="LaTeX" />
                <Field label="Intuition" value={draft.intuition} onChange={(v) => set({ intuition: v })} area />
                <Field label="Gloss" value={draft.gloss} onChange={(v) => set({ gloss: v })} area hint="dictionary one-liner" />
                <Field label="Notation" value={draft.notation} onChange={(v) => set({ notation: v })} area mono hint="one per line" />
                <Field label="Assumptions" value={draft.assumptions} onChange={(v) => set({ assumptions: v })} area hint="one per line" />
                <Field label="Tags" value={draft.tags} onChange={(v) => set({ tags: v })} hint="comma-separated" />

                {editor.mode === "edit" && editingId && (
                  <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <EdgeEditor nodeId={editingId} />
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 items-center gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                {editor.mode === "edit" && editingId && (
                  confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-ui-xs" style={{ color: "var(--fg-2)" }}>Delete this concept and its links?</span>
                      <button
                        type="button"
                        onClick={() => deleteNode(editingId)}
                        className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-ui-xs font-semibold text-white"
                        style={{ background: "var(--danger, #c0392b)" }}
                      >
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="text-ui-xs" style={{ color: "var(--fg-3)" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-ui-xs font-medium"
                      style={{ color: "var(--danger, #c0392b)" }}
                    >
                      <TrashIcon className="h-3.5 w-3.5" /> Delete
                    </button>
                  )
                )}
                {editError && <span className="min-w-0 flex-1 truncate text-ui-xs" style={{ color: "var(--danger, #c0392b)" }}>{editError}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={close} className="rounded-[var(--radius-sm)] px-3 py-1.5 text-ui-sm" style={{ color: "var(--fg-2)" }}>
                    {editor.mode === "edit" ? "Done" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    className="rounded-[var(--radius-sm)] px-3.5 py-1.5 text-ui-sm font-semibold"
                    style={{ background: "var(--accent)", color: "var(--fg-on-color)" }}
                  >
                    {editor.mode === "create" ? "Create" : "Save"}
                  </button>
                </div>
              </footer>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </AnimatePresence>
    </Dialog.Root>
  );
}
