import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
};

export default function Checkbox({ checked, onToggle, label }: Props) {
  const { colors, fontFamily, fontSize, radius } = useTheme();

  return (
    <TouchableOpacity onPress={onToggle} style={styles.row} activeOpacity={0.7}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : "transparent",
            borderRadius: radius.sm,
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: fontFamily.bodyRegular,
          fontSize: fontSize.sm,
          marginLeft: 8,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  box: { width: 20, height: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
