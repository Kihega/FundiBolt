import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-4
}

const LABELS = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  if (!password) return null;

  const score = getStrength(password);
  const percent = (score / 4) * 100;
  const barColor = score <= 1 ? colors.error : score === 2 ? colors.warning : colors.success;

  return (
    <View style={{ marginTop: -6, marginBottom: 12 }}>
      <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.full }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: barColor, borderRadius: radius.full }]} />
      </View>
      <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 4 }}>
        {LABELS[score]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, width: "100%", overflow: "hidden" },
  fill: { height: 6 },
});
