/**
 * Inline concept editor that lives inside the NodePanel side sheet (replacing
 * the old centered modal). Same glass aesthetic as the rest of the map chrome;
 * reuses the entire authoring engine — store actions and the pure draft helpers
 * in `src/data/authoring.ts` — so nothing about validation or persistence
 * changes, only the host surface.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  XIcon,
  TrashIcon,
  PlusIcon,
  ArrowsLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CaretDownIcon,
  CheckIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";

import { useStore } from "../../store";
import type { LoadedMap, MapId } from "../../data";
import { MathText } from "../../lib/katex";
import { getDomainTone } from "../../lib/colors";
import { DomainGlyph, getDomainGlyphId } from "../DomainGlyph";
import { graphDataToSource } from "../../data/toSource";
import { KIND_VALUES } from "../../data/sourceSchema";
import { KIND_LABEL } from "../../types";
import { AUTHORABLE_RELATIONS, RELATIONS, type AuthorableRelation } from "../../data/relations";
import {
  conceptToDraft,
  edgeKey,
  emptyDraft,
  emptyExample,
  emptyProofStep,
  incidentEdges,
  type ExampleDraft,
  type NodeDraft,
  type Priority,
  type ProofStepDraft,
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

function Field({
  label,
  value,
  onChange,
  area,
  mono,
  placeholder,
  hint,
  preview,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  mono?: boolean;
  placeholder?: string;
  hint?: string;
  /** Render a live KaTeX preview of the value beneath the control. */
  preview?: boolean;
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
      {preview && value.trim() && (
        <span className="mt-1 block text-ui-xs text-fg-2">
          <MathText text={value} />
        </span>
      )}
    </label>
  );
}

type SelectOption = { value: string; label?: string };

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
          className={
            compact
              ? "authoring-control authoring-select-trigger authoring-select-trigger-compact"
              : "authoring-control authoring-select-trigger"
          }
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
                  className={
                    active ? "authoring-select-option is-active" : "authoring-select-option"
                  }
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
        value={open ? query : (selected?.label ?? "")}
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
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border p-1 shadow-(--shadow-3)"
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
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-ui-sm hover:bg-(--surface-3)"
                style={{ color: "var(--fg-1)" }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: getDomainTone(o.id).color }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">
                  <MathText text={o.label} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One incident link row: prose reading + author notes, with inline edit/remove. */
function EdgeRow({
  edge,
  role,
  otherLabel,
  onUpdate,
  onRemove,
}: {
  edge: { source: string; target: string; relation: AuthorableRelation; notes?: string };
  role: "source" | "target";
  otherLabel: string;
  onUpdate: (patch: { relation?: AuthorableRelation; notes?: string }) => string | null;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [relation, setRelation] = useState<AuthorableRelation>(edge.relation);
  const [notes, setNotes] = useState(edge.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const reads = RELATIONS[edge.relation].reads;

  const open = () => {
    setRelation(edge.relation);
    setNotes(edge.notes ?? "");
    setError(null);
    setEditing(true);
  };
  const save = () => {
    const err = onUpdate({ relation, notes });
    if (err) setError(err);
    else setEditing(false);
  };

  return (
    <li
      className="rounded-md border px-2.5 py-1.5 text-ui-sm"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate" style={{ color: "var(--fg-2)" }}>
          {role === "source" ? (
            <>
              this <em style={{ color: "var(--fg-3)" }}>{reads}</em>{" "}
              <MathText text={otherLabel} />
            </>
          ) : (
            <>
              <MathText text={otherLabel} /> <em style={{ color: "var(--fg-3)" }}>{reads}</em> this
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => (editing ? setEditing(false) : open())}
          aria-label={editing ? "Close edit" : "Edit link"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3)"
          style={{ color: editing ? "var(--accent)" : "var(--fg-3)" }}
        >
          <PencilSimpleIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove link"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3)"
          style={{ color: "var(--fg-3)" }}
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {!editing && edge.notes && (
        <p className="mt-1 text-ui-xs italic" style={{ color: "var(--fg-3)" }}>
          {edge.notes}
        </p>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <SelectField
            label=""
            value={relation}
            onChange={(next) => setRelation(next as AuthorableRelation)}
            compact
            options={AUTHORABLE_RELATIONS.map((r) => ({ value: r, label: RELATIONS[r].reads }))}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Author notes (optional) — rationale, not surfaced in the public map"
            rows={2}
            className="authoring-control"
          />
          {error && (
            <p className="text-ui-xs" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="authoring-action rounded-sm px-2 py-1 text-ui-xs text-fg-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="authoring-action authoring-action-primary rounded-sm px-2.5 py-1 text-ui-xs"
            >
              <CheckIcon className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function EdgeEditor({ nodeId, map }: { nodeId: string; map: LoadedMap }) {
  const mapId = useStore((s) => s.mapId);
  const editSource = useStore((s) => s.editSources[mapId]);
  const source = useMemo(() => editSource ?? graphDataToSource(map.data), [editSource, map]);
  const addNodeEdge = useStore((s) => s.addNodeEdge);
  const updateNodeEdge = useStore((s) => s.updateNodeEdge);
  const removeNodeEdge = useStore((s) => s.removeNodeEdge);

  const [relation, setRelation] = useState<AuthorableRelation>("uses");
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");
  const [outgoing, setOutgoing] = useState(true); // this → other, vs other → this
  const [error, setError] = useState<string | null>(null);

  const incident = incidentEdges(source, nodeId);
  const nodeLabel = (id: string) => map.nodeById.get(id)?.label ?? id;
  const others = map.data.nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({ id: n.id, label: n.label }));

  const submit = () => {
    if (!other) {
      setError("Pick a concept to link.");
      return;
    }
    const edge = outgoing
      ? { source: nodeId, target: other, relation, notes }
      : { source: other, target: nodeId, relation, notes };
    const result = addNodeEdge(edge);
    if (!result.ok) setError(result.error ?? "Could not add link.");
    else {
      setError(null);
      setOther("");
      setNotes("");
    }
  };

  return (
    <div className="space-y-2.5">
      <FieldLabel label={`Links (${incident.length})`} />

      {incident.length > 0 && (
        <ul className="space-y-1">
          {incident.map(({ edge, role }) => (
            <EdgeRow
              key={edgeKey(edge)}
              edge={edge}
              role={role}
              otherLabel={nodeLabel(role === "source" ? edge.target : edge.source)}
              onUpdate={(patch) => updateNodeEdge(edgeKey(edge), patch).error ?? null}
              onRemove={() => removeNodeEdge(edgeKey(edge))}
            />
          ))}
        </ul>
      )}

      <div
        className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-md border border-dashed p-2"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => setOutgoing((o) => !o)}
          title={outgoing ? "this → concept" : "concept → this"}
          className="flex h-8 items-center gap-1.5 rounded-sm px-2 text-ui-xs font-medium hover:bg-(--surface-3)"
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
            className="authoring-action authoring-action-primary h-8 rounded-sm px-2.5 text-ui-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Link
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Author notes (optional)"
          rows={1}
          className="authoring-control col-span-2"
        />
        {error && (
          <p className="col-span-2 text-ui-xs" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** Editor for the worked-examples array (content body + optional label & role). */
function ExamplesEditor({
  examples,
  onChange,
}: {
  examples: ExampleDraft[];
  onChange: (next: ExampleDraft[]) => void;
}) {
  const patch = (i: number, p: Partial<ExampleDraft>) =>
    onChange(examples.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
  const remove = (i: number) => onChange(examples.filter((_, idx) => idx !== i));
  const add = () => onChange([...examples, emptyExample()]);

  return (
    <div className="authoring-field">
      <FieldLabel label="Examples" hint="worked instances" />
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <div
            key={i}
            className="space-y-1.5 rounded-md border p-2"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ex.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="Label (optional)"
                className="authoring-control flex-1"
              />
              <input
                type="text"
                value={ex.role}
                onChange={(e) => patch(i, { role: e.target.value })}
                placeholder="Role (optional)"
                className="authoring-control flex-1"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove example"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3)"
                style={{ color: "var(--fg-3)" }}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={ex.content}
              onChange={(e) => patch(i, { content: e.target.value })}
              placeholder="Example content (LaTeX)"
              rows={2}
              className="authoring-control authoring-control-mono"
            />
            {ex.content.trim() && (
              <span className="block text-ui-xs text-fg-2">
                <MathText text={ex.content} />
              </span>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="authoring-action rounded-sm px-2.5 py-1.5 text-ui-xs"
          style={{ color: "var(--fg-2)" }}
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add example
        </button>
      </div>
    </div>
  );
}

/** Multi-select of concept references (a proof step's `uses`): chips + add-picker. */
function UsesPicker({
  value,
  options,
  map,
  onChange,
}: {
  value: string[];
  options: { id: string; label: string }[];
  map: LoadedMap;
  onChange: (next: string[]) => void;
}) {
  const remaining = options.filter((o) => !value.includes(o.id));
  const label = (id: string) => map.nodeById.get(id)?.label ?? id;
  return (
    <div className="space-y-1.5">
      <FieldLabel label="Uses" hint="concepts cited — become proof-dependency edges" />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-ui-xs"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--fg-2)" }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: getDomainTone(id).color }}
                aria-hidden
              />
              <span className="max-w-40 truncate">
                <MathText text={label(id)} />
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                aria-label="Remove reference"
                className="shrink-0 hover:text-(--danger)"
                style={{ color: "var(--fg-3)" }}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <NodePicker
        options={remaining}
        value=""
        onChange={(id) => id && onChange([...value, id])}
        placeholder="Add a cited concept…"
      />
    </div>
  );
}

/** Editor for the ordered proof / solution steps (role + LaTeX content + uses refs). */
function ProofStepsEditor({
  steps,
  options,
  map,
  onChange,
}: {
  steps: ProofStepDraft[];
  options: { id: string; label: string }[];
  map: LoadedMap;
  onChange: (next: ProofStepDraft[]) => void;
}) {
  const patch = (i: number, p: Partial<ProofStepDraft>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const add = () => onChange([...steps, emptyProofStep()]);
  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="authoring-field">
      <FieldLabel label="Proof / solution" hint="ordered steps" />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="space-y-1.5 rounded-md border p-2"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="shrink-0 font-mono text-ui-2xs tabular-nums"
                style={{ color: "var(--fg-3)" }}
              >
                {i + 1}
              </span>
              <input
                type="text"
                value={step.role}
                onChange={(e) => patch(i, { role: e.target.value })}
                placeholder="Role (e.g. Setup, Claim, Conclude)"
                className="authoring-control flex-1"
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move step up"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3) disabled:opacity-30"
                style={{ color: "var(--fg-3)" }}
              >
                <ArrowUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                aria-label="Move step down"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3) disabled:opacity-30"
                style={{ color: "var(--fg-3)" }}
              >
                <ArrowDownIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove step"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-(--surface-3)"
                style={{ color: "var(--fg-3)" }}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={step.content}
              onChange={(e) => patch(i, { content: e.target.value })}
              placeholder="Step content (LaTeX)"
              rows={2}
              className="authoring-control authoring-control-mono"
            />
            {step.content.trim() && (
              <span className="block text-ui-xs text-fg-2">
                <MathText text={step.content} />
              </span>
            )}
            <UsesPicker
              value={step.uses}
              options={options}
              map={map}
              onChange={(uses) => patch(i, { uses })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="authoring-action rounded-sm px-2.5 py-1.5 text-ui-xs"
          style={{ color: "var(--fg-2)" }}
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add step
        </button>
      </div>
    </div>
  );
}

/**
 * Inline editor body, rendered inside the NodePanel `aside`. `editingId` is the
 * concept being edited, or null for a new concept.
 */
export function NodeEditorPanel({
  editingId,
  map,
  mapId,
  onClose,
}: {
  editingId: string | null;
  map: LoadedMap;
  mapId: MapId;
  onClose: () => void;
}) {
  const editSource = useStore((s) => s.editSources[mapId]);
  const source = useMemo(() => editSource ?? graphDataToSource(map.data), [editSource, map]);
  const commitNode = useStore((s) => s.commitNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const editError = useStore((s) => s.editError);

  const concept =
    editingId !== null ? (source.concepts.find((c) => c.id === editingId) ?? null) : null;

  const [draft, setDraft] = useState<NodeDraft>(() =>
    concept ? conceptToDraft(concept) : emptyDraft(map.data.domains[0]?.id ?? ""),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Transient "Saved" confirmation. A successful edit reseeds the editor in place
  // (it stays open for continued editing), so without this pulse a save of an
  // unchanged-looking concept reads as a dead button.
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    },
    [],
  );

  // Reseed when the editor target changes (selecting a different node, or
  // switching into create mode). Compared during render rather than in an effect.
  const [prevEditingId, setPrevEditingId] = useState(editingId);
  if (editingId !== prevEditingId) {
    setPrevEditingId(editingId);
    setConfirmDelete(false);
    setJustSaved(false);
    if (editingId !== null && concept) setDraft(conceptToDraft(concept));
    else if (editingId === null) setDraft(emptyDraft(map.data.domains[0]?.id ?? ""));
  }

  const set = (patch: Partial<NodeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const save = () => {
    const result = commitNode(draft);
    // Create flips the editor over to the freshly created node (a new instance),
    // so the pulse is only meaningful for in-place edits.
    if (result.ok && editingId !== null) {
      setJustSaved(true);
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setJustSaved(false), 1800);
    }
  };

  const tone = getDomainTone(draft.domain || (editingId ?? ""));
  const glyphId = getDomainGlyphId({ mapId, domainId: draft.domain });

  return (
    <>
      {/* Header */}
      <header className="relative shrink-0 px-5 pt-3.5" style={{ background: "var(--surface)" }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
            {editingId === null ? "New concept" : "Edit concept"}
          </span>
          <div className="flex items-center gap-0.5">
            {editingId !== null &&
              (confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-xs" style={{ color: "var(--fg-2)" }}>
                    Delete?
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteNode(editingId)}
                    className="authoring-action rounded-sm px-2 py-1 text-ui-xs"
                    style={{ background: "var(--danger)", color: "var(--fg-on-color)" }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="authoring-action rounded-sm px-1.5 py-1 text-ui-xs text-fg-3"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete concept"
                  className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-(--surface-3)"
                  style={{ color: "var(--fg-3)" }}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              ))}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-(--surface-3)"
              style={{ color: "var(--fg-2)" }}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pb-3.5">
          <span
            aria-hidden
            className="mt-1.75 h-9 w-0.75 shrink-0 rounded-full"
            style={{ background: tone.color }}
          />
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={draft.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="Concept label"
              className="w-full bg-transparent font-serif text-node-panel-title outline-none placeholder:text-fg-3"
              style={{ color: "var(--fg-1)", fontWeight: 600, letterSpacing: "-0.015em" }}
              aria-label="Concept label"
            />
            {draft.label.trim() && (
              <div className="mt-0.5 text-ui-meta text-fg-2">
                <MathText text={draft.label} />
              </div>
            )}
            <div
              className="mt-2 flex items-center gap-1.5 text-ui-meta"
              style={{ color: tone.color }}
            >
              {glyphId ? (
                <DomainGlyph id={glyphId} size={14} />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
              )}
              <span className="font-medium">{map.domainById.get(draft.domain)?.label ?? "—"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
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
          <div className="flex flex-wrap gap-2 text-sm">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set({ priority: p })}
                className={draft.priority === p ? "authoring-chip is-active" : "authoring-chip"}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Statement"
          value={draft.statement}
          onChange={(v) => set({ statement: v })}
          area
          mono
          hint="LaTeX"
          preview
        />
        <Field
          label="Definition"
          value={draft.definition}
          onChange={(v) => set({ definition: v })}
          area
          mono
          hint="LaTeX"
          preview
        />
        <Field
          label="Formal statement"
          value={draft.formal}
          onChange={(v) => set({ formal: v })}
          area
          mono
          hint="LaTeX"
          preview
        />
        <Field
          label="Formula"
          value={draft.formula}
          onChange={(v) => set({ formula: v })}
          area
          mono
          hint="LaTeX"
          preview
        />
        <Field
          label="Intuition"
          value={draft.intuition}
          onChange={(v) => set({ intuition: v })}
          area
        />
        <Field
          label="Gloss"
          value={draft.gloss}
          onChange={(v) => set({ gloss: v })}
          area
          hint="dictionary one-liner"
        />
        <Field
          label="Notation"
          value={draft.notation}
          onChange={(v) => set({ notation: v })}
          area
          mono
          hint="one per line"
        />
        <Field
          label="Assumptions"
          value={draft.assumptions}
          onChange={(v) => set({ assumptions: v })}
          area
          hint="one per line"
        />
        <Field
          label="Properties"
          value={draft.properties}
          onChange={(v) => set({ properties: v })}
          area
          hint="one per line"
        />
        <Field
          label="Diagram"
          value={draft.diagram}
          onChange={(v) => set({ diagram: v })}
          mono
          hint="figure id or image src"
        />
        <ExamplesEditor
          examples={draft.examples}
          onChange={(examples) => set({ examples })}
        />
        <ProofStepsEditor
          steps={draft.proof}
          options={map.data.nodes
            .filter((n) => n.id !== editingId)
            .map((n) => ({ id: n.id, label: n.label }))}
          map={map}
          onChange={(proof) => set({ proof })}
        />
        <Field
          label="Tags"
          value={draft.tags}
          onChange={(v) => set({ tags: v })}
          hint="comma-separated"
        />

        {editingId !== null && (
          <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
            <EdgeEditor nodeId={editingId} map={map} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="flex shrink-0 items-center gap-2 border-t px-5 py-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {editError && (
          <span className="min-w-0 flex-1 truncate text-ui-xs" style={{ color: "var(--danger)" }}>
            {editError}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          className="authoring-action authoring-action-primary ml-auto inline-flex items-center gap-1 rounded-sm px-3 py-1.5 text-ui-xs"
          style={justSaved ? { background: "var(--green)", color: "var(--fg-on-color)" } : undefined}
        >
          {justSaved ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" weight="bold" /> Saved
            </>
          ) : editingId === null ? (
            "Create"
          ) : (
            "Save"
          )}
        </button>
      </footer>
    </>
  );
}
