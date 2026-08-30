// FundiBolt color system - purple/violet dark theme.

export const darkColors = {
  background: "#0B0A14",
  backgroundGradientTop: "#1B1030",
  backgroundElevated: "#120E24",
  surface: "#17151F",
  surfaceElevated: "#1F1C2C",
  border: "#2A273A",

  primary: "#7C5CFC",
  primaryDark: "#5F3FE0",
  secondary: "#9B8AFB",
  secondaryDark: "#7C5CFC",
  accent: "#B497FF",
  accentDark: "#8A72F2",

  textPrimary: "#FFFFFF",
  textSecondary: "#A8A3B8",
  textMuted: "#6E6980",
  placeholder: "#6E6980",

  success: "#4CAF50",
  error: "#E5484D",
  warning: "#F5A623",

  glowPrimary: "#7C5CFC",
  glowSecondary: "#9B8AFB",
};

export const lightColors = {
  background: "#F5F3FB",
  backgroundGradientTop: "#EDE8FB",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#EDEAFB",
  border: "#DCD6F0",

  primary: "#6C4CE0",
  primaryDark: "#5433C4",
  secondary: "#8A72F2",
  secondaryDark: "#6C4CE0",
  accent: "#A98BFF",
  accentDark: "#8A72F2",

  textPrimary: "#161320",
  textSecondary: "#5B5570",
  textMuted: "#8C86A0",
  placeholder: "#8C86A0",

  success: "#2E7D32",
  error: "#C62828",
  warning: "#B8860B",

  glowPrimary: "#8A72F2",
  glowSecondary: "#6C4CE0",
};

export type ThemeColors = typeof darkColors;
