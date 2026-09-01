#!/usr/bin/env python3
"""
FundiBolt patch 10 - Fix mobile typecheck errors
--------------------------------------------------------------------------
Your `npm run typecheck` output had two distinct problems:

1. "Cannot find module '@expo/vector-icons'" (7 files)
   This is a PRE-EXISTING gap, not something introduced by earlier
   patches - Checkbox.tsx, InputField.tsx, and SocialButton.tsx were
   already importing @expo/vector-icons before any of this work, it was
   just never listed in package.json's dependencies, so it only surfaced
   now that typecheck is actually being run.

   This script deliberately does NOT edit package.json to add it,
   because Expo pins companion package versions tightly to your exact
   SDK version (54.0.36 here), and guessing a version number risks
   installing one that mismatches your SDK and breaks things worse. The
   correct, Expo-official way to add it is:

       cd code/mobile
       npx expo install @expo/vector-icons

   That command resolves and installs the exact version compatible with
   your installed Expo SDK, and updates package.json for you.

2. OtpInput.tsx ref callback type error
   ref={(ref) => (inputs.current[i] = ref)} - written as a parenthesized
   expression, this arrow function's implicit return value is whatever
   the assignment evaluates to (TextInput | null). Newer @types/react
   requires ref callbacks to return void (or a cleanup function), so it
   was rejected. Fixed by using a block body so nothing is returned.
   This script DOES fix this one directly, since it is a pure code
   change with no dependency/version guessing involved.
     - code/mobile/src/components/OtpInput.tsx

Run this from the project root (the folder that contains the "code"
directory):

    python3 patch_10_mobile_typecheck_fixes.py

Then:
    cd code/mobile
    npx expo install @expo/vector-icons
    npm run typecheck
"""

import os
import sys

ROOT_MARKER = "code"

FILES = [
    (os.path.join("code", "mobile", "src", "components", "OtpInput.tsx"), "MOBILE_OTP_INPUT"),
]


def find_repo_root(start):
    cur = os.path.abspath(start)
    for _ in range(8):
        if os.path.isdir(os.path.join(cur, ROOT_MARKER)):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return None


def write_file(root, rel_path, content):
    target = os.path.join(root, rel_path)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated: " + rel_path.replace(os.sep, "/"))


def main():
    root = find_repo_root(os.getcwd()) or find_repo_root(os.path.dirname(os.path.abspath(__file__)))
    if root is None:
        print("ERROR: Could not find a 'code' directory to use as the project root.")
        print("Run this script from the project root (the folder containing the 'code' directory).")
        sys.exit(1)

    must_already_exist = [rel for rel, _ in FILES]
    missing = [p for p in must_already_exist if not os.path.isfile(os.path.join(root, p))]
    if missing:
        print("ERROR: expected file(s) not found (wrong project root?):")
        for p in missing:
            print("  " + p.replace(os.sep, "/"))
        sys.exit(1)

    for rel_path, content_key in FILES:
        write_file(root, rel_path, CONTENTS[content_key])

    print("")
    print("Done. One more manual step this script deliberately did NOT do for you")
    print("(see the file header for why):")
    print("")
    print("  cd code/mobile")
    print("  npx expo install @expo/vector-icons")
    print("  npm run typecheck")


CONTENTS = {
    'MOBILE_OTP_INPUT': 'import React, { useRef, useState } from "react";\nimport { View, TextInput, StyleSheet, useWindowDimensions, Platform } from "react-native";\nimport { useTheme } from "../theme/ThemeContext";\nimport { mergeOtpDigits } from "../utils/otpPaste";\n\ntype Props = {\n  length?: number;\n  onChange: (code: string) => void;\n};\n\n// Assumed horizontal screen padding around the OTP row (matches the\n// spacing.lg used on both sides of the auth screens) and a small gap\n// allowance between cells, used to size cells so they always fit on\n// screen regardless of how many digits the code has.\nconst ASSUMED_SIDE_PADDING = 48;\nconst ASSUMED_GAP = 8;\nconst MIN_CELL_SIZE = 40;\nconst MAX_CELL_SIZE = 60;\n\nexport default function OtpInput({ length = 6, onChange }: Props) {\n  const { colors, fontFamily, fontSize, radius } = useTheme();\n  const { width } = useWindowDimensions();\n  const [values, setValues] = useState<string[]>(Array(length).fill(""));\n  const inputs = useRef<Array<TextInput | null>>([]);\n\n  const availableWidth = width - ASSUMED_SIDE_PADDING;\n  const rawCellSize = (availableWidth - ASSUMED_GAP * (length - 1)) / length;\n  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, Math.floor(rawCellSize)));\n\n  // Handles both normal typing (a single digit) and pasting/autofilling a\n  // full or partial code into any cell - mergeOtpDigits treats them the\n  // same way, so a 6-digit clipboard paste or SMS autofill value lands\n  // correctly across all the cells instead of being truncated to 1 digit.\n  function handleChange(text: string, index: number) {\n    const { values: next, nextFocusIndex } = mergeOtpDigits(values, text, index, length);\n    setValues(next);\n    onChange(next.join(""));\n\n    if (nextFocusIndex === -1) {\n      inputs.current[length - 1]?.blur();\n    } else if (nextFocusIndex !== index) {\n      inputs.current[nextFocusIndex]?.focus();\n    }\n  }\n\n  function handleKeyPress(e: any, index: number) {\n    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {\n      inputs.current[index - 1]?.focus();\n    }\n  }\n\n  return (\n    <View style={styles.row}>\n      {values.map((val, i) => (\n        <TextInput\n          key={i}\n          ref={(ref) => {\n            inputs.current[i] = ref;\n          }}\n          value={val}\n          onChangeText={(t) => handleChange(t, i)}\n          onKeyPress={(e) => handleKeyPress(e, i)}\n          keyboardType="number-pad"\n          maxLength={length} // allow the full pasted string through onChangeText instead of truncating to 1 char\n          textContentType={Platform.OS === "ios" ? "oneTimeCode" : undefined}\n          autoComplete={Platform.OS === "android" ? "sms-otp" : undefined}\n          importantForAutofill="yes"\n          style={[\n            styles.cell,\n            {\n              width: cellSize,\n              height: cellSize,\n              backgroundColor: colors.surface,\n              borderColor: colors.border,\n              color: colors.textPrimary,\n              fontFamily: fontFamily.headingSemiBold,\n              fontSize: fontSize.xl,\n              borderRadius: radius.full,\n            },\n          ]}\n        />\n      ))}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },\n  cell: {\n    borderWidth: 1,\n    textAlign: "center",\n  },\n});\n',
}


if __name__ == "__main__":
    main()
