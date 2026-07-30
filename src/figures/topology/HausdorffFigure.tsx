import { useState } from "react";

import { MathText } from "@/math/MathText";
import { FigureCaption } from "../core/FigureFrame";
import { SegmentedControl } from "../core/SegmentedControl";
import { DIA, UI } from "../core/tokens";
import type { FigureProps } from "../core/types";

type Mode = "witness" | "sierpinski";

function HausdorffDiagram({ mode }: { mode: Mode }) {
  const witness = mode === "witness";

  return (
    <svg
      viewBox="0 0 530 270"
      className="block h-auto w-full"
      role="img"
      aria-label={
        witness
          ? "Distinct points with disjoint open neighborhoods"
          : "The Sierpinski space, whose two points cannot have disjoint neighborhoods"
      }
    >
      <path
        d="M 48 142 C 35 73 102 35 177 51 C 232 20 316 35 347 61 C 423 35 491 79 477 148 C 491 215 418 243 351 222 C 291 252 209 239 178 218 C 101 236 36 204 48 142 Z"
        fill={DIA.surface}
        stroke={DIA.ink}
        strokeWidth="1.5"
      />
      <text x="72" y="75" fill={DIA.muted} fontSize="12" fontStyle="italic">
        X
      </text>

      {witness ? (
        <>
          <ellipse cx="172" cy="145" rx="82" ry="64" fill={DIA.fillX} stroke={DIA.accent} strokeWidth="2" />
          <ellipse cx="366" cy="130" rx="78" ry="61" fill={DIA.fillY} stroke={DIA.codomain} strokeWidth="2" />
          <circle cx="172" cy="145" r="6" fill={DIA.accent} />
          <circle cx="366" cy="130" r="6" fill={DIA.codomain} />
          <text x="158" y="137" textAnchor="end" fill={DIA.ink} fontSize="13" fontStyle="italic">
            x
          </text>
          <text x="380" y="122" fill={DIA.ink} fontSize="13" fontStyle="italic">
            y
          </text>
          <text x="130" y="100" fill={DIA.accent} fontSize="13" fontStyle="italic">
            U
          </text>
          <text x="397" y="88" fill={DIA.codomain} fontSize="13" fontStyle="italic">
            V
          </text>
          <text x="268" y="238" textAnchor="middle" fill={DIA.muted} fontSize="11">
            U ∩ V = ∅
          </text>
        </>
      ) : (
        <>
          <path
            d="M 72 142 C 61 88 115 58 181 69 C 237 46 322 53 355 76 C 418 58 462 92 452 146 C 463 198 407 220 351 205 C 283 227 201 218 176 202 C 111 217 63 189 72 142 Z"
            fill={DIA.fillX}
            stroke={DIA.accent}
            strokeWidth="2.5"
          />
          <ellipse cx="350" cy="139" rx="76" ry="54" fill={DIA.fillY} stroke={DIA.codomain} strokeWidth="2.5" />
          <circle cx="178" cy="145" r="6" fill={DIA.accent} />
          <circle cx="350" cy="139" r="6" fill={DIA.codomain} />
          <text x="164" y="137" textAnchor="end" fill={DIA.ink} fontSize="13">
            0
          </text>
          <text x="364" y="131" fill={DIA.ink} fontSize="13">
            1
          </text>
          <text x="105" y="103" fill={DIA.accent} fontSize="12">
            U = X
          </text>
          <text x="380" y="102" fill={DIA.codomain} fontSize="12">
            V = {"{1}"}
          </text>
          <text x="268" y="255" textAnchor="middle" fill={DIA.alert} fontSize="11">
            every neighborhood of 0 meets every neighborhood of 1
          </text>
        </>
      )}
    </svg>
  );
}

export default function HausdorffFigure(_props: FigureProps) {
  const [mode, setMode] = useState<Mode>("witness");
  const witness = mode === "witness";

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-md border" style={{ borderColor: DIA.border, background: DIA.frame }}>
        <HausdorffDiagram mode={mode} />
      </div>
      <SegmentedControl<Mode>
        value={mode}
        options={[
          { value: "witness", label: String.raw`$T_2$ witness` },
          { value: "sierpinski", label: "Sierpiński failure" },
        ]}
        onChange={setMode}
        ariaLabel="Hausdorff property example"
      />
      <FigureCaption className="space-y-0.5">
        <div className="font-medium" style={{ color: UI.text }}>
          <MathText
            text={
              witness
                ? String.raw`For $x\ne y$, choose open $U\ni x$ and $V\ni y$ with $U\cap V=\varnothing$.`
                : String.raw`In $X=\{0,1\}$ with $\tau=\{\varnothing,\{1\},X\}$, the points cannot be separated.`
            }
          />
        </div>
        <MathText
          text={
            witness
              ? "Hausdorffness must provide such disjoint neighborhoods for every distinct pair."
              : String.raw`The only open neighborhood of $0$ is $X$, so it meets every neighborhood of $1$.`
          }
        />
      </FigureCaption>
    </figure>
  );
}
