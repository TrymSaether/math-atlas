import { STORAGE_THEME_KEY } from "./constants";

type Theme = "light" | "dark";

function resolveTheme(value: string | null): Theme {
  if (value === "light" || value === "dark") return value;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function initTheme(button: HTMLButtonElement): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_THEME_KEY);
  } catch {
    stored = null;
  }

  applyTheme(resolveTheme(stored));

  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";

    applyTheme(next);

    try {
      localStorage.setItem(STORAGE_THEME_KEY, next);
    } catch {
      // Ignore private-mode/quota failures.
    }
  });
}
