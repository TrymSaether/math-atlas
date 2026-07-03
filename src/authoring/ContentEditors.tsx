import { ArrowDown, ArrowUp, Plus, Trash2, XIcon } from "lucide-react";

import { getDomainTone } from "@/atlas/colors";
import type { LoadedMap } from "@/maps";
import { cn } from "@/shared/cn";
import { MathText } from "@/shared/math";
import { emptyExample, emptyProofStep, type ExampleDraft, type ProofStepDraft } from "./model";
import { ACTION, CONTROL, CONTROL_MONO, FIELD, FieldLabel, NodePicker } from "./editorControls";

/** Editor for the worked-examples array (content body + optional label & role). */
export function ExamplesEditor({
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
    <div className={FIELD}>
      <FieldLabel label="Examples" hint="worked instances" />
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <div
            key={i}
            className="space-y-1.5 rounded-md border p-2"
            style={{ borderColor: "var(--border)", background: "var(--muted)" }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ex.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="Label (optional)"
                className={cn(CONTROL, "flex-1")}
              />
              <input
                type="text"
                value={ex.role}
                onChange={(e) => patch(i, { role: e.target.value })}
                placeholder="Role (optional)"
                className={cn(CONTROL, "flex-1")}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove example"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-secondary"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={ex.content}
              onChange={(e) => patch(i, { content: e.target.value })}
              placeholder="Example content (LaTeX)"
              rows={2}
              className={cn(CONTROL, CONTROL_MONO)}
            />
            {ex.content.trim() && (
              <span className="block text-caption-1 text-muted-foreground">
                <MathText text={ex.content} />
              </span>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className={cn(ACTION, "rounded-sm px-2.5 py-1.5 text-caption-1")}
          style={{ color: "var(--muted-foreground)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Add example
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
              className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-caption-1"
              style={{
                borderColor: "var(--border)",
                background: "var(--secondary)",
                color: "var(--muted-foreground)",
              }}
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
                style={{ color: "var(--muted-foreground)" }}
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
export function ProofStepsEditor({
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
    <div className={FIELD}>
      <FieldLabel label="Proof / solution" hint="ordered steps" />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="space-y-1.5 rounded-md border p-2"
            style={{ borderColor: "var(--border)", background: "var(--muted)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="shrink-0 font-mono text-caption-2 tabular-nums"
                style={{ color: "var(--muted-foreground)" }}
              >
                {i + 1}
              </span>
              <input
                type="text"
                value={step.role}
                onChange={(e) => patch(i, { role: e.target.value })}
                placeholder="Role (e.g. Setup, Claim, Conclude)"
                className={cn(CONTROL, "flex-1")}
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move step up"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-secondary disabled:opacity-30"
                style={{ color: "var(--muted-foreground)" }}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                aria-label="Move step down"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-secondary disabled:opacity-30"
                style={{ color: "var(--muted-foreground)" }}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove step"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm hover:bg-secondary"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={step.content}
              onChange={(e) => patch(i, { content: e.target.value })}
              placeholder="Step content (LaTeX)"
              rows={2}
              className={cn(CONTROL, CONTROL_MONO)}
            />
            {step.content.trim() && (
              <span className="block text-caption-1 text-muted-foreground">
                <MathText text={step.content} />
              </span>
            )}
            <UsesPicker value={step.uses} options={options} map={map} onChange={(uses) => patch(i, { uses })} />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className={cn(ACTION, "rounded-sm px-2.5 py-1.5 text-caption-1")}
          style={{ color: "var(--muted-foreground)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Add step
        </button>
      </div>
    </div>
  );
}
