import { useCallback, useSyncExternalStore } from "react";

import {
  getThemeSnapshot,
  setThemePreference,
  subscribeToTheme,
} from "../lib/themeStore";
import type { ResolvedTheme, ThemePreference } from "../types/theme";

export interface UseThemeResult {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeResult => {
  const { preference, resolved } = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeSnapshot,
  );

  const setTheme = useCallback((next: ThemePreference) => {
    setThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(resolved === "dark" ? "light" : "dark");
  }, [resolved]);

  return { theme: preference, resolvedTheme: resolved, setTheme, toggleTheme };
};
