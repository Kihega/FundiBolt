// FundiBolt color system - warm, minimal aesthetic.
// Cream/charcoal backgrounds, terracotta + amber accents, muted olive green
// as a nod to the original logo's green without going neon/techy.

export const darkColors = {
  background: "#211C17",
  backgroundElevated: "#2A241D",
  surface: "#2A241D",
  surfaceElevated: "#332C23",
  border: "#453C30",

  primary: "#D98E4A",       // warm amber
  primaryDark: "#B76E2F",
  secondary: "#8FA377",     // muted olive green
  secondaryDark: "#6B8256",
  accent: "#E0A868",        // soft amber highlight
  accentDark: "#C1633D",    // terracotta

  textPrimary: "#F5EFE6",
  textSecondary: "#C9BFAF",
  textMuted: "#8F8574",
  placeholder: "#8F8574",

  success: "#8FA377",
  error: "#D9714F",
  warning: "#E0B368",

  glowPrimary: "#E0A868",
  glowSecondary: "#D98E4A",
};

export const lightColors = {
  background: "#F7F3EC",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F0EAE0",
  border: "#E5DDD0",

  primary: "#C1633D",       // terracotta
  primaryDark: "#A34E2C",
  secondary: "#7A8B69",     // muted olive green
  secondaryDark: "#5C6B4E",
  accent: "#D98E4A",        // warm amber
  accentDark: "#B76E2F",

  textPrimary: "#2B241D",
  textSecondary: "#6B5F52",
  textMuted: "#9C9184",
  placeholder: "#9C9184",

  success: "#6B8F52",
  error: "#B3492F",
  warning: "#D9A441",

  glowPrimary: "#E8A868",
  glowSecondary: "#C1633D",
};

export type ThemeColors = typeof darkColors;
