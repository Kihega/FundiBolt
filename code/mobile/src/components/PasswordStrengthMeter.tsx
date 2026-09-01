import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { getPasswordStrength, PASSWORD_STRENGTH_LABELS } from "../utils/passwordStrength";

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  if (!password) return null;

  const score = getPasswordStrength(password);
  const percent = (score / 4) * 100;
  const barColor = score <= 1 ? colors.error : score === 2 ? colors.warning : colors.success;

  return (
    <View style={{ marginTop: -6, marginBottom: 12 }}>
      <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.full }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: barColor, borderRadius: radius.full }]} />
      </View>
      <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 4 }}>
        {PASSWORD_STRENGTH_LABELS[score]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, width: "100%", overflow: "hidden" },
  fill: { height: 6 },
});
