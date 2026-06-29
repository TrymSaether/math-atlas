import { BookOpenIcon, CardsIcon, CompassIcon, FunctionIcon, PathIcon } from "@phosphor-icons/react";
import { useStore, type AtlasMode, type Surface } from "../../store";
import { Glass, ShellIconButton, ShellSegmented } from "../primitives";

const MODES: { id: AtlasMode; label: string; Icon: typeof CompassIcon }[] = [
  { id: "explore", label: "Explore", Icon: CompassIcon },
  { id: "paths", label: "Paths", Icon: PathIcon },
];

const SURFACES: { id: Surface; label: string; Icon: typeof CompassIcon }[] = [
  { id: "atlas", label: "Atlas", Icon: CompassIcon },
  { id: "dictionary", label: "Index", Icon: BookOpenIcon },
  { id: "flashcards", label: "Study", Icon: CardsIcon },
  { id: "sandbox", label: "Sandbox", Icon: FunctionIcon },
];

/**
 * Primary application dock. Surface destinations behave like macOS app icons;
 * the contextual Atlas mode switch appears after a divider while the Atlas is
 * active.
 */
export function AppDock() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);

  return (
    <nav className="shell-mode-switch" aria-label="Application dock">
      <Glass material="regular" className="shell-app-dock">
        <div className="shell-dock-surfaces">
          {SURFACES.map(({ id, label, Icon }) => {
            const active = surface === id;
            return (
              <ShellIconButton
                key={id}
                size="large"
                variant="toggle"
                active={active}
                aria-pressed={active}
                aria-label={label}
                title={label}
                className="shell-dock-item"
                onClick={() => setSurface(id)}
              >
                <Icon className="shell-dock-icon" weight={active ? "fill" : "regular"} />
              </ShellIconButton>
            );
          })}
        </div>
        {surface === "atlas" && (
          <>
            <span className="shell-dock-divider" aria-hidden />
            <ShellSegmented
              label="Atlas mode"
              value={mode}
              onChange={setMode}
              size="large"
              className="shell-dock-modes"
              options={MODES.map(({ id, label, Icon }) => ({
                id,
                label,
                icon: <Icon className="shell-icon" weight="regular" />,
              }))}
            />
          </>
        )}
      </Glass>
    </nav>
  );
}
