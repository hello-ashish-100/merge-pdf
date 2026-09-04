import { DARK_MODE_MEDIA_QUERY } from "../constants/theme";
import type { ResolvedTheme, ThemePreference } from "../types/theme";
import {
  applyTheme,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "./theme";

export interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

const listeners = new Set<() => void>();

const createState = (preference: ThemePreference): ThemeState => ({
  preference,
  resolved: resolveTheme(preference, getSystemTheme()),
});

let state: ThemeState = createState(readStoredTheme());

applyTheme(state.resolved);

const setState = (preference: ThemePreference): void => {
  const next = createState(preference);

  if (
    next.preference === state.preference &&
    next.resolved === state.resolved
  ) {
    return;
  }

  state = next;

  applyTheme(state.resolved);
  listeners.forEach((listener) => listener());
};

window
  .matchMedia(DARK_MODE_MEDIA_QUERY)
  .addEventListener("change", () => setState(state.preference));

export const getThemeSnapshot = (): ThemeState => state;

export const subscribeToTheme = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const setThemePreference = (preference: ThemePreference): void => {
  writeStoredTheme(preference);
  setState(preference);
};
