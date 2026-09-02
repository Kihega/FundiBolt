import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { Technician, fetchNearbyTechnicians } from "../services/technicians";
import TopBar from "../components/TopBar";
import SearchBar from "../components/SearchBar";
import MapSection from "../components/MapSection";
import RecenterCompassButton from "../components/RecenterCompassButton";
import BottomNavBar, { NavTab } from "../components/BottomNavBar";

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
};

const NEARBY_RADIUS_KM = 2;

// Dar es Salaam city-center fallback, used only until device geolocation
// (expo-location) is wired up. Keeping this as a named constant rather
// than inline magic numbers so it's easy to find and replace later.
const FALLBACK_LOCATION = { latitude: -6.7924, longitude: 39.2083 };

export default function CustomerHomeScreen({ user, token, onLogout }: Props) {
  const { colors } = useTheme();
  const { maxContentWidth } = useResponsive();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // No verified fundi accounts exist yet, so this will currently always
  // resolve to an empty list (see services/technicians.ts) and the map
  // renders its empty state. It's wired up now so nothing else needs to
  // change once technician discovery is live server-side. Pulled out of
  // the effect so the recenter/refresh button can also trigger it on demand.
  const loadTechnicians = useCallback(async () => {
    const results = await fetchNearbyTechnicians({ ...FALLBACK_LOCATION, radiusKm: NEARBY_RADIUS_KM, token });
    setTechnicians(results);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    fetchNearbyTechnicians({ ...FALLBACK_LOCATION, radiusKm: NEARBY_RADIUS_KM, token }).then((results) => {
      if (!cancelled) setTechnicians(results);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDiscardTechnician = useCallback((technicianId: string) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== technicianId));
    setSelectedTechnicianId((prev) => (prev === technicianId ? null : prev));
  }, []);

  const handleBookTechnician = useCallback((technician: Technician) => {
    // Booking flow isn't built yet - this sprint only covers the home
    // screen UI. Selecting the technician is the visible feedback for now.
    setSelectedTechnicianId(technician.id);
  }, []);

  function handleChangeTab(tab: NavTab) {
    setActiveTab(tab);
    // Bookings, Messages, and Account screens are out of scope for this
    // sprint (home screen only). Account temporarily doubles as "log out"
    // so there's still a way out of the app during development - replace
    // this with real navigation once AccountScreen exists.
    if (tab === "account") {
      onLogout();
    }
  }

  return (
    // SafeAreaView from react-native-safe-area-context (not the plain
    // react-native one, which only computes insets on iOS) so the top bar
    // renders strictly below the device's own status bar - required now
    // that app.json has android.edgeToEdgeEnabled set, which draws the app
    // behind the system status/gesture bars unless insets are applied.
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}>
        <TopBar
          userName={user.fullName}
          avatarUrl={user.avatarUrl}
          lastActiveAt={user.lastActiveAt}
          onPressProfile={() => handleChangeTab("account")}
          onPressMenu={() => {
            // Side drawer/menu isn't built yet - this sprint only covers
            // the home screen layout. Hooking up navigation is a follow-up.
          }}
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={() => {
            // Search-by-name/trade isn't wired to the backend yet (see
            // services/technicians.ts) - this is the customer's fallback
            // when the map has no nearby cards to show (Case 2 in the
            // wireframe), ready to wire up once that endpoint exists.
          }}
        />

        <View style={styles.body}>
          <MapSection
            technicians={technicians}
            userLocation={FALLBACK_LOCATION}
            radiusKm={NEARBY_RADIUS_KM}
            onSelectTechnician={setSelectedTechnicianId}
            selectedTechnicianId={selectedTechnicianId}
            onBookTechnician={handleBookTechnician}
            onDiscardTechnician={handleDiscardTechnician}
          />
        </View>

        {/* This wrapper only contains the nav bar (no flex/explicit height),
            so it naturally hugs the nav bar's own size. The compass button
            is absolutely positioned within it at top: -half-its-height,
            which puts its vertical center exactly on this wrapper's top
            edge - i.e. the map/nav-bar boundary - giving a precise 50/50
            straddle no matter how tall the nav bar ends up being. */}
        <View style={styles.navWrap}>
          <RecenterCompassButton onPress={loadTechnicians} />
          <BottomNavBar activeTab={activeTab} onChangeTab={handleChangeTab} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Edge-to-edge now: the map fills the whole body area itself (per the
  // wireframe), so no horizontal padding or rounded card wrapper here.
  body: { flex: 1 },
  navWrap: { position: "relative" },
});
