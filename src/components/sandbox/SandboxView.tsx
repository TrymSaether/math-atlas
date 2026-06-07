/**
 * Temporary placeholder. The old faked-topology Sandbox was removed; the new
 * workspace engine (Desmos/GeoGebra-like) is being built in its place.
 */
export function SandboxView() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pt-16 text-sm"
      style={{ background: "var(--bg)", color: "var(--fg-3)" }}
    >
      Sandbox — rebuilding…
    </div>
  );
}
