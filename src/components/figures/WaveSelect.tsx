import { type WaveKind } from "../../lib/figures/fourierMath";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";

const OPTIONS: ReadonlyArray<SegmentOption<WaveKind>> = [
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
  { value: "triangle", label: "Triangle" },
];

/** Compact segmented control for picking which target waveform a figure draws. */
export function WaveSelect({ value, onChange }: { value: WaveKind; onChange: (k: WaveKind) => void }) {
  return <SegmentedControl value={value} options={OPTIONS} onChange={onChange} ariaLabel="Target waveform" />;
}
