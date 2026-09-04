import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  /** Overrides the translated default placeholder if provided. */
  placeholder?: string;
};

// Sits directly under the top bar, per the approved wireframe. This is how
// the customer looks a technician up by name/trade whenever the map has
// nobody nearby to show as cards (see MapSection's Case 2) - wiring it to
// real search results is a follow-up once that endpoint exists (see
// services/technicians.ts).
export default function SearchBar({ value, onChangeText, onSubmit, placeholder }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radius.full,
          marginHorizontal: spacing.lg,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder ?? t("search.placeholder")}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", height: 44, borderWidth: 1, marginBottom: 12 },
  input: { flex: 1, marginLeft: 8, height: "100%" },
});
