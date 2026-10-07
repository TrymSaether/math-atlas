import { CompassIcon, PathIcon } from "@phosphor-icons/react";
import { useStore, type AtlasMode } from "../../store";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";

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
      <Glass material="regular" className="shell-seg rounded-full" role="tablist" aria-label="Atlas mode">
        {MODES.map(({ id, label, Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn("shell-seg-opt", active && "is-active")}
              onClick={() => setMode(id)}
            >
              <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
              {label}
            </button>
          );
        })}
      </Glass>
    </div>
  );
}
