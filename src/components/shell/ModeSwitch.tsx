import { CompassIcon, PathIcon } from "@phosphor-icons/react";
import { useStore, type AtlasMode } from "../../store";
import { ShellSegmented, GlassControlGroup } from "./Controls";

const MODES: { id: AtlasMode; label: string; Icon: typeof CompassIcon }[] = [
  { id: "explore", label: "Explore", Icon: CompassIcon },
  { id: "paths", label: "Paths", Icon: PathIcon },
];

/**
 * The hybrid's prominent mode switch: free graph Explore vs guided Paths. A
 * floating Liquid Glass segmented control, bottom-center over the canvas.
 */
export function ModeSwitch() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  return (
    <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <GlassControlGroup className="p-0">
        <ShellSegmented
          label="Atlas mode"
          value={mode}
          onChange={setMode}
          options={MODES.map(({ id, label, Icon }) => ({
            id,
            label,
            icon: <Icon className="h-4 w-4" weight={mode === id ? "fill" : "regular"} />,
          }))}
        />
      </GlassControlGroup>
    </div>
  );
}
