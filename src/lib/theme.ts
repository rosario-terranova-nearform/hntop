import { getStoredTheme, type Theme } from "@/lib/preferences";

export function resolveTheme(): Theme {
  return getStoredTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
