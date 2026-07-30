import { useId, useState } from "react";

import { MathText } from "@/math/MathText";
import { FigureCaption } from "../core/FigureFrame";
import { SegmentedControl } from "../core/SegmentedControl";
import { DIA, UI } from "../core/tokens";
import type { FigureProps } from "../core/types";

type View = "hasse" | "relation";
type Axiom = "all" | "reflexive" | "antisymmetric" | "transitive";
type Value = "1" | "2" | "3" | "6";
type PairKey = `${Value}-${Value}`;

interface Point {
  x: number;
  y: number;
}

interface RelationEdge {
  pair: PairKey;
  path: string;
  cover: boolean;
}

const POSITIONS: Record<Value, Point> = {
  "1": { x: 260, y: 250 },
  "2": { x: 160, y: 145 },
  "3": { x: 360, y: 145 },
  "6": { x: 260, y: 40 },
};

const ORDERED_PAIRS: PairKey[] = ["1-1", "1-2", "1-3", "1-6", "2-2", "2-6", "3-3", "3-6", "6-6"];

const EDGES: RelationEdge[] = [
  { pair: "1-2", path: "M 244 232 Q 198 194 174 167", cover: true },
  { pair: "1-3", path: "M 276 232 Q 322 194 346 167", cover: true },
  { pair: "1-6", path: "M 260 224 L 260 68", cover: false },
  { pair: "2-6", path: "M 174 123 Q 198 96 244 58", cover: true },
  { pair: "3-6", path: "M 346 123 Q 322 96 276 58", cover: true },
  { pair: "1-1", path: "M 282 242 C 324 218 324 274 283 260", cover: false },
  { pair: "2-2", path: "M 182 137 C 224 113 224 169 183 155", cover: false },
  { pair: "3-3", path: "M 382 137 C 424 113 424 169 383 155", cover: false },
  { pair: "6-6", path: "M 282 32 C 324 8 324 64 283 50", cover: false },
];

const AXIOM_PAIRS: Record<Axiom, PairKey[]> = {
  all: [],
  reflexive: ["1-1", "2-2", "3-3", "6-6"],
  antisymmetric: ["1-2"],
  transitive: ["1-2", "2-6", "1-6"],
};

const AXIOM_NODES: Record<Axiom, Value[]> = {
  all: [],
  reflexive: ["1", "2", "3", "6"],
  antisymmetric: ["1", "2"],
  transitive: ["1", "2", "6"],
};

const AXIOM_COPY: Record<Axiom, { main: string; note: string }> = {
  all: {
    main: "A partial order is reflexive, antisymmetric, and transitive.",
    note: "The elements $2$ and $3$ are incomparable, so this order is partial rather than linear.",
  },
  reflexive: {
    main: String.raw`Reflexive: $(a,a)\in R$ for every $a\in P$.`,
    note: "The four loops belong to $R$, although a Hasse diagram does not draw them.",
  },
  antisymmetric: {
    main: String.raw`Antisymmetric: $(a,b),(b,a)\in R$ implies $a=b$.`,
    note: String.raw`For example, $(1,2)\in R$ but $(2,1)\notin R$; no distinct pair occurs in both directions.`,
  },
  transitive: {
    main: String.raw`Transitive: $(1,2),(2,6)\in R$ implies $(1,6)\in R$.`,
    note: String.raw`The Hasse path $1\prec2\prec6$ encodes the omitted transitive pair $(1,6)$.`,
  },
};

function pairTex(pair: PairKey): string {
  const [left, right] = pair.split("-");
  return `(${left},${right})`;
}

function edgeState(pair: PairKey, axiom: Axiom): "active" | "muted" | "normal" {
  if (axiom === "all") return "normal";
  return AXIOM_PAIRS[axiom].includes(pair) ? "active" : "muted";
}

function RelationSet({ axiom }: { axiom: Axiom }) {
  return (
    <div
      className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-math text-caption-1"
      aria-label="Ordered pairs in R"
    >
      <span style={{ color: UI.muted }}>R = {"{"}</span>
      {ORDERED_PAIRS.map((pair, index) => {
        const active = AXIOM_PAIRS[axiom].includes(pair);
        return (
          <span
            key={pair}
            className={active ? "rounded-xs px-1" : "px-1"}
            style={{
              color: active ? UI.onColor : UI.text,
              background: active ? DIA.accent : "transparent",
            }}
          >
            {pairTex(pair)}
            {index < ORDERED_PAIRS.length - 1 ? "," : ""}
          </span>
        );
      })}
      <span style={{ color: UI.muted }}>{"}"}</span>
    </div>
  );
}

function OrderDiagram({ view, axiom }: { view: View; axiom: Axiom }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const markerId = `${rawId}-order-arrow`;
  const activePairs = AXIOM_PAIRS[axiom];

  return (
    <svg
      viewBox="0 0 520 290"
      className="block h-auto w-full"
      role="img"
      aria-label={
        view === "hasse"
          ? "Hasse diagram of divisibility on 1, 2, 3, and 6"
          : "Directed graph of all nine ordered pairs in the divisibility relation"
      }
    >
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={DIA.ink} />
        </marker>
      </defs>

      <text x="260" y="16" textAnchor="middle" fill={DIA.muted} fontSize="11">
        larger in the order ↑
      </text>

      {view === "hasse"
        ? EDGES.filter((edge) => edge.cover).map((edge) => {
            const state = edgeState(edge.pair, axiom);
            const active = state === "active";
            const shouldMute = axiom !== "all" && !activePairs.includes(edge.pair);
            return (
              <path
                key={edge.pair}
                d={edge.path}
                fill="none"
                stroke={active ? DIA.accent : DIA.ink}
                strokeWidth={active ? 3 : 1.7}
                opacity={shouldMute ? 0.24 : 1}
              />
            );
          })
        : EDGES.map((edge) => {
            const state = edgeState(edge.pair, axiom);
            return (
              <path
                key={edge.pair}
                d={edge.path}
                fill="none"
                stroke={state === "active" ? DIA.accent : DIA.ink}
                strokeWidth={state === "active" ? 3 : 1.6}
                strokeDasharray={edge.pair === "1-6" ? "6 5" : undefined}
                opacity={state === "muted" ? 0.22 : 1}
                markerEnd={`url(#${markerId})`}
              />
            );
          })}

      {(Object.entries(POSITIONS) as [Value, Point][]).map(([value, point]) => {
        const active = AXIOM_NODES[axiom].includes(value);
        return (
          <g key={value} transform={`translate(${point.x} ${point.y})`}>
            <circle r="24" fill={DIA.fillX} stroke={active ? DIA.accent : DIA.ink} strokeWidth={active ? 3 : 1.5} />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="central"
              fill={DIA.ink}
              fontSize="14"
              fontWeight="500"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PartiallyOrderedSetFigure(_props: FigureProps) {
  const [view, setView] = useState<View>("hasse");
  const [axiom, setAxiom] = useState<Axiom>("all");
  const copy = AXIOM_COPY[axiom];

  return (
    <figure className="m-0">
      <div className="font-math text-caption-1" style={{ color: UI.text }}>
        <MathText text={String.raw`$P=\{1,2,3,6\},\qquad a\preceq b\iff a\mid b$`} />
      </div>
      <RelationSet axiom={axiom} />

      <div
        className="mt-2 overflow-hidden rounded-md border"
        style={{ borderColor: DIA.border, background: DIA.frame }}
      >
        <OrderDiagram view={view} axiom={axiom} />
      </div>

      <SegmentedControl<View>
        value={view}
        options={[
          { value: "hasse", label: "Hasse diagram" },
          { value: "relation", label: "Full relation" },
        ]}
        onChange={setView}
        ariaLabel="Order diagram representation"
      />
      <SegmentedControl<Axiom>
        value={axiom}
        options={[
          { value: "all", label: "All" },
          { value: "reflexive", label: "Reflexive" },
          { value: "antisymmetric", label: "Antisymmetric" },
          { value: "transitive", label: "Transitive" },
        ]}
        onChange={setAxiom}
        ariaLabel="Partial order axiom"
      />

      <FigureCaption className="space-y-0.5">
        <div className="font-medium" style={{ color: UI.text }}>
          <MathText text={copy.main} />
        </div>
        <MathText text={copy.note} />
      </FigureCaption>
    </figure>
  );
}
