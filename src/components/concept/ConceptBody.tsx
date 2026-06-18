import { type ReactNode } from "react";
import { MathText, MathProse } from "../../lib/katex";
import type { LoadedMap } from "../../data";
import type { ConceptView } from "../../lib/conceptView";
import { Spine, Steps, Collapsible } from "../Specimen";
import { hasNodeVisual, NodeVisual } from "../NodeVisual";

/**
 * The shared concept body: one emphasized statement (the Spine anchor) over a
 * vertical stack of full-width facet "environments", optionally followed by the
 * proof.
 *
 * Each facet renders as its own environment whose chrome signals its kind —
 * borrowing the LaTeX theorem-environment idea so the eye distinguishes a
 * definition from an intuition from a worked example without reading a word:
 *  - Define / In words → plain (and muted) prose, the running body text.
 *  - Formal / Formula   → a bordered display box (the equation environment).
 *  - Intuition          → a tone-ruled aside.
 *  - Example            → a neutral-ruled aside.
 *  - Assumes            → a full-width checklist.
 *  - Notation           → inline glyph chips.
 * Labels sit as a flush-left eyebrow above their content (no gutter column), so
 * each environment uses the full panel width.
 *
 * `density` is the one knob the surfaces turn:
 *  - card  — the flashcard answer: essentials + collapsed proof.
 *  - panel — the NodePanel overview: full prose, proof lives in its own tab.
 *  - full  — the dictionary detail: everything, including notation + open proof.
 */
export type ConceptDensity = "card" | "panel" | "full";

type Field = "assumptions" | "definition" | "formula" | "formal" | "notation" | "intuition" | "gloss" | "examples";

interface DensitySpec {
  fields: Field[];
  exampleLimit?: number;
  proof: boolean;
  proofOpen: boolean;
  proofCollapsible: boolean;
  spine: "panel" | "dict";
}

const DENSITY: Record<ConceptDensity, DensitySpec> = {
  card: {
    fields: ["definition", "formula", "intuition", "examples"],
    exampleLimit: 2,
    proof: true,
    proofOpen: false,
    proofCollapsible: true,
    spine: "dict",
  },
  panel: {
    fields: ["assumptions", "definition", "formula", "formal", "notation", "intuition", "gloss", "examples"],
    exampleLimit: 2,
    proof: false,
    proofOpen: false,
    proofCollapsible: false,
    spine: "panel",
  },
  full: {
    fields: ["assumptions", "definition", "formula", "formal", "notation", "intuition", "gloss", "examples"],
    proof: true,
    proofOpen: true,
    proofCollapsible: true,
    spine: "dict",
  },
};

const FIELD_LABEL: Record<Field, string> = {
  assumptions: "Assumes",
  definition: "Define",
  formula: "Formula",
  formal: "Formal",
  notation: "Notation",
  intuition: "Intuition",
  gloss: "In words",
  examples: "Examples",
};

export function ConceptBody({
  view,
  map,
  density,
  onSelect,
  showVisual = true,
}: {
  view: ConceptView;
  map: LoadedMap;
  density: ConceptDensity;
  onSelect?: (id: string) => void;
  showVisual?: boolean;
}) {
  const spec = DENSITY[density];
  const { tone, node } = view;

  const fields = spec.fields.filter((f) => hasField(view, f));

  return (
    <div className="space-y-4">
      {showVisual && hasNodeVisual(node) && <NodeVisual node={node} />}

      {view.statement && (
        <Spine tone={tone} kind={node.kind} size={spec.spine}>
          <MathProse text={view.statement} asBlock />
        </Spine>
      )}

      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field) => (
            <Environment key={field} view={view} field={field} exampleLimit={spec.exampleLimit} />
          ))}
        </div>
      )}

      {view.extraContent.length > 0 && (
        <div className="space-y-4">
          {view.extraContent.map((entry) => (
            <ExtraEnvironment key={entry.key} entry={entry} />
          ))}
        </div>
      )}

      {spec.proof && view.proof.hasProof && (
        <Collapsible
          toneColor={tone.color}
          label={view.proof.label}
          defaultOpen={spec.proofOpen}
          collapsible={spec.proofCollapsible}
        >
          <Steps
            steps={view.proof.steps}
            toneColor={tone.color}
            map={map}
            onSelect={onSelect}
            defaultOpen={spec.proofOpen}
          />
        </Collapsible>
      )}
    </div>
  );
}

function ExtraEnvironment({ entry }: { entry: ConceptView["extraContent"][number] }) {
  return (
    <section>
      <Eyebrow>{entry.label}</Eyebrow>
      <ExtraValue value={entry.value} />
    </section>
  );
}

function ExtraValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return (
      <div className="text-ui-copy" style={{ color: "var(--fg-1)" }}>
        <MathProse text={value} />
      </div>
    );
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    const items = value.map((item) => item.trim()).filter(Boolean);
    return (
      <ul className="m-0 space-y-1.5 p-0">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-ui-copy" style={{ color: "var(--fg-1)" }}>
            <span aria-hidden className="mt-2.25 h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--fg-3)" }} />
            <span className="min-w-0">
              <MathProse text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre
      className="panel-scrollbar max-w-full overflow-x-auto rounded-md border px-3 py-2 font-mono text-ui-xs leading-[1.6]"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
        color: "var(--fg-2)",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** A flush-left mono micro-label heading an environment. */
function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div className="mb-1.5 font-mono text-ui-2xs uppercase tracking-label" style={{ color: color ?? "var(--fg-3)" }}>
      {children}
    </div>
  );
}

/** One facet rendered with chrome that signals its kind. */
function Environment({ view, field, exampleLimit }: { view: ConceptView; field: Field; exampleLimit?: number }) {
  const label = FIELD_LABEL[field];
  const tone = view.tone;

  switch (field) {
    case "assumptions":
      return (
        <section>
          <Eyebrow>{label}</Eyebrow>
          <ul className="m-0 space-y-1.5 p-0">
            {view.assumptions.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-ui-copy" style={{ color: "var(--fg-1)" }}>
                <span
                  aria-hidden
                  className="mt-2.25 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: tone.color }}
                />
                <span className="min-w-0">
                  <MathProse text={a} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      );

    case "definition":
      return (
        <section>
          <Eyebrow>{label}</Eyebrow>
          <div className="panel-scrollbar max-w-full overflow-x-auto text-ui-copy" style={{ color: "var(--fg-1)" }}>
            <MathText text={view.definition} asBlock />
          </div>
        </section>
      );

    case "formula":
    case "formal":
      return (
        <section>
          <Eyebrow>{label}</Eyebrow>
          <DisplayBox>
            {field === "formula" ? (
              <MathText text={view.formula} asBlock />
            ) : (
              <MathProse text={view.formalStatement} asBlock />
            )}
          </DisplayBox>
        </section>
      );

    case "notation":
      return (
        <section>
          <Eyebrow>{label}</Eyebrow>
          <div className="flex flex-wrap gap-1.5">
            {view.notation.map((n, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-sm border px-2 py-1 font-math leading-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--fg-1)",
                }}
              >
                <MathText text={n} />
              </span>
            ))}
          </div>
        </section>
      );

    case "intuition":
      return (
        <Aside accent={tone.color} eyebrow={tone.color} label={label}>
          <MathProse text={view.intuition} />
        </Aside>
      );

    case "examples": {
      const examples = exampleLimit === undefined ? view.examples : view.examples.slice(0, exampleLimit);
      return (
        <Aside accent="var(--border-strong)" label={label}>
          <div className="space-y-3">
            {examples.map((example, index) => (
              <div key={index} className="space-y-1">
                {(example.role || example.label) && (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {example.role && (
                      <span className="font-mono text-ui-2xs tracking-label-tight" style={{ color: "var(--fg-3)" }}>
                        <MathProse text={example.role} />
                      </span>
                    )}
                    {example.label && (
                      <span className="text-ui-sm font-medium" style={{ color: "var(--fg-2)" }}>
                        <MathProse text={example.label} />
                      </span>
                    )}
                  </div>
                )}
                <MathProse text={example.content} />
              </div>
            ))}
          </div>
        </Aside>
      );
    }

    case "gloss":
      return (
        <section>
          <Eyebrow>{label}</Eyebrow>
          <div className="text-ui-copy" style={{ color: "var(--fg-2)" }}>
            <MathProse text={view.gloss} />
          </div>
        </section>
      );

    default:
      return null;
  }
}

/** Bordered display block for formal statements / formulas — wide math scrolls within. */
function DisplayBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="panel-scrollbar max-w-full overflow-x-auto rounded-md border px-4 py-3 font-math leading-[1.6]"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
        color: "var(--fg-1)",
      }}
    >
      {children}
    </div>
  );
}

/** A left-ruled aside — tone-ruled for Intuition, neutral-ruled for Example. */
function Aside({
  accent,
  eyebrow,
  label,
  children,
}: {
  accent: string;
  eyebrow?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="border-l-2 pl-3.5" style={{ borderColor: accent }}>
      <Eyebrow color={eyebrow}>{label}</Eyebrow>
      <div className="text-ui-copy" style={{ color: "var(--fg-1)" }}>
        {children}
      </div>
    </section>
  );
}

function hasField(view: ConceptView, field: Field): boolean {
  switch (field) {
    case "assumptions":
      return view.assumptions.length > 0;
    case "definition":
      return !!view.definition;
    case "formula":
      return !!view.formula;
    case "formal":
      return !!view.formalStatement;
    case "notation":
      return view.notation.length > 0;
    case "intuition":
      return !!view.intuition;
    case "gloss":
      return !!view.gloss;
    case "examples":
      return view.examples.length > 0;
    default:
      return false;
  }
}
