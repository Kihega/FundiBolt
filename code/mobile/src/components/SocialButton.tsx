import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  provider: "google" | "apple";
  onPress: () => void;
};

// UI only for now - not wired to real Google/Apple OAuth yet.
export default function SocialButton({ provider, onPress }: Props) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  const label = provider === "google" ? "Google" : "Apple";
  const icon = provider === "google" ? "logo-google" : "logo-apple";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full }]}
    >
      <Ionicons name={icon as any} size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.sm }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderWidth: 1,
  },
});
