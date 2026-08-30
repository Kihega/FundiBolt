import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

// Tanzania-only for now (+255) - the app's initial market scope.
export default function PhoneInput({ label = "Phone Number", value, onChangeText, placeholder = "712 345 678" }: Props) {
  const { colors, fontFamily, fontSize, radius, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginBottom: spacing.xs }}>
        {label}
      </Text>
      <View style={[styles.wrapper, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
        <View style={styles.prefix}>
          <Text style={{ fontSize: 18 }}>🇹🇿</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, marginLeft: 6 }}>
            +255
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ""))}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          maxLength={9}
          style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.base }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, height: 50, paddingHorizontal: 14 },
  prefix: { flexDirection: "row", alignItems: "center" },
  divider: { width: 1, height: 24, marginHorizontal: 10 },
  input: { flex: 1 },
});
