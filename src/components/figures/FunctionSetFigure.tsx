import { useMemo, useState } from "react";

import { Ellipse, FigureFrame, LaTeX, Line, Point, Polygon, Text, type Vec2 } from "./FigureFrame";
import { DIA } from "./tokens";
import { type FigureProps } from "./types";

type FunctionNode =
  | "function"
  | "image_of_function"
  | "preimage"
  | "inverse_of_function"
  | "restriction_of_function"
  | "domain"
  | "codomain";

type Choice = "valid" | "partial" | "multi" | "B" | "C" | "A" | "S" | "bijective" | "notBijective";

const LEFT_X = -3.05;
const RIGHT_X = 3.05;
const DOMAIN_COLOR = DIA.accent;
const CODOMAIN_COLOR = DIA.codomain;
const SELECTED_COLOR = DIA.alert;
const MUTED_COLOR = DIA.muted;
const INK_COLOR = DIA.text;

const labels = {
  valid: "Function",
  partial: "Missing input",
  multi: "Two outputs",
  B: "Subset B",
  C: "Subset C",
  A: "A subset X",
  S: "S subset X",
  bijective: "Bijective",
  notBijective: "Not bijective",
};

const descriptions: Record<FunctionNode, string> = {
  function: "A function is total and single-valued: every input has exactly one outgoing arrow.",
  image_of_function: "The image is the part of the codomain actually hit by selected inputs.",
  preimage: "The preimage pulls a subset of the codomain back to all inputs landing inside it.",
  inverse_of_function: "The inverse relation reverses arrows; it is a function only in the bijective case.",
  restriction_of_function: "A restriction keeps the same rule and discards inputs outside the chosen subset.",
  domain: "The domain is the whole input side: every element there must have a function value.",
  codomain: "The codomain is the declared target side; the image may occupy only part of it.",
};

function nodeKind(nodeId: string): FunctionNode {
  if (
    nodeId === "image_of_function" ||
    nodeId === "preimage" ||
    nodeId === "inverse_of_function" ||
    nodeId === "restriction_of_function" ||
    nodeId === "domain" ||
    nodeId === "codomain"
  ) {
    return nodeId;
  }
  return "function";
}

function defaultChoice(kind: FunctionNode): Choice {
  if (kind === "inverse_of_function") return "bijective";
  if (kind === "restriction_of_function") return "A";
  if (kind === "domain" || kind === "codomain") return "valid";
  if (kind === "function") return "valid";
  return "B";
}

function choicesFor(kind: FunctionNode): Choice[] {
  if (kind === "domain" || kind === "codomain") return ["valid"];
  if (kind === "function") return ["valid", "partial", "multi"];
  if (kind === "inverse_of_function") return ["bijective", "notBijective"];
  if (kind === "restriction_of_function") return ["A", "S"];
  return ["B", "C"];
}

function points(count: number, x: number): Vec2[] {
  return Array.from({ length: count }, (_, i) => [x, ((count - 1) / 2 - i) * 0.68]);
}

function arrowHead(from: Vec2, to: Vec2): Vec2[] {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const tip: Vec2 = [to[0] - 0.13 * ux, to[1] - 0.13 * uy];
  const base: Vec2 = [to[0] - 0.34 * ux, to[1] - 0.34 * uy];

  return [
    tip,
    [base[0] + 0.11 * px, base[1] + 0.11 * py],
    [base[0] - 0.11 * px, base[1] - 0.11 * py],
  ];
}

function SetOval({
  x,
  label,
  color = DOMAIN_COLOR,
}: {
  x: number;
  label: string;
  color?: string;
}) {
  return (
    <>
      <Ellipse
        center={[x, 0]}
        radius={[0.78, 1.43]}
        color={color}
        fillOpacity={0.1}
        strokeOpacity={1}
        weight={2.2}
      />
      <LaTeX at={[x, 1.58]} tex={label} color={INK_COLOR} />
    </>
  );
}

function SelectionBlob({
  points,
  side,
  color,
  label,
}: {
  points: Vec2[];
  side: "left" | "right";
  color: string;
  label?: string;
}) {
  const yValues = points.map(([, y]) => y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const x = points[0]?.[0] ?? 0;
  const yCenter = (minY + maxY) / 2;
  const yRadius = Math.max(0.32, (maxY - minY) / 2 + 0.28);
  const xRadius = side === "left" ? 0.45 : 0.48;

  return (
    <>
      <Ellipse
        center={[x, yCenter]}
        radius={[xRadius, yRadius]}
        color={color}
        fillOpacity={0.16}
        strokeOpacity={0.95}
        weight={1.7}
      />
      {label && (
        <LaTeX
          at={[side === "left" ? x - xRadius - 0.34 : x + xRadius + 0.34, yCenter]}
          tex={label}
          color={color}
        />
      )}
    </>
  );
}

function Control({
  choices,
  value,
  onChange,
}: {
  choices: Choice[];
  value: Choice;
  onChange: (choice: Choice) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Figure case"
      className="mt-2.5 inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border p-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {choices.map((choice) => {
        const active = choice === value;
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(choice)}
            className="rounded-[var(--radius-sm)] px-2.5 py-1 text-ui-meta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-2)]"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-fg, #fff)" : "var(--fg-2)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {labels[choice]}
          </button>
        );
      })}
    </div>
  );
}

function FunctionDiagram({ kind, choice }: { kind: FunctionNode; choice: Choice }) {
  const left = useMemo(() => points(4, LEFT_X), []);
  const right = useMemo(() => points(4, RIGHT_X), []);
  const targets = choice === "notBijective" ? [0, 1, 1, 2] : [0, 1, 2, 3];
  const selectedLeft =
    kind === "restriction_of_function"
      ? choice === "S"
        ? [1, 2]
        : [0, 1, 2]
      : kind === "image_of_function"
        ? choice === "C"
          ? [1, 3]
          : [0, 1, 2]
        : [];
  const selectedRight =
    kind === "preimage"
      ? choice === "C"
        ? [0, 3]
        : [1, 2]
      : kind === "image_of_function"
        ? selectedLeft.map((i) => targets[i])
        : [];
  const pulledBack =
    kind === "preimage"
      ? targets.flatMap((target, i) => (selectedRight.includes(target) ? [i] : []))
      : [];
  const activeLeft = kind === "preimage" ? pulledBack : selectedLeft;
  const highlightedLeft = kind === "domain" ? [0, 1, 2, 3] : activeLeft;
  const highlightedRight = kind === "codomain" ? [0, 1, 2, 3] : selectedRight;
  const omitted = choice === "partial" ? new Set([3]) : new Set<number>();
  const hitCounts = right.map((_, i) => targets.filter((target) => target === i).length);

  // Name the highlighted subset so the picture reads on its own, not just via
  // the caption. The whole-set highlights (domain/codomain) stay unlabeled
  // because the surrounding oval already carries X / Y.
  const leftLabel =
    kind === "restriction_of_function"
      ? choice === "S"
        ? "S"
        : "A"
      : kind === "image_of_function"
        ? "A"
        : undefined;
  const rightLabel = kind === "preimage" ? "B" : undefined;

  return (
    <FigureFrame xDomain={[-4.2, 4.2]} yDomain={[-1.82, 1.82]} height={180} axes={false} grid>
      <SetOval x={LEFT_X} label="X" />
      <SetOval x={RIGHT_X} label="Y" color={CODOMAIN_COLOR} />

      {highlightedLeft.length > 0 && (
        <SelectionBlob
          points={highlightedLeft.map((i) => left[i])}
          side="left"
          color={DOMAIN_COLOR}
          label={leftLabel}
        />
      )}
      {highlightedRight.length > 0 && (
        <SelectionBlob
          points={highlightedRight.map((i) => right[i])}
          side="right"
          color={CODOMAIN_COLOR}
          label={rightLabel}
        />
      )}

      {targets.map((target, i) => {
        if (omitted.has(i)) return null;
        const from = left[i];
        const to = right[target];
        const inactive =
          kind === "restriction_of_function" && activeLeft.length > 0 && !activeLeft.includes(i);
        const duplicate = kind === "function" && choice === "multi" && i === 2;
        const color = inactive ? MUTED_COLOR : duplicate ? SELECTED_COLOR : DOMAIN_COLOR;
        return (
          <g key={`arrow:${i}:${target}`}>
            <Line.Segment point1={from} point2={to} color={color} weight={inactive ? 0.9 : 1.5} opacity={inactive ? 0.5 : 1} />
            <Polygon points={arrowHead(from, to)} color={color} />
            {kind === "inverse_of_function" && (
              <Line.Segment
                point1={[to[0], to[1] - 0.12]}
                point2={[from[0], from[1] - 0.12]}
                color={CODOMAIN_COLOR}
                weight={1}
                style="dashed"
              />
            )}
          </g>
        );
      })}

      {choice === "multi" && (
        <>
          <Line.Segment point1={left[2]} point2={right[0]} color={SELECTED_COLOR} weight={1.5} />
          <Polygon points={arrowHead(left[2], right[0])} color={SELECTED_COLOR} />
        </>
      )}

      {left.map(([x, y], i) => (
        <g key={`left:${i}`}>
          <Point
            x={x}
            y={y}
            color={omitted.has(i) ? SELECTED_COLOR : highlightedLeft.includes(i) ? DOMAIN_COLOR : INK_COLOR}
            svgCircleProps={{ r: highlightedLeft.includes(i) ? 4.2 : 3.6 }}
          />
          <Text x={x - 0.42} y={y + 0.02} color={INK_COLOR} size={10}>
            {["a", "b", "c", "d"][i]}
          </Text>
        </g>
      ))}

      {right.map(([x, y], i) => (
        <g key={`right:${i}`}>
          <Point
            x={x}
            y={y}
            color={highlightedRight.includes(i) ? CODOMAIN_COLOR : hitCounts[i] === 0 ? MUTED_COLOR : INK_COLOR}
            svgCircleProps={{ r: highlightedRight.includes(i) ? 4.2 : hitCounts[i] === 0 ? 3 : 3.6 }}
          />
          <Text x={x + 0.42} y={y + 0.02} color={INK_COLOR} size={10}>
            {["u", "v", "w", "z"][i]}
          </Text>
        </g>
      ))}

      <LaTeX
        at={[0, 1.42]}
        color={DOMAIN_COLOR}
        tex={kind === "inverse_of_function" ? String.raw`f\text{ and }f^{-1}` : kind === "restriction_of_function" ? String.raw`f|_A` : String.raw`f`}
      />
      {kind === "preimage" && (
        <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`f^{-1}(B)=\{x:f(x)\in B\}`} />
      )}
      {kind === "image_of_function" && (
        <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`f(A)=\{f(a):a\in A\}`} />
      )}
      {kind === "domain" && (
        <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`\operatorname{dom}(f)=X`} />
      )}
      {kind === "codomain" && (
        <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`\operatorname{cod}(f)=Y`} />
      )}
    </FigureFrame>
  );
}

export default function FunctionSetFigure({ nodeId }: FigureProps) {
  const kind = nodeKind(nodeId);
  const [choice, setChoice] = useState<Choice>(() => defaultChoice(kind));
  const choices = choicesFor(kind);

  return (
    <figure className="m-0">
      <FunctionDiagram kind={kind} choice={choice} />
      {choices.length > 1 && <Control choices={choices} value={choice} onChange={setChoice} />}
      <figcaption className="mt-1.5 text-ui-meta" style={{ color: "var(--fg-3)" }}>
        {descriptions[kind]}
      </figcaption>
    </figure>
  );
}
