import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  uri?: string | null;
  /** Full name used to derive initials when no image is available. */
  name: string;
  size?: number;
  /** When provided, renders a small presence dot in the bottom-right corner. */
  isOnline?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Reused for the top bar's profile photo and technician map pins/cards so
// both fall back to the same "initials on a colored circle" placeholder
// when no photo URL is available yet.
export default function Avatar({ uri, name, size = 40, isOnline }: Props) {
  const { colors } = useTheme();
  const dotSize = Math.max(10, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: size * 0.36 }}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isOnline !== undefined && isOnline && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: colors.success,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  dot: { position: "absolute", right: -1, bottom: -1, borderWidth: 2 },
});
