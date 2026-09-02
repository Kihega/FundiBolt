import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  /** Re-fetches nearby technicians. Optional so the button still renders (disabled) if a caller doesn't wire it up. */
  onPress?: () => void;
};

const GLOW_DOT_COUNT = 8;
const GLOW_RING_RADIUS = 42;

// Sized so its parent (see CustomerHomeScreen) can position it exactly
// half inside the map and half inside the bottom nav bar - the parent
// only needs to offset this by -BUTTON_SIZE / 2 from the map/nav-bar
// boundary to get a perfect 50/50 straddle, regardless of how tall the
// nav bar itself ends up being.
export const RECENTER_BUTTON_SIZE = 68;

// Recenter/refresh control, styled after a ship-navigation compass: a
// ring of small glowing green lights chases around its edge, and the
// icon is a compass needle rather than a plain refresh glyph, per the
// wireframe notes.
export default function RecenterCompassButton({ onPress }: Props) {
  const { colors } = useTheme();

  const glowValues = useRef(Array.from({ length: GLOW_DOT_COUNT }, () => new Animated.Value(0.25))).current;

  useEffect(() => {
    const cycleDuration = 1600;
    const step = cycleDuration / GLOW_DOT_COUNT;
    const loops = glowValues.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * step),
          Animated.timing(value, { toValue: 1, duration: step, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.25, duration: cycleDuration - step, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [glowValues]);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.glowRing} pointerEvents="none">
        {glowValues.map((value, i) => {
          const angle = (i / GLOW_DOT_COUNT) * Math.PI * 2;
          return (
            <Animated.View
              key={i}
              style={[
                styles.glowDot,
                {
                  backgroundColor: colors.success,
                  opacity: value,
                  transform: [
                    { translateX: Math.cos(angle) * GLOW_RING_RADIUS },
                    { translateY: Math.sin(angle) * GLOW_RING_RADIUS },
                    { scale: value },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={[styles.button, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel="Refresh nearby technicians"
      >
        {/* Compass/ship-navigation needle rather than a plain refresh icon, per the wireframe. */}
        <Ionicons name="compass-outline" size={32} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Positioned by its parent's own coordinate space: top: -HALF puts this
  // view's vertical center exactly on the parent's top edge, so anything
  // rendered above that edge (the glow ring + top half of the button)
  // visually sits over the map, and anything below (the bottom half)
  // sits over the parent - see CustomerHomeScreen, where the parent wraps
  // only the bottom nav bar.
  wrap: {
    position: "absolute",
    top: -RECENTER_BUTTON_SIZE / 2,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  glowRing: { position: "absolute", width: 1, height: 1, alignItems: "center", justifyContent: "center" },
  glowDot: { position: "absolute", width: 6, height: 6, borderRadius: 3, marginLeft: -3, marginTop: -3 },
  button: {
    width: RECENTER_BUTTON_SIZE,
    height: RECENTER_BUTTON_SIZE,
    borderRadius: RECENTER_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    // A little extra elevation/shadow so it visibly floats above both the
    // map and the nav bar at the seam, instead of looking flush.
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
