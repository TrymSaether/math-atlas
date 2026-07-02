import { useStore } from "../store";
import { Button } from "@/components/ui/button";
import { Surface } from "@/design";

/**
 * Shown when the active map changed on the server (a collaborator saved, or a
 * save conflicted). Offers to reload the fresh version — note this discards
 * unsaved local edits, which is the last-write-wins tradeoff.
 */
export function StaleMapBanner() {
  const staleMap = useStore((s) => s.staleMap);
  const mapId = useStore((s) => s.mapId);
  const reload = useStore((s) => s.reloadActiveMap);

  if (!staleMap || staleMap !== mapId) return null;

  return (
    <div className="pointer-events-auto fixed top-16 left-1/2 z-[var(--z-banner,60)] -translate-x-1/2">
      <Surface
        material="regular"
        className="flex items-center gap-3 rounded-full py-2 pr-2 pl-4 text-footnote text-foreground"
      >
        <span>A collaborator updated this map.</span>
        <Button size="sm" className="h-8 rounded-full" onClick={() => void reload()}>
          Reload
        </Button>
      </Surface>
    </div>
  );
}
