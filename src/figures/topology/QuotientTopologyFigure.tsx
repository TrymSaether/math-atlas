import { useMemo, useState } from "react";

import { MathText } from "@/math/MathText";
import { FigureCaption } from "../core/FigureFrame";
import { RangeControl } from "../core/RangeControl";
import { DIA, UI } from "../core/tokens";
import type { FigureProps } from "../core/types";

const INTERVAL_START = 58;
const INTERVAL_END = 255;
const CIRCLE_X = 430;
const CIRCLE_Y = 124;
const CIRCLE_RADIUS = 70;

export default function QuotientTopologyFigure(_props: FigureProps) {
  const [t, setT] = useState(0.18);
  const intervalX = INTERVAL_START + (INTERVAL_END - INTERVAL_START) * t;
  const circlePoint = useMemo(
    () => ({
      x: CIRCLE_X + CIRCLE_RADIUS * Math.cos(2 * Math.PI * t),
      y: CIRCLE_Y - CIRCLE_RADIUS * Math.sin(2 * Math.PI * t),
    }),
    [t],
  );

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-md border" style={{ borderColor: DIA.border, background: DIA.frame }}>
        <svg
          viewBox="0 0 540 255"
          className="block h-auto w-full"
          role="img"
          aria-label="The quotient map from the unit interval with endpoints identified to the circle"
        >
          <text x="156" y="32" textAnchor="middle" fill={DIA.muted} fontSize="12">
            [0,1]
          </text>
          <line x1={INTERVAL_START} y1="124" x2={INTERVAL_END} y2="124" stroke={DIA.ink} strokeWidth="3" />
          <line
            x1={INTERVAL_START}
            y1="124"
            x2="91"
            y2="124"
            stroke={DIA.codomain}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="222"
            y1="124"
            x2={INTERVAL_END}
            y2="124"
            stroke={DIA.codomain}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={INTERVAL_START} cy="124" r="7" fill={DIA.alert} />
          <circle cx={INTERVAL_END} cy="124" r="7" fill={DIA.alert} />
          <circle cx={intervalX} cy="124" r="6" fill={DIA.accent} stroke={DIA.frame} strokeWidth="2" />
          <text x={INTERVAL_START} y="151" textAnchor="middle" fill={DIA.ink} fontSize="11">
            0
          </text>
          <text x={INTERVAL_END} y="151" textAnchor="middle" fill={DIA.ink} fontSize="11">
            1
          </text>
          <path d="M 288 124 L 335 124" stroke={DIA.muted} strokeWidth="2" />
          <path d="M 335 124 L 326 118 L 326 130 Z" fill={DIA.muted} />
          <text x="311" y="108" textAnchor="middle" fill={DIA.muted} fontSize="12" fontStyle="italic">
            q
          </text>

          <circle cx={CIRCLE_X} cy={CIRCLE_Y} r={CIRCLE_RADIUS} fill="none" stroke={DIA.ink} strokeWidth="3" />
          <path
            d="M 489.7 87.4 A 70 70 0 0 1 489.7 160.6"
            fill="none"
            stroke={DIA.codomain}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={CIRCLE_X + CIRCLE_RADIUS} cy={CIRCLE_Y} r="7" fill={DIA.alert} />
          <circle cx={circlePoint.x} cy={circlePoint.y} r="6" fill={DIA.accent} stroke={DIA.frame} strokeWidth="2" />
          <text x="430" y="32" textAnchor="middle" fill={DIA.muted} fontSize="12">
            [0,1] / 0∼1 ≅ S¹
          </text>
          <text x="500" y="78" fill={DIA.codomain} fontSize="12" fontStyle="italic">
            U
          </text>
          <text x="156" y="183" textAnchor="middle" fill={DIA.codomain} fontSize="11">
            q⁻¹(U)
          </text>
          <text x="270" y="229" textAnchor="middle" fill={DIA.muted} fontSize="11">
            the two red endpoints become one point
          </text>
        </svg>
      </div>
      <RangeControl
        min={0}
        max={1}
        step={0.01}
        value={t}
        onChange={setT}
        label={`t = ${t.toFixed(2)}`}
        ariaLabel="Point on the quotient interval"
      />
      <FigureCaption className="space-y-0.5">
        <div className="font-medium" style={{ color: UI.text }}>
          <MathText text={String.raw`The quotient map glues $0\sim1$ and sends $t$ to $q(t)=e^{2\pi i t}$.`} />
        </div>
        <MathText
          text={String.raw`An arc $U\subseteq S^1$ is open exactly when its full preimage $q^{-1}(U)$ is open in $[0,1]$.`}
        />
      </FigureCaption>
    </figure>
  );
}
