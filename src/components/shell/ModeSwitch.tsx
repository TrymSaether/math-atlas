import { Compass, Route } from "lucide-react";
import { useStore, type AtlasMode } from "../../store";
import { Surface } from "@/design";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MODES = [
  { id: "explore", label: "Explore", Icon: Compass },
  { id: "paths", label: "Paths", Icon: Route },
] as const;

/**
 * The prominent mode switch: free graph Explore vs guided Paths — a floating
 * glass segmented control, bottom-center over the canvas.
 */
export function ModeSwitch() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  return (
    <div className="absolute bottom-[var(--shell-edge)] left-1/2 z-(--z-shell) -translate-x-1/2">
      <Surface material="regular" className="rounded-full p-1">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as AtlasMode)}
          aria-label="Atlas mode"
          className="gap-0.5"
        >
          {MODES.map(({ id, label, Icon }) => (
            <ToggleGroupItem
              key={id}
              value={id}
              className="gap-1.5 rounded-full px-4 text-footnote font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              <Icon className="size-4" /> {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Surface>
    </div>
  );
}
