import { applyTheme, readStoredTheme, THEMES } from "../lib/themes";

/**
 * The dictionary shares the atlas theme registry (src/lib/themes.ts). The theme
 * button cycles through the same set, and the choice persists under the shared
 * storage key, so the two pages stay in sync.
 */
export function initTheme(button: HTMLButtonElement): void {
  applyTheme(readStoredTheme());

  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme ?? THEMES[0].id;
    const index = THEMES.findIndex((t) => t.id === current);
    const next = THEMES[(index + 1) % THEMES.length];
    applyTheme(next.id);
    button.setAttribute("title", `Theme: ${next.label}`);
  });
}
