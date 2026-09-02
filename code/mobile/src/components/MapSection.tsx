import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { Technician } from "../services/technicians";
import Avatar from "./Avatar";
import TechnicianCard from "./TechnicianCard";
import { RECENTER_BUTTON_SIZE } from "./RecenterCompassButton";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  technicians: Technician[];
  /** The customer's current position - drives the map's initial region. */
  userLocation: Coordinates;
  radiusKm: number;
  onSelectTechnician: (id: string | null) => void;
  selectedTechnicianId: string | null;
  onBookTechnician: (technician: Technician) => void;
  onDiscardTechnician: (technicianId: string) => void;
};

// Roughly converts a search radius in km into a MapView region delta (1
// degree of latitude is ~111km). The 1.6x factor pads the initial view a
// little so the radius doesn't sit flush against the screen edges.
function radiusKmToDelta(radiusKm: number) {
  return Math.max((radiusKm / 111) * 1.6, 0.01);
}

// The compass/refresh button (see CustomerHomeScreen + RecenterCompassButton)
// pokes RECENTER_BUTTON_SIZE / 2 up into the map from the nav-bar boundary.
// Cards need to clear that plus a bit of breathing room so the two don't
// visually collide near the bottom of the map.
const CARDS_BOTTOM_OFFSET = RECENTER_BUTTON_SIZE / 2 + 16;

/**
 * Real map, powered by react-native-maps, using each platform's native
 * provider - Apple Maps on iOS, Google Maps on Android. Both are free
 * during development: Apple Maps never needs a key, and Android's Google
 * Maps works out of the box in Expo Go using Expo's own bundled testing
 * key. (An earlier version of this screen swapped Android to free
 * OpenStreetMap raster tiles to dodge needing a Google key at all, but
 * OpenStreetMap's volunteer-run tile servers actively block apps that
 * don't follow their tile usage policy - see osm.wiki/Blocked - which is
 * exactly the "Access blocked" 403 error that approach produced. Only a
 * standalone/production Android build needs a real Google Maps API key,
 * set in app.json at expo.android.config.googleMaps.apiKey - not
 * something to worry about yet during development.)
 *
 * Technician pins use their actual latitude/longitude (Technician already
 * carries both - see services/technicians.ts) instead of a stand-in
 * scatter layout.
 *
 * Per the approved wireframe, the map fills the entire body of the screen
 * edge-to-edge (no card, border, or radius around it), with the
 * nearest-technician cards floating directly on top of it near the
 * bottom. The recenter/refresh control lives outside this component (see
 * CustomerHomeScreen) so it can straddle the map/nav-bar boundary.
 */
export default function MapSection({
  technicians,
  userLocation,
  radiusKm,
  onSelectTechnician,
  selectedTechnicianId,
  onBookTechnician,
  onDiscardTechnician,
}: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  const initialRegion: Region = useMemo(() => {
    const delta = radiusKmToDelta(radiusKm);
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  }, [userLocation, radiusKm]);

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

  return (
    <View style={styles.map}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* User's current location */}
        <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.center} pointerEvents="none">
            <Animated.View
              style={[
                styles.pulseRing,
                { backgroundColor: colors.primary, opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
              ]}
            />
            <View style={[styles.centerDot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
          </View>
        </Marker>

        {technicians.map((technician) => {
          const isSelected = technician.id === selectedTechnicianId;
          return (
            <Marker
              key={technician.id}
              coordinate={{ latitude: technician.latitude, longitude: technician.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => onSelectTechnician(isSelected ? null : technician.id)}
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
            </Marker>
          );
        })}
      </MapView>

      {/* Nearest-technician cards float directly on the map, above the
          bottom nav bar. Per the wireframe: Case 1 - shown only when
          technicians are found nearby. Case 2 - when there are none, this
          is omitted entirely and the search bar up top is how the
          customer looks for a technician instead. */}
      {technicians.length > 0 && (
        <View style={styles.cardsOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.radiusPill,
              { backgroundColor: colors.backgroundElevated, borderColor: colors.border, borderRadius: radius.full },
            ]}
          >
            <Ionicons name="radio-outline" size={12} color={colors.success} />
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginLeft: 4 }}>
              Within {radiusKm} km
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%", overflow: "hidden" },
  center: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  centerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  pinRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  cardsOverlay: { position: "absolute", left: 0, right: 0, bottom: CARDS_BOTTOM_OFFSET, zIndex: 3 },
  radiusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 24,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
});
