import { CompassIcon, PathIcon } from "@phosphor-icons/react";
import { useStore, type AtlasMode } from "../../store";
import { ShellSegmented, GlassControlGroup } from "../primitives";

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
    <div className="shell-mode-switch">
      <GlassControlGroup className="shell-mode-island">
        <ShellSegmented
          label="Atlas mode"
          value={mode}
          onChange={setMode}
          options={MODES.map(({ id, label, Icon }) => ({
            id,
            label,
            icon: <Icon className="shell-icon" weight="regular" />,
          }))}
        />
      </GlassControlGroup>
    </div>
  );
}
