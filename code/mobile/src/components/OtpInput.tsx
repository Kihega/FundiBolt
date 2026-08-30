import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  length?: number;
  onChange: (code: string) => void;
};

export default function OtpInput({ length = 4, onChange }: Props) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<Array<TextInput | null>>([]);

  function handleChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);
    onChange(next.join(""));
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(ref) => (inputs.current[i] = ref)}
          value={val}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          style={[
            styles.cell,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
              fontFamily: fontFamily.headingSemiBold,
              fontSize: fontSize.xl,
              borderRadius: radius.full,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  cell: {
    width: 60,
    height: 60,
    borderWidth: 1,
    textAlign: "center",
  },
});
