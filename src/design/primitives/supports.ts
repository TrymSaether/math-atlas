/** Feature detection for the glass enhancement layer. */

/** True only where SVG displacement actually renders on a backdrop (Chromium). */
export function supportsDisplacement(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|chromium|android|crios|edg).)*safari/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  return !isSafari && !isFirefox && CSS.supports("backdrop-filter", "url(#_)");
}
