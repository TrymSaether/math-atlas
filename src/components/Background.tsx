import { useStore } from "../store";

/** Theme-aware backdrop: chalkboard grid (dark) or paper dots (light). */
export function Background() {
  const theme = useStore((s) => s.theme);
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 ${
        theme === "dark" ? "atlas-grid" : "atlas-dots"
      }`}
    />
  );
}
