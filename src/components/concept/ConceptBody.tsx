import { type ReactNode } from "react";
import { MathText, MathProse } from "../../lib/katex";
import type { LoadedMap } from "../../data";
import type { ConceptView } from "../../lib/conceptView";
import { Spine, Steps, Collapsible } from "../Specimen";
import { hasNodeVisual, NodeVisual } from "../NodeVisual";
import { Ledger, type LedgerRow } from "./Ledger";

/**
 * The shared concept body: one emphasized statement (the Spine anchor) over an
 * aligned label-gutter Ledger of facets, optionally followed by the proof. The
 * old surfaces each boxed the definition and formula as competing callouts; here
 * only the statement is boxed and the rest demote to quiet ledger rows, so the
 * hierarchy reads at a glance.
 *
 * `density` is the one knob the surfaces turn:
 *  - card  — the flashcard answer: essentials + collapsed proof.
 *  - panel — the NodePanel overview: full prose, proof lives in its own tab.
 *  - full  — the dictionary detail: everything, including notation + open proof.
 */
export type ConceptDensity = "card" | "panel" | "full";

type Field =
  | "assumptions"
  | "formal"
  | "definition"
  | "formula"
  | "notation"
  | "intuition"
  | "gloss"
  | "example";

interface DensitySpec {
  fields: Field[];
  proof: boolean;
  proofOpen: boolean;
  gutter: number;
  spine: "panel" | "dict";
}

const DENSITY: Record<ConceptDensity, DensitySpec> = {
  card: {
    fields: ["definition", "formula", "intuition", "example"],
    proof: true,
    proofOpen: false,
    gutter: 92,
    spine: "dict",
  },
  panel: {
    fields: ["assumptions", "formal", "definition", "formula", "intuition", "gloss", "example"],
    proof: false,
    proofOpen: false,
    gutter: 86,
    spine: "panel",
  },
  full: {
    fields: ["assumptions", "formal", "definition", "formula", "notation", "intuition", "gloss", "example"],
    proof: true,
    proofOpen: true,
    gutter: 104,
    spine: "dict",
  },
};

const FIELD_LABEL: Record<Field, string> = {
  assumptions: "Assumes",
  formal: "Formal",
  definition: "Define",
  formula: "Formula",
  notation: "Notation",
  intuition: "Intuition",
  gloss: "In words",
  example: "Example",
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

  const rows: LedgerRow[] = [];
  for (const field of spec.fields) {
    const content = renderField(view, field);
    if (content) rows.push({ label: FIELD_LABEL[field], content });
  }

  return (
    <div className="space-y-4">
      {showVisual && hasNodeVisual(node) && (
        <NodeVisual node={node} />
      )}

      {view.statement && (
        <Spine tone={tone} kind={node.kind} size={spec.spine}>
          <MathProse text={view.statement} asBlock />
        </Spine>
      )}

      <Ledger rows={rows} gutter={spec.gutter} />

      {spec.proof && view.proof.hasProof && (
        <Collapsible
          toneColor={tone.color}
          label={view.proof.label}
          defaultOpen={spec.proofOpen}
        >
          <Steps
            steps={view.proof.steps}
            toneColor={tone.color}
            map={map}
            onSelect={onSelect}
          />
        </Collapsible>
      )}
    </div>
  );
}

function renderField(view: ConceptView, field: Field): ReactNode {
  switch (field) {
    case "assumptions":
      return view.assumptions.length > 0 ? (
        <ul className="m-0 space-y-1.5 p-0">
          {view.assumptions.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                style={{ background: view.tone.color }}
              />
              <span>
                <MathProse text={a} />
              </span>
            </li>
          ))}
        </ul>
      ) : null;
    case "formal":
      return view.formalStatement ? (
        <MathProse text={view.formalStatement} asBlock />
      ) : null;
    case "definition":
      return view.definition ? (
        <MathText text={view.definition} asBlock />
      ) : null;
    case "formula":
      return view.formula ? <MathText text={view.formula} asBlock /> : null;
    case "notation":
      return view.notation.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 font-math">
          {view.notation.map((n, i) => (
            <span key={i} style={{ color: "var(--fg-1)" }}>
              <MathText text={n} />
            </span>
          ))}
        </div>
      ) : null;
    case "intuition":
      return view.intuition ? <MathProse text={view.intuition} /> : null;
    case "gloss":
      return view.gloss ? <MathProse text={view.gloss} /> : null;
    case "example":
      return view.example ? <MathProse text={view.example} /> : null;
    default:
      return null;
  }
}
