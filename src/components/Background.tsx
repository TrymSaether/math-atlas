/** Math Atlas is white-first: the page wash is a flat neutral surface and the
 *  graph itself is the only imagery. No gradients, glows, or textures. */
export function Background() {
  return <div className="pointer-events-none fixed inset-0 -z-10 bg-[var(--background)]" />;
}
