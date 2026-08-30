import React, { createContext, useContext, useMemo, useState } from "react";
import { darkColors, lightColors, ThemeColors } from "./colors";
import { fontFamily, fontSize, spacing, radius } from "./typography";

type ThemeContextValue = {
  colors: ThemeColors;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  radius: typeof radius;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Forced dark by default, regardless of the device's system theme setting.
  // Still toggleable later via toggleTheme() once a settings screen exists.
  const [mode, setMode] = useState<"dark" | "light">("dark");

  const isDark = mode === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      fontFamily,
      fontSize,
      spacing,
      radius,
      isDark,
      toggleTheme: () => setMode(isDark ? "light" : "dark"),
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
