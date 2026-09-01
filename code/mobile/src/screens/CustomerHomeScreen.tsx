import React, { useCallback, useEffect, useState } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { Technician, fetchNearbyTechnicians } from "../services/technicians";
import TopBar from "../components/TopBar";
import MapSection from "../components/MapSection";
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

  useEffect(() => {
    let cancelled = false;

    // No verified fundi accounts exist yet, so this will currently always
    // resolve to an empty list (see services/technicians.ts) and the map
    // renders its empty state. It's wired up now so nothing else needs to
    // change once technician discovery is live server-side.
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}>
        <TopBar
          userName={user.fullName}
          avatarUrl={user.avatarUrl}
          lastActiveAt={user.lastActiveAt}
          onPressProfile={() => handleChangeTab("account")}
        />

        <View style={styles.body}>
          <MapSection
            technicians={technicians}
            radiusKm={NEARBY_RADIUS_KM}
            onPressFilter={() => {}}
            onSelectTechnician={setSelectedTechnicianId}
            selectedTechnicianId={selectedTechnicianId}
            onBookTechnician={handleBookTechnician}
            onDiscardTechnician={handleDiscardTechnician}
          />
        </View>

        <BottomNavBar activeTab={activeTab} onChangeTab={handleChangeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
});
