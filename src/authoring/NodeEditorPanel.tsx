/**
 * Inline concept editor hosted by the shell-native Edit Mode inspector. Same
 * glass aesthetic as the rest of the map chrome;
 * reuses the entire authoring engine — store actions and the pure draft helpers
 * in `authoring/model.ts` — so nothing about validation or persistence
 * changes, only the host surface.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Trash2, XIcon } from "lucide-react";

import { useStore } from "@/app/store";
import { DomainGlyph } from "@/atlas/DomainGlyph";
import { getDomainTone } from "@/atlas/colors";
import { getDomainGlyphId } from "@/atlas/domainGlyphs";
import type { AtlasMap } from "@/atlas/model";
import type { MapId } from "@/maps";
import { graphDataToSource } from "@/maps/serialize";
import { cn } from "@/ui/cn";
import { MathText } from "@/math/MathText";
import { KIND_VALUES } from "@shared/maps/source";
import { KIND_LABEL } from "@/maps/types";
import { conceptToDraft, emptyDraft, type NodeDraft, type Priority } from "./model";
import { ExamplesEditor, ProofStepsEditor } from "./ContentEditors";
import {
  ACTION,
  ACTION_DANGER,
  ACTION_PRIMARY,
  CHIP,
  CHIP_ACTIVE,
  Field,
  FieldLabel,
  SelectField,
} from "./editorControls";
import { EdgeEditor } from "./LinkEditor";

const PRIORITIES: Priority[] = ["core", "standard", "peripheral"];

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
  map: AtlasMap;
  mapId: MapId;
  onClose: () => void;
}) {
  const editSource = useStore((s) => s.editSources[mapId]);
  const source = useMemo(() => editSource ?? graphDataToSource(map.data), [editSource, map]);
  const commitNode = useStore((s) => s.commitNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const editError = useStore((s) => s.editError);

  const concept = editingId !== null ? (source.concepts.find((c) => c.id === editingId) ?? null) : null;

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
      <header className="relative shrink-0 px-5 pt-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-caption-2 font-semibold uppercase tracking-label-tight text-muted-foreground">
            {editingId === null ? "New concept" : "Edit concept"}
          </span>
          <div className="flex items-center gap-0.5">
            {editingId !== null &&
              (confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-caption-1" style={{ color: "var(--muted-foreground)" }}>
                    Delete?
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteNode(editingId)}
                    className={cn(ACTION, ACTION_DANGER, "rounded-sm px-2 py-1 text-caption-1")}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className={cn(ACTION, "rounded-sm px-1.5 py-1 text-caption-1 text-muted-foreground")}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete concept"
                  className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-secondary"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ))}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-secondary"
              style={{ color: "var(--muted-foreground)" }}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pb-3.5">
          <span aria-hidden className="mt-1.75 h-9 w-0.75 shrink-0 rounded-full" style={{ background: tone.color }} />
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={draft.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="Concept label"
              className="w-full bg-transparent text-title-2 outline-none placeholder:text-muted-foreground"
              style={{ color: "var(--foreground)", fontWeight: 600, letterSpacing: "-0.015em" }}
              aria-label="Concept label"
            />
            {draft.label.trim() && (
              <div className="mt-0.5 text-caption-1 text-muted-foreground">
                <MathText text={draft.label} />
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-caption-1" style={{ color: tone.color }}>
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
      <div className="panel-scrollbar min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
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
          <div className="flex flex-wrap gap-2 text-footnote">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set({ priority: p })}
                className={cn(CHIP, draft.priority === p && CHIP_ACTIVE)}
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
        <Field label="Intuition" value={draft.intuition} onChange={(v) => set({ intuition: v })} area />
        <Field label="Gloss" value={draft.gloss} onChange={(v) => set({ gloss: v })} area hint="dictionary one-liner" />
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
        <ExamplesEditor examples={draft.examples} onChange={(examples) => set({ examples })} />
        <ProofStepsEditor
          steps={draft.proof}
          options={map.data.nodes.filter((n) => n.id !== editingId).map((n) => ({ id: n.id, label: n.label }))}
          map={map}
          onChange={(proof) => set({ proof })}
        />
        <Field label="Tags" value={draft.tags} onChange={(v) => set({ tags: v })} hint="comma-separated" />

        {editingId !== null && (
          <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <EdgeEditor nodeId={editingId} map={map} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex shrink-0 items-center gap-2 border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
        {editError && (
          <span className="min-w-0 flex-1 truncate text-caption-1" style={{ color: "var(--destructive)" }}>
            {editError}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          className={cn(
            ACTION,
            ACTION_PRIMARY,
            "ml-auto inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-footnote",
          )}
          style={justSaved ? { background: "var(--success)", color: "var(--success-foreground)" } : undefined}
        >
          {justSaved ? (
            <>
              <Check className="h-4 w-4" /> Saved
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
