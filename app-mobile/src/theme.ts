import React from "react";
import { useColorScheme } from "react-native";
import { getString, setString, STORAGE_KEYS } from "./storage";

export type ThemePreference = "system" | "light" | "dark";

// Palette ported from the web app's CSS variables.
export const lightColors = {
  background: "#ffffff",
  card: "#f7f7f7",
  surface: "#ffffff",
  primaryText: "#ffffff",
  text: "#3c3c3c",
  textDim: "#777777",
  border: "#e5e5e5",
  blue: "#1cb0f6",
  blueDark: "#1899d6",
  blueLight: "#ddf4ff",
  green: "#58cc02",
  greenDark: "#58a700",
  greenLight: "#d7ffb8",
  red: "#ff4b4b",
  redLight: "#ffdfe0",
  gold: "#ffc800",
  goldDark: "#e6a800",
  disabled: "#afafaf",
  disabledBackground: "#e5e5e5",
  hiddenUnderline: "#4b4b4b",
};

export const darkColors: ThemeColors = {
  background: "#131f22",
  card: "#202f36",
  surface: "#131f22",
  primaryText: "#131f22",
  text: "#f1f7fb",
  textDim: "#c7d1d8",
  border: "#37464f",
  blue: "#49c0f8",
  blueDark: "#49c0f8",
  blueLight: "#202f36",
  green: "#58cc02",
  greenDark: "#79b933",
  greenLight: "#263b2e",
  red: "#ff6767",
  redLight: "#3b2428",
  gold: "#ffc800",
  goldDark: "#ffd84a",
  disabled: "#65727a",
  disabledBackground: "#26343a",
  hiddenUnderline: "#f1f7fb",
};

export type ThemeColors = typeof lightColors;

// Backwards-compatible default for files that have not been migrated yet.
export const colors = lightColors;

export const fontSizes = {
  body: 19,
  title: 25,
  small: 15,
};

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  ready: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  colors: lightColors,
  preference: "system",
  resolvedTheme: "light",
  ready: false,
  setPreference: () => Promise.resolve(),
});

function normalizeThemePreference(value: string | null): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = React.useState(false);
  const [preference, setPreferenceState] =
    React.useState<ThemePreference>("system");

  React.useEffect(() => {
    let cancelled = false;
    void getString(STORAGE_KEYS.themePreference).then((stored) => {
      if (cancelled) return;
      setPreferenceState(normalizeThemePreference(stored));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedTheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const setPreference = React.useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await setString(STORAGE_KEYS.themePreference, next);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedTheme === "dark" ? darkColors : lightColors,
      preference,
      ready,
      resolvedTheme,
      setPreference,
    }),
    [preference, ready, resolvedTheme, setPreference],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}
