import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
};

export default function InputField({ label, icon, isPassword, ...rest }: Props) {
  const { colors, fontFamily, fontSize, radius, spacing } = useTheme();
  const [secure, setSecure] = useState(!!isPassword);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginBottom: spacing.xs }}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />}
        <TextInput
          {...rest}
          secureTextEntry={secure}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.textPrimary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.base }]}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
  },
});
