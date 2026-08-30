import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "outline";
  style?: ViewStyle;
};

export default function GradientButton({ label, onPress, loading, variant = "primary", style }: Props) {
  const { colors, fontFamily, fontSize, radius, spacing } = useTheme();

  if (variant === "outline") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        style={[
          styles.outlineButton,
          { borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientButton, { borderRadius: radius.md, paddingVertical: spacing.md }]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
