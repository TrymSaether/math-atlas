import { useStore } from "../store";
import { Glass } from "./shell/Glass";
import { ShellButton } from "./shell/Controls";

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
      <Glass material="thick" className="flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-footnote text-fg-1">
        <span>A collaborator updated this map.</span>
        <ShellButton
          primary
          onClick={() => void reload()}
          className="h-8 justify-center rounded-full px-3 text-caption-2 font-medium text-fg-on-color"
        >
          Reload
        </ShellButton>
      </Glass>
    </div>
  );
}
