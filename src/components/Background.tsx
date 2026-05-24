/** Apple Maps–style canvas backdrop: warm off-white with a barely-there dot pattern. */
export function Background() {
  return (
    <div className="canvas-dots pointer-events-none fixed inset-0 -z-10" />
  );
}
