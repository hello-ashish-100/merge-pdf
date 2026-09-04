import {
  DARK_CLASS_NAME,
  DARK_MODE_MEDIA_QUERY,
  THEME_STORAGE_KEY,
} from "../constants/theme";
import type { ResolvedTheme, ThemePreference } from "../types/theme";

const THEME_PREFERENCES: ThemePreference[] = ["light", "dark", "system"];

const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.includes(value as ThemePreference);

export const readStoredTheme = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

export const writeStoredTheme = (preference: ThemePreference): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {}
};

export const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? "dark" : "light";

export const resolveTheme = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme => (preference === "system" ? systemTheme : preference);

export const applyTheme = (theme: ResolvedTheme): void => {
  const root = document.documentElement;

  root.classList.toggle(DARK_CLASS_NAME, theme === "dark");
  root.style.colorScheme = theme;
};
