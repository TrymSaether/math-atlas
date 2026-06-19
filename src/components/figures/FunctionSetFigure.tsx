import { useMemo, useState } from "react";

import {
  Arrow,
  DIA,
  DOT,
  Ellipse,
  FONT,
  FigureFrame,
  LaTeX,
  Line,
  Point,
  STROKE,
  Text,
  type Vec2,
} from "./FigureFrame";
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

function SetOval({ x, label, color = DOMAIN_COLOR }: { x: number; label: string; color?: string }) {
  return (
    <>
      <Ellipse
        center={[x, 0]}
        radius={[0.78, 1.43]}
        color={color}
        fillOpacity={0.1}
        strokeOpacity={1}
        weight={STROKE.ref}
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
        weight={STROKE.mark}
      />
      {label && (
        <LaTeX at={[side === "left" ? x - xRadius - 0.34 : x + xRadius + 0.34, yCenter]} tex={label} color={color} />
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
      className="mt-2.5 inline-flex flex-wrap gap-1 rounded-md border p-0.5"
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
            className="rounded-sm px-2.5 py-1 text-ui-meta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-2)]"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--fg-on-color)" : "var(--fg-2)",
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
    kind === "preimage" ? targets.flatMap((target, i) => (selectedRight.includes(target) ? [i] : [])) : [];
  const activeLeft = kind === "preimage" ? pulledBack : selectedLeft;
  const highlightedLeft = kind === "domain" ? [0, 1, 2, 3] : activeLeft;
  const highlightedRight = kind === "codomain" ? [0, 1, 2, 3] : selectedRight;
  const omitted = choice === "partial" ? new Set([3]) : new Set<number>();
  const hitCounts = right.map((_, i) => targets.filter((target) => target === i).length);

  // Name the highlighted subset so the picture reads on its own, not just via
  // the caption. The whole-set highlights (domain/codomain) stay unlabeled
  // because the surrounding oval already carries X / Y.
  const leftLabel =
    kind === "restriction_of_function" ? (choice === "S" ? "S" : "A") : kind === "image_of_function" ? "A" : undefined;
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

      {/* The inverse relation reverses each arrow; drawn first so the forward
          arrows sit on top of it. */}
      {kind === "inverse_of_function" &&
        targets.map((target, i) => (
          <Line.Segment
            key={`inv:${i}:${target}`}
            point1={[right[target][0], right[target][1] - 0.12]}
            point2={[left[i][0], left[i][1] - 0.12]}
            color={CODOMAIN_COLOR}
            weight={STROKE.guide}
            style="dashed"
          />
        ))}

      {targets.map((target, i) => {
        if (omitted.has(i)) return null;
        const inactive = kind === "restriction_of_function" && activeLeft.length > 0 && !activeLeft.includes(i);
        const duplicate = kind === "function" && choice === "multi" && i === 2;
        // Neutral connector by default; color only when the arrow is dropped
        // (restriction) or is the one breaking single-valuedness (two outputs).
        const color = inactive ? MUTED_COLOR : duplicate ? SELECTED_COLOR : DIA.ink;
        return (
          <Arrow
            key={`arrow:${i}:${target}`}
            from={left[i]}
            to={right[target]}
            color={color}
            weight={inactive ? STROKE.hair : STROKE.mark}
            opacity={inactive ? 0.5 : 1}
          />
        );
      })}

      {choice === "multi" && <Arrow from={left[2]} to={right[0]} color={SELECTED_COLOR} weight={STROKE.mark} />}

      {left.map(([x, y], i) => (
        <g key={`left:${i}`}>
          <Point
            x={x}
            y={y}
            color={omitted.has(i) ? SELECTED_COLOR : highlightedLeft.includes(i) ? DOMAIN_COLOR : INK_COLOR}
            svgCircleProps={{ r: highlightedLeft.includes(i) ? DOT.hub : DOT.base }}
          />
          <Text x={x - 0.42} y={y + 0.02} color={INK_COLOR} size={FONT.tick}>
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
            svgCircleProps={{
              r: highlightedRight.includes(i) ? DOT.hub : hitCounts[i] === 0 ? DOT.small : DOT.base,
            }}
          />
          <Text x={x + 0.42} y={y + 0.02} color={INK_COLOR} size={FONT.tick}>
            {["u", "v", "w", "z"][i]}
          </Text>
        </g>
      ))}

      <LaTeX
        at={[0, 1.42]}
        color={DOMAIN_COLOR}
        tex={
          kind === "inverse_of_function"
            ? String.raw`f\text{ and }f^{-1}`
            : kind === "restriction_of_function"
              ? String.raw`f|_A`
              : String.raw`f`
        }
      />
      {kind === "preimage" && <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`f^{-1}(B)=\{x:f(x)\in B\}`} />}
      {kind === "image_of_function" && (
        <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`f(A)=\{f(a):a\in A\}`} />
      )}
      {kind === "domain" && <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`\operatorname{dom}(f)=X`} />}
      {kind === "codomain" && <LaTeX at={[0, -1.48]} color={INK_COLOR} tex={String.raw`\operatorname{cod}(f)=Y`} />}
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
