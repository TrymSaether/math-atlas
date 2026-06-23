import { useMemo, useState } from "react";

import {
  Arrow,
  DIA,
  DOT,
  Ellipse,
  FONT,
  FigureCaption,
  FigureFrame,
  FunctionCurve,
  Line,
  Point,
  STROKE,
  Text,
  type Vec2,
} from "./FigureFrame";
import { RangeControl } from "./RangeControl";
import { type FigureProps } from "./types";

type MappingKind = "injective" | "surjective" | "bijective";

const DOMAIN_X = -3.1;
const CODOMAIN_X = 3.1;
const SET_RADIUS: Vec2 = [0.82, 1.62];

function kindFor(nodeId: string): MappingKind {
  if (nodeId === "surjective") return "surjective";
  if (nodeId === "bijective") return "bijective";
  return "injective";
}

function points(count: number, x: number): Vec2[] {
  return Array.from({ length: count }, (_, i) => [x, ((count - 1) / 2 - i) * 0.78]);
}

function mappingFor(
  kind: MappingKind,
  raw: number,
): {
  domainLabels: string[];
  codomainLabels: string[];
  targets: number[];
} {
  if (kind === "bijective") {
    const shift = raw % 4;
    return {
      domainLabels: ["a", "b", "c", "d"],
      codomainLabels: ["1", "2", "3", "4"],
      targets: [0, 1, 2, 3].map((i) => (i + shift) % 4),
    };
  }

  if (kind === "surjective") {
    const onto = raw >= 5;
    return {
      domainLabels: ["a", "b", "c", "d"],
      codomainLabels: ["u", "v", "w"],
      targets: onto ? [0, 1, 2, 2] : [0, 1, 1, 0],
    };
  }

  const collision = raw >= 6;
  return {
    domainLabels: ["a", "b", "c"],
    codomainLabels: ["u", "v", "w", "z"],
    targets: collision ? [0, 1, 1] : [0, 1, 2],
  };
}

function plotY(kind: MappingKind, raw: number, x: number): number {
  if (kind === "bijective") {
    return x + (raw - 1.5) * 0.18;
  }

  if (kind === "surjective") {
    // A wave whose amplitude is the "coverage": it is plainly non-injective
    // (many x share a y), and surjectivity is about whether it reaches the
    // outer band. At raw = 5 the amplitude just touches ±1.05 (the missed-value
    // lines); above that it covers the whole range.
    const amp = 0.55 + raw * 0.1;
    return amp * Math.sin(1.3 * x);
  }

  const bend = raw / 12;
  return x * x * x - 1.35 * bend * x;
}

function propertyText(kind: MappingKind, raw: number): string {
  if (kind === "bijective") return "one input, one output, and an inverse";
  if (kind === "surjective") return raw >= 5 ? "onto: every target is hit" : "not onto: one target is missed";
  return raw >= 6 ? "not injective: two arrows collide" : "injective: no arrows collide";
}

function controlLabel(kind: MappingKind, raw: number): string {
  if (kind === "bijective") return raw % 4 === 0 ? "identity" : "a permutation";
  if (kind === "surjective") return raw >= 5 ? "onto" : "misses a target";
  return raw >= 6 ? "a collision" : "no collisions";
}

function MappingPanel({ kind, raw }: { kind: MappingKind; raw: number }) {
  const model = useMemo(() => mappingFor(kind, raw), [kind, raw]);
  const left = useMemo(() => points(model.domainLabels.length, DOMAIN_X), [model.domainLabels.length]);
  const right = useMemo(() => points(model.codomainLabels.length, CODOMAIN_X), [model.codomainLabels.length]);
  const hitCounts = model.codomainLabels.map((_, i) => model.targets.filter((target) => target === i).length);

  return (
    <FigureFrame xDomain={[-4.15, 4.15]} yDomain={[-1.82, 1.82]} height={168} axes={false} grid>
      <Ellipse
        center={[DOMAIN_X, 0]}
        radius={SET_RADIUS}
        color={DIA.accent}
        fillOpacity={0.1}
        strokeOpacity={1}
        weight={STROKE.ref}
      />
      <Ellipse
        center={[CODOMAIN_X, 0]}
        radius={SET_RADIUS}
        color={DIA.codomain}
        fillOpacity={0.1}
        strokeOpacity={1}
        weight={STROKE.ref}
      />

      <Text x={DOMAIN_X} y={1.66} color={DIA.text} size={FONT.label}>
        X
      </Text>
      <Text x={CODOMAIN_X} y={1.66} color={DIA.text} size={FONT.label}>
        Y
      </Text>

      {kind === "bijective" &&
        model.targets.map((target, i) => (
          <Line.Segment
            key={`inverse:${i}:${target}`}
            point1={[right[target][0], right[target][1] - 0.12]}
            point2={[left[i][0], left[i][1] - 0.12]}
            color={DIA.codomain}
            weight={STROKE.hair}
            style="dashed"
          />
        ))}

      {model.targets.map((target, i) => {
        // The map itself is a neutral connector; color is reserved for the sets
        // (endpoint dots) and for a collision, which is the thing worth flagging.
        const collision = hitCounts[target] > 1;
        const color = collision && kind !== "surjective" ? DIA.alert : DIA.ink;
        return <Arrow key={`${i}:${target}`} from={left[i]} to={right[target]} color={color} weight={STROKE.mark} />;
      })}

      {left.map(([x, y], i) => (
        <g key={`left:${model.domainLabels[i]}`}>
          <Point x={x} y={y} color={DIA.text} svgCircleProps={{ r: DOT.base }} />
          <Text x={x - 0.42} y={y + 0.02} color={DIA.ref} size={FONT.tick}>
            {model.domainLabels[i]}
          </Text>
        </g>
      ))}

      {right.map(([x, y], i) => {
        const missed = hitCounts[i] === 0;
        return (
          <g key={`right:${model.codomainLabels[i]}`}>
            <Point
              x={x}
              y={y}
              color={missed ? DIA.muted : DIA.codomain}
              svgCircleProps={{ r: missed ? DOT.small : DOT.hub }}
            />
            <Text x={x + 0.42} y={y + 0.02} color={DIA.ref} size={FONT.tick}>
              {model.codomainLabels[i]}
            </Text>
          </g>
        );
      })}

      <Text x={0} y={1.5} color={DIA.accent} size={FONT.label}>
        f
      </Text>
    </FigureFrame>
  );
}

function PlotPanel({ kind, raw }: { kind: MappingKind; raw: number }) {
  return (
    <FigureFrame xDomain={[-2.4, 2.4]} yDomain={[-1.85, 1.85]} height={156} grid>
      {kind === "surjective" && raw < 5 && (
        <>
          <Line.Segment
            point1={[-2.4, 1.05]}
            point2={[2.4, 1.05]}
            color={DIA.muted}
            weight={STROKE.guide}
            style="dashed"
          />
          <Line.Segment
            point1={[-2.4, -1.05]}
            point2={[2.4, -1.05]}
            color={DIA.muted}
            weight={STROKE.guide}
            style="dashed"
          />
          <Text x={1.75} y={1.28} color={DIA.ref} size={FONT.hint}>
            missed values
          </Text>
        </>
      )}
      {kind === "injective" && raw >= 6 && (
        <Line.Segment point1={[-2.4, 0]} point2={[2.4, 0]} color={DIA.alert} weight={STROKE.guide} style="dashed" />
      )}
      {kind === "bijective" && (
        <FunctionCurve
          y={(x) => x - (raw - 1.5) * 0.18}
          domain={[-2.4, 2.4]}
          color={DIA.codomain}
          weight={STROKE.ref}
          opacity={1.0}
          style="dashed"
        />
      )}
      <FunctionCurve y={(x) => plotY(kind, raw, x)} domain={[-2.4, 2.4]} color={DIA.accent} weight={STROKE.curve} />
      <Text x={1.75} y={kind === "bijective" ? 1.4 : -1.42} color={DIA.ref} size={FONT.tick}>
        {kind === "bijective" ? "f and inverse" : "horizontal test"}
      </Text>
    </FigureFrame>
  );
}

export default function MappingPropertyFigure({ nodeId }: FigureProps) {
  const kind = kindFor(nodeId);
  const [raw, setRaw] = useState(() => (kind === "injective" ? 0 : kind === "surjective" ? 10 : 1));

  return (
    <figure className="m-0">
      <div className="space-y-2">
        <MappingPanel kind={kind} raw={raw} />
        <PlotPanel kind={kind} raw={raw} />
      </div>
      <RangeControl
        min={0}
        max={kind === "bijective" ? 3 : kind === "injective" ? 12 : 10}
        step={1}
        value={raw}
        onChange={setRaw}
        label={controlLabel(kind, raw)}
        ariaLabel={`${kind} mapping parameter`}
      />
      <FigureCaption>
        {propertyText(kind, raw)}. The lower plot shows the same idea with horizontal slices of a real-valued function.
      </FigureCaption>
    </figure>
  );
}
