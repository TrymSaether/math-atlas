import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Pencil, Plus, Trash2 } from "lucide-react";

import { useStore } from "@/app/store";
import type { AtlasMap } from "@/atlas/model";
import { graphDataToSource } from "@/maps/serialize";
import { AUTHORABLE_RELATIONS, RELATIONS, type AuthorableRelation } from "@shared/maps/relations";
import { MathText } from "@/math/MathText";
import { cn } from "@/ui/cn";
import { edgeKey, incidentEdges } from "./model";
import { ACTION, ACTION_PRIMARY, CONTROL, FieldLabel, NodePicker, SelectField } from "./editorControls";

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
      className="rounded-md border px-2.5 py-1.5 text-footnote"
      style={{ borderColor: "var(--border)", background: "var(--muted)" }}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate" style={{ color: "var(--muted-foreground)" }}>
          {role === "source" ? (
            <>
              this <em style={{ color: "var(--muted-foreground)" }}>{reads}</em> <MathText text={otherLabel} />
            </>
          ) : (
            <>
              <MathText text={otherLabel} /> <em style={{ color: "var(--muted-foreground)" }}>{reads}</em> this
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => (editing ? setEditing(false) : open())}
          aria-label={editing ? "Close edit" : "Edit link"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-secondary"
          style={{ color: editing ? "var(--primary)" : "var(--muted-foreground)" }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove link"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-secondary"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {!editing && edge.notes && (
        <p className="mt-1 text-caption-1 italic" style={{ color: "var(--muted-foreground)" }}>
          {edge.notes}
        </p>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <SelectField
            label=""
            value={relation}
            onChange={(next) => setRelation(next as AuthorableRelation)}
            options={AUTHORABLE_RELATIONS.map((r) => ({ value: r, label: RELATIONS[r].reads }))}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Author notes (optional) — rationale, not surfaced in the public map"
            rows={2}
            className={CONTROL}
          />
          {error && (
            <p className="text-caption-1" style={{ color: "var(--destructive)" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={cn(ACTION, "rounded-sm px-2 py-1 text-caption-1 text-muted-foreground")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className={cn(ACTION, ACTION_PRIMARY, "rounded-sm px-2.5 py-1 text-caption-1")}
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function EdgeEditor({ nodeId, map }: { nodeId: string; map: AtlasMap }) {
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
  const others = map.data.nodes.filter((n) => n.id !== nodeId).map((n) => ({ id: n.id, label: n.label }));

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
          className="flex h-8 items-center gap-1.5 rounded-sm px-2 text-caption-1 font-medium hover:bg-secondary"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {outgoing ? "from this" : "to this"}
        </button>
        <SelectField
          label=""
          value={relation}
          onChange={(next) => setRelation(next as AuthorableRelation)}
          options={AUTHORABLE_RELATIONS.map((r) => ({ value: r, label: RELATIONS[r].reads }))}
        />
        <div className="col-span-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <NodePicker options={others} value={other} onChange={setOther} />
          </div>
          <button
            type="button"
            onClick={submit}
            className={cn(ACTION, ACTION_PRIMARY, "h-8 rounded-sm px-2.5 text-caption-1")}
          >
            <Plus className="h-3.5 w-3.5" /> Link
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Author notes (optional)"
          rows={1}
          className={cn(CONTROL, "col-span-2")}
        />
        {error && (
          <p className="col-span-2 text-caption-1" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
