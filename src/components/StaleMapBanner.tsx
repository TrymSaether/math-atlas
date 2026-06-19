import { useStore } from "../store";
import { Button } from "./chrome/Button";

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
    <div className="pointer-events-auto fixed left-1/2 top-16 z-50 -translate-x-1/2">
      <div className="map-popover flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-ui-control text-fg-1 shadow-(--shadow-3)">
        <span>A collaborator updated this map.</span>
        <Button
          kind="field"
          accent
          onClick={() => void reload()}
          className="h-8 justify-center rounded-full px-3 text-ui-hint font-medium text-fg-on-color"
        >
          Reload
        </Button>
      </div>
    </div>
  );
}
