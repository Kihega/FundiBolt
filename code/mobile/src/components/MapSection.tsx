import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing, LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { Technician } from "../services/technicians";
import Avatar from "./Avatar";
import TechnicianCard from "./TechnicianCard";

type Props = {
  technicians: Technician[];
  radiusKm: number;
  onPressFilter: () => void;
  onSelectTechnician: (id: string | null) => void;
  selectedTechnicianId: string | null;
  onBookTechnician: (technician: Technician) => void;
  onDiscardTechnician: (technicianId: string) => void;
};

const MAP_HEIGHT = 320;

/**
 * A lightweight, dependency-free stand-in for a real map SDK. This app
 * doesn't have a maps library wired up yet (no react-native-maps / API key
 * in the mobile package), so instead of blocking this sprint's home-screen
 * layout on that integration, technician pins are plotted on a stylized
 * dark "map" using simple relative math. Swapping this for a real
 * MapView is a drop-in follow-up once maps + a technician-location API
 * exist - the pin positions, selection state, and card panel below are
 * already decoupled from any specific map implementation.
 */
export default function MapSection({
  technicians,
  radiusKm,
  onPressFilter,
  onSelectTechnician,
  selectedTechnicianId,
  onBookTechnician,
  onDiscardTechnician,
}: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  const [mapWidth, setMapWidth] = useState(0);

  function handleMapLayout(e: LayoutChangeEvent) {
    setMapWidth(e.nativeEvent.layout.width);
  }

  // Pulsing "you are here" marker, matching the pulse pattern already used
  // in SuccessModal for consistency across the app.
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 2.2, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseScale, pulseOpacity]);

  // Scatter technician pins around the center based on their offset from
  // the user, normalized into the visible map box. Deterministic per
  // technician (based on lat/lng), not random on every render.
  const pins = useMemo(() => {
    if (mapWidth === 0) return [];
    const centerX = mapWidth / 2;
    const centerY = MAP_HEIGHT / 2;
    const maxOffset = Math.min(mapWidth, MAP_HEIGHT) / 2 - 40;

    return technicians.map((tech, index) => {
      // Spread deterministically using the technician's index and distance
      // so pins don't overlap the center marker or each other in a
      // predictable ring layout.
      const angle = (index / Math.max(technicians.length, 1)) * Math.PI * 2;
      const normalizedDistance = Math.min(tech.distanceKm / Math.max(radiusKm, 0.1), 1);
      const offset = 40 + normalizedDistance * maxOffset;
      return {
        technician: tech,
        x: centerX + Math.cos(angle) * offset,
        y: centerY + Math.sin(angle) * offset,
      };
    });
  }, [technicians, mapWidth, radiusKm]);

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: radius.xl, borderColor: colors.border }]}>
      <View onLayout={handleMapLayout} style={[styles.map, { height: MAP_HEIGHT, backgroundColor: colors.backgroundElevated }]}>
        {/* Faux street grid so the box reads as a map rather than a blank panel */}
        <MapGridBackground />

        <TouchableOpacity
          onPress={onPressFilter}
          style={[styles.filterButton, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
          accessibilityRole="button"
          accessibilityLabel="Filter technicians"
        >
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* User's current location, center of the map */}
        <View style={[styles.center, { left: mapWidth / 2 - 12, top: MAP_HEIGHT / 2 - 12 }]} pointerEvents="none">
          <Animated.View
            style={[
              styles.pulseRing,
              { backgroundColor: colors.primary, opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
          <View style={[styles.centerDot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
        </View>

        {pins.map(({ technician, x, y }) => {
          const isSelected = technician.id === selectedTechnicianId;
          return (
            <TouchableOpacity
              key={technician.id}
              onPress={() => onSelectTechnician(isSelected ? null : technician.id)}
              style={[styles.pin, { left: x - 22, top: y - 22 }]}
              accessibilityRole="button"
              accessibilityLabel={`View ${technician.fullName}'s profile`}
            >
              <View
                style={[
                  styles.pinRing,
                  { borderColor: technician.isAvailable ? colors.success : colors.textMuted, opacity: isSelected ? 1 : 0.85 },
                ]}
              >
                <Avatar uri={technician.avatarUrl} name={technician.fullName} size={40} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.panel, { padding: spacing.lg }]}>
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.lg }}>
          Nearest Technicians
        </Text>
        <View style={styles.radiusRow}>
          <Ionicons name="radio-outline" size={14} color={colors.success} />
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginLeft: 6 }}>
            Within {radiusKm} km
          </Text>
        </View>

        {technicians.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, marginTop: spacing.md }]}>
            <Ionicons name="hammer-outline" size={22} color={colors.textMuted} />
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamily.bodyRegular,
                fontSize: fontSize.sm,
                marginTop: spacing.xs,
                textAlign: "center",
              }}
            >
              No verified technicians nearby yet. We'll show them here as soon as one joins your area.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: spacing.md }}
          >
            {technicians.map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onBook={onBookTechnician}
                onDiscarded={onDiscardTechnician}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// Purely decorative grid lines to suggest map streets without needing an
// actual map tile provider.
function MapGridBackground() {
  const { colors } = useTheme();
  const lines = [0.2, 0.4, 0.6, 0.8];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines.map((pct) => (
        <View key={`h-${pct}`} style={[styles.gridLine, { top: `${pct * 100}%`, width: "100%", height: 1, backgroundColor: colors.border }]} />
      ))}
      {lines.map((pct) => (
        <View key={`v-${pct}`} style={[styles.gridLine, { left: `${pct * 100}%`, height: "100%", width: 1, backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { overflow: "hidden", borderWidth: 1 },
  map: { width: "100%", overflow: "hidden" },
  gridLine: { position: "absolute", opacity: 0.5 },
  filterButton: { position: "absolute", top: 14, right: 14, width: 40, height: 40, alignItems: "center", justifyContent: "center", zIndex: 2 },
  center: { position: "absolute", width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  centerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  pin: { position: "absolute", width: 44, height: 44 },
  pinRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  panel: {},
  radiusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  emptyState: { alignItems: "center", padding: 20 },
});
