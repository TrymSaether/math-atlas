import { useState } from "react";

import { MathText } from "@/math/MathText";
import { FigureCaption } from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";
import { SegmentedControl } from "../core/SegmentedControl";
import { DIA, UI } from "../core/tokens";
import type { FigureProps } from "../core/types";

type Mode = "connected" | "separated" | "path";

interface Point {
  x: number;
  y: number;
}

const START: Point = { x: 132, y: 163 };
const CONTROL_1: Point = { x: 205, y: 52 };
const CONTROL_2: Point = { x: 333, y: 224 };
const END: Point = { x: 415, y: 105 };

function cubicPoint(t: number): Point {
  const s = 1 - t;
  return {
    x: s ** 3 * START.x + 3 * s ** 2 * t * CONTROL_1.x + 3 * s * t ** 2 * CONTROL_2.x + t ** 3 * END.x,
    y: s ** 3 * START.y + 3 * s ** 2 * t * CONTROL_1.y + 3 * s * t ** 2 * CONTROL_2.y + t ** 3 * END.y,
  };
}

const COPY: Record<Mode, { main: string; note: string }> = {
  connected: {
    main: "Connected: the space is one topological piece.",
    note: String.raw`There is no separation $X=U\sqcup V$ by nonempty open sets.`,
  },
  separated: {
    main: String.raw`Disconnected: $X=U\sqcup V$ is an open separation.`,
    note: String.raw`Both $U$ and $V$ are nonempty, open in $X$, and disjoint.`,
  },
  path: {
    main: String.raw`A path $\gamma:[0,1]\to X$ joins $x$ to $y$.`,
    note: String.raw`Here $\gamma(0)=x$ and $\gamma(1)=y$; path-connectedness requires such a path for every pair.`,
  },
};

function ConnectedShape() {
  return (
    <path
      d="M 72 145 C 55 78 122 35 196 56 C 246 18 328 35 351 72 C 423 50 479 95 458 151 C 487 202 423 245 356 226 C 302 258 221 242 198 215 C 123 239 60 205 72 145 Z"
      fill={DIA.fillX}
      stroke={DIA.accent}
      strokeWidth="2"
    />
  );
}

function ConnectednessDiagram({ mode, t }: { mode: Mode; t: number }) {
  const point = cubicPoint(t);

  return (
    <svg
      viewBox="0 0 530 275"
      className="block h-auto w-full"
      role="img"
      aria-label={
        mode === "path"
          ? "A continuous path joining two points in a topological space"
          : mode === "separated"
            ? "A disconnected space split into two disjoint open pieces"
            : "A connected topological space drawn as one piece"
      }
    >
      {mode === "separated" ? (
        <>
          <path
            d="M 52 142 C 42 77 98 43 159 60 C 210 40 250 82 237 134 C 255 190 206 229 151 214 C 91 231 43 198 52 142 Z"
            fill={DIA.fillX}
            stroke={DIA.accent}
            strokeWidth="2"
          />
          <path
            d="M 294 137 C 279 80 326 42 390 60 C 450 42 493 87 477 143 C 492 199 441 230 387 214 C 327 233 280 196 294 137 Z"
            fill={DIA.fillY}
            stroke={DIA.codomain}
            strokeWidth="2"
          />
          <text x="145" y="140" textAnchor="middle" fill={DIA.ink} fontSize="16" fontStyle="italic">
            U
          </text>
          <text x="390" y="140" textAnchor="middle" fill={DIA.ink} fontSize="16" fontStyle="italic">
            V
          </text>
          <text x="265" y="246" textAnchor="middle" fill={DIA.muted} fontSize="11">
            U ∩ V = ∅
          </text>
        </>
      ) : (
        <>
          <ConnectedShape />
          <text x="102" y="86" fill={DIA.muted} fontSize="12" fontStyle="italic">
            X
          </text>
          {mode === "connected" && (
            <>
              <circle cx="175" cy="142" r="5" fill={DIA.accent} />
              <circle cx="365" cy="145" r="5" fill={DIA.codomain} />
              <text x="175" y="162" textAnchor="middle" fill={DIA.muted} fontSize="11">
                one piece
              </text>
            </>
          )}
          {mode === "path" && (
            <>
              <path
                d={`M ${START.x} ${START.y} C ${CONTROL_1.x} ${CONTROL_1.y}, ${CONTROL_2.x} ${CONTROL_2.y}, ${END.x} ${END.y}`}
                fill="none"
                stroke={DIA.codomain}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx={START.x} cy={START.y} r="6" fill={DIA.accent} />
              <circle cx={END.x} cy={END.y} r="6" fill={DIA.accent} />
              <circle cx={point.x} cy={point.y} r="7" fill={DIA.alert} stroke={DIA.frame} strokeWidth="2" />
              <text x={START.x - 15} y={START.y + 22} fill={DIA.ink} fontSize="12" fontStyle="italic">
                x
              </text>
              <text x={END.x + 12} y={END.y - 10} fill={DIA.ink} fontSize="12" fontStyle="italic">
                y
              </text>
              <text x={point.x + 10} y={point.y - 10} fill={DIA.muted} fontSize="11">
                γ(t)
              </text>
            </>
          )}
        </>
      )}
    </svg>
  );
}

export default function ConnectednessFigure({ nodeId }: FigureProps) {
  const [mode, setMode] = useState<Mode>(() => (nodeId === "path_connectedness" ? "path" : "connected"));
  const [t, setT] = useState(0.42);
  const copy = COPY[mode];

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-md border" style={{ borderColor: DIA.border, background: DIA.frame }}>
        <ConnectednessDiagram mode={mode} t={t} />
      </div>
      <SegmentedControl<Mode>
        value={mode}
        options={[
          { value: "connected", label: "Connected" },
          { value: "separated", label: "Separation" },
          { value: "path", label: "Path" },
        ]}
        onChange={setMode}
        ariaLabel="Connectedness example"
      />
      {mode === "path" && (
        <RangeControl
          min={0}
          max={1}
          step={0.01}
          value={t}
          onChange={setT}
          label={`t = ${t.toFixed(2)}`}
          ariaLabel="Path parameter t"
        />
      )}
      <FigureCaption className="space-y-0.5">
        <div className="font-medium" style={{ color: UI.text }}>
          <MathText text={copy.main} />
        </div>
        <MathText text={copy.note} />
      </FigureCaption>
    </figure>
  );
}
