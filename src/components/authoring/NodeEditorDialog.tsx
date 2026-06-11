import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XIcon, TrashIcon, PlusIcon, ArrowsLeftRightIcon, CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

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

function FieldLabel({ label, hint }: { label?: string; hint?: string }) {
  if (!label) return null;
  return (
    <span className="authoring-label">
      {label}
      {hint && <span className="authoring-hint">{hint}</span>}
    </span>
  );
}

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
  return (
    <label className="authoring-field">
      <FieldLabel label={label} hint={hint} />
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={mono ? "authoring-control authoring-control-mono" : "authoring-control"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={mono ? "authoring-control authoring-control-mono" : "authoring-control"}
        />
      )}
    </label>
  );
}

type SelectOption = {
  value: string;
  label?: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  compact,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="authoring-field" ref={ref}>
      <FieldLabel label={label} />
      <div className="relative">
        <button
          type="button"
          className={compact ? "authoring-control authoring-select-trigger authoring-select-trigger-compact" : "authoring-control authoring-select-trigger"}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate">{selected?.label ?? value}</span>
          <CaretDownIcon className="h-4 w-4 shrink-0 text-fg-2" />
        </button>
        {open && (
          <div className="authoring-select-popover" role="listbox">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? "authoring-select-option is-active" : "authoring-select-option"}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active && <CheckIcon className="h-4 w-4 shrink-0" weight="bold" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
        className="authoring-control"
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
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-ui-sm text-fg-1 hover:bg-[color:var(--surface-3)]"
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
      <FieldLabel label={`Links (${incident.length})`} />

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
        <SelectField
          label=""
          value={relation}
          onChange={(next) => setRelation(next as AuthorableRelation)}
          compact
          options={AUTHORABLE_RELATIONS.map((r) => ({ value: r, label: RELATIONS[r].reads }))}
        />
        <div className="col-span-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <NodePicker options={others} value={other} onChange={setOther} />
          </div>
          <button
            type="button"
            onClick={submit}
            className="authoring-action authoring-action-primary h-8 rounded-[var(--radius-sm)] px-2.5 text-ui-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Link
          </button>
        </div>
        {error && <p className="col-span-2 text-ui-xs" style={{ color: "var(--danger)" }}>{error}</p>}
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
              initial={reduceMotion ? { opacity: 0, x: "-50%", y: "-50%" } : { opacity: 0, x: "-50%", y: "calc(-50% + 8px)", scale: 0.99 }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={reduceMotion ? { opacity: 0, x: "-50%", y: "-50%" } : { opacity: 0, x: "-50%", y: "calc(-50% + 8px)", scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(760px,calc(100vh-32px))] w-[min(700px,calc(100vw-32px))] flex-col overflow-hidden rounded-[var(--radius-xl)] border"
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
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] hover:bg-[color:var(--surface-3)]"
                  style={{ color: "var(--fg-2)" }}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
                <Field label="Label" value={draft.label} onChange={(v) => set({ label: v })} placeholder="e.g. Banach space" />
                {draft.label.trim() && (
                  <div className="-mt-1 text-ui-xs font-medium text-fg-3">
                    Preview <span className="text-fg-2"><MathText text={draft.label} /></span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Kind"
                    value={draft.kind}
                    onChange={(kind) => set({ kind })}
                    options={KIND_VALUES.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                  />
                  <SelectField
                    label="Domain"
                    value={draft.domain}
                    onChange={(domain) => set({ domain })}
                    options={map.data.domains.map((d) => ({ value: d.id, label: d.label }))}
                  />
                </div>

                <div>
                  <FieldLabel label="Priority" />
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => {
                      const active = draft.priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => set({ priority: p })}
                          className={active ? "authoring-chip is-active" : "authoring-chip"}
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
                        className="authoring-action rounded-[var(--radius-sm)] px-2.5 py-1.5 text-ui-xs"
                        style={{ background: "var(--danger)", color: "var(--fg-on-color)" }}
                      >
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="authoring-action rounded-[var(--radius-sm)] px-2 py-1.5 text-ui-xs text-fg-3">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="authoring-action authoring-action-danger rounded-[var(--radius-sm)] px-2.5 py-1.5 text-ui-xs"
                    >
                      <TrashIcon className="h-3.5 w-3.5" /> Delete
                    </button>
                  )
                )}
                {editError && <span className="min-w-0 flex-1 truncate text-ui-xs" style={{ color: "var(--danger)" }}>{editError}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={close} className="authoring-action rounded-[var(--radius-sm)] px-3 py-1.5 text-ui-sm text-fg-2">
                    {editor.mode === "edit" ? "Done" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    className="authoring-action authoring-action-primary rounded-[var(--radius-sm)] px-3.5 py-1.5 text-ui-sm"
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
