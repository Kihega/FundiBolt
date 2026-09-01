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

// A single nearest-technician card. Slides/fades in on mount, and on
// "Discard" plays a fade+shrink exit before notifying the parent to remove
// it from the list - so the card never just pops away.
export default function TechnicianCard({ technician, onBook, onDiscarded }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

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
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Avatar uri={technician.avatarUrl} name={technician.fullName} size={56} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.base }}>
            {technician.fullName}
          </Text>
          <Text style={{ color: colors.primary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
            {technician.specialty}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginLeft: 4 }}>
              {technician.distanceKm.toFixed(1)} km away
            </Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs, marginLeft: 3 }}>
            {technician.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.availabilityRow}>
        <View style={[styles.dot, { backgroundColor: technician.isAvailable ? colors.success : colors.textMuted }]} />
        <Text
          style={{
            color: technician.isAvailable ? colors.success : colors.textMuted,
            fontFamily: fontFamily.bodyMedium,
            fontSize: fontSize.xs,
          }}
        >
          {technician.isAvailable ? "Available now" : "Unavailable"}
        </Text>
      </View>

      <View style={styles.skillsRow}>
        {technician.skills.map((skill) => (
          <View key={skill} style={[styles.skillChip, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs }}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.actionsRow, { gap: spacing.sm }]}>
        <TouchableOpacity
          onPress={handleDiscard}
          style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
        >
          <Ionicons name="close" size={16} color={colors.textPrimary} />
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.sm, marginLeft: 6 }}>
            Discard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onBook(technician)}
          disabled={!technician.isAvailable}
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary, borderRadius: radius.md, opacity: technician.isAvailable ? 1 : 0.5 },
          ]}
        >
          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.sm, marginLeft: 6 }}>
            Book
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: 280, padding: 14, marginRight: 12, borderWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingBadge: { flexDirection: "row", alignItems: "center" },
  availabilityRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 6 },
  skillChip: { paddingHorizontal: 10, paddingVertical: 5 },
  actionsRow: { flexDirection: "row", marginTop: 14 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
});
