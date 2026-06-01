import { schemeFor } from "../lib/themes";
import { useStore } from "../store";

/** Theme-aware backdrop: ruled grid (dark schemes) or dot grid (light). */
export function Background() {
  const theme = useStore((s) => s.theme);
  const showGrid = useStore((s) => s.showGrid);
  if (!showGrid) return null;
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 ${
        schemeFor(theme) === "dark" ? "atlas-grid" : "atlas-dots"
      }`}
    />
  );
}
