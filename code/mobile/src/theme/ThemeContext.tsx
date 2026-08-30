import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
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
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<"dark" | "light" | null>(null);

  const isDark = override ? override === "dark" : systemScheme !== "light";

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      fontFamily,
      fontSize,
      spacing,
      radius,
      isDark,
      toggleTheme: () => setOverride(isDark ? "light" : "dark"),
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
