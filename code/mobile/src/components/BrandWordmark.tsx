import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = { size?: number };

// Two-tone wordmark: "Fundi" in the primary text color, "Bolt" in the
// theme's accent purple - mirrors the reference design's two-tone logotype.
export default function BrandWordmark({ size }: Props) {
  const { colors, fontFamily, fontSize } = useTheme();
  const textSize = size || fontSize.display;

  return (
    <View style={{ flexDirection: "row" }}>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingBold, fontSize: textSize }}>
        Fundi
      </Text>
      <Text style={{ color: colors.primary, fontFamily: fontFamily.headingBold, fontSize: textSize }}>
        Bolt
      </Text>
    </View>
  );
}
