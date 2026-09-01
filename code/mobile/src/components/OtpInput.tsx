import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { mergeOtpDigits } from "../utils/otpPaste";

type Props = {
  length?: number;
  onChange: (code: string) => void;
};

// Assumed horizontal screen padding around the OTP row (matches the
// spacing.lg used on both sides of the auth screens) and a small gap
// allowance between cells, used to size cells so they always fit on
// screen regardless of how many digits the code has.
const ASSUMED_SIDE_PADDING = 48;
const ASSUMED_GAP = 8;
const MIN_CELL_SIZE = 40;
const MAX_CELL_SIZE = 60;

export default function OtpInput({ length = 6, onChange }: Props) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  const { width } = useWindowDimensions();
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<Array<TextInput | null>>([]);

  const availableWidth = width - ASSUMED_SIDE_PADDING;
  const rawCellSize = (availableWidth - ASSUMED_GAP * (length - 1)) / length;
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, Math.floor(rawCellSize)));

  // Handles both normal typing (a single digit) and pasting/autofilling a
  // full or partial code into any cell - mergeOtpDigits treats them the
  // same way, so a 6-digit clipboard paste or SMS autofill value lands
  // correctly across all the cells instead of being truncated to 1 digit.
  function handleChange(text: string, index: number) {
    const { values: next, nextFocusIndex } = mergeOtpDigits(values, text, index, length);
    setValues(next);
    onChange(next.join(""));

    if (nextFocusIndex === -1) {
      inputs.current[length - 1]?.blur();
    } else if (nextFocusIndex !== index) {
      inputs.current[nextFocusIndex]?.focus();
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
          ref={(ref) => {
            inputs.current[i] = ref;
          }}
          value={val}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length} // allow the full pasted string through onChangeText instead of truncating to 1 char
          textContentType={Platform.OS === "ios" ? "oneTimeCode" : undefined}
          autoComplete={Platform.OS === "android" ? "sms-otp" : undefined}
          importantForAutofill="yes"
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
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
    borderWidth: 1,
    textAlign: "center",
  },
});
