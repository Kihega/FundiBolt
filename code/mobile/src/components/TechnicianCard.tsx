import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { Technician } from "../services/technicians";
import Avatar from "./Avatar";

type Props = {
  technician: Technician;
  onBook: (technician: Technician) => void;
  /** Called once the discard exit animation finishes, so the parent removes it from the list at the right time. */
  onDiscarded: (technicianId: string) => void;
};

// A single nearest-technician card - profile photo, name, and what they
// work on - floating directly on the map per the approved wireframe.
// Slides in from the right on mount (matching the wireframe's "animated
// from right to left" note), and on "Discard" plays a fade+shrink exit
// before notifying the parent to remove it from the list, so it never
// just pops away.
export default function TechnicianCard({ technician, onBook, onDiscarded }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(48)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateX]);

  function handleDiscard() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDiscarded(technician.id);
    });
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          opacity,
          transform: [{ translateX }, { scale }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Avatar uri={technician.avatarUrl} name={technician.fullName} size={48} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.sm }}>
            {technician.fullName}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs, marginTop: 1 }}>
            {technician.specialty}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: technician.isAvailable ? colors.success : colors.textMuted }]} />
            <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginLeft: 4 }}>
              {technician.isAvailable ? "Available" : "Unavailable"} · {technician.distanceKm.toFixed(1)} km
            </Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={colors.warning} />
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs, marginLeft: 2 }}>
            {technician.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      {technician.skills.length > 0 && (
        <Text
          numberOfLines={1}
          style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: spacing.xs }}
        >
          {technician.skills.join(" · ")}
        </Text>
      )}

      <View style={[styles.actionsRow, { gap: spacing.sm }]}>
        <TouchableOpacity
          onPress={handleDiscard}
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
          accessibilityRole="button"
          accessibilityLabel={`Discard ${technician.fullName}`}
        >
          <Ionicons name="close" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onBook(technician)}
          disabled={!technician.isAvailable}
          style={[styles.bookButton, { backgroundColor: colors.primary, borderRadius: radius.md, opacity: technician.isAvailable ? 1 : 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={`Book ${technician.fullName}`}
        >
          <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs, marginLeft: 6 }}>Book</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: 240, padding: 12, marginRight: 12, borderWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ratingBadge: { flexDirection: "row", alignItems: "center" },
  actionsRow: { flexDirection: "row", marginTop: 10 },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  bookButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
});
