import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { Technician, fetchNearbyTechnicians } from "../services/technicians";
import { SUPPORT_CONVERSATION_ID } from "../services/messages";
import TopBar from "../components/TopBar";
import SearchBar from "../components/SearchBar";
import MapSection from "../components/MapSection";
import RecenterCompassButton from "../components/RecenterCompassButton";
import BottomNavBar, { NavTab } from "../components/BottomNavBar";
import SideMenu from "../components/SideMenu";
import ChangePasswordModal from "../components/ChangePasswordModal";
import SuccessModal from "../components/SuccessModal";
import AccountScreen from "./AccountScreen";
import BookingsScreen from "./BookingsScreen";
import MessagesScreen from "./MessagesScreen";

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
  /** Bubbles a freshly-uploaded avatar's URL up to App.tsx's shared user state - see AccountScreen.tsx for why this can't just be local state here. */
  onAvatarUpdated: (avatarUrl: string) => void;
};

const NEARBY_RADIUS_KM = 2;

// Dar es Salaam city-center fallback, used only until device geolocation
// (expo-location) is wired up. Keeping this as a named constant rather
// than inline magic numbers so it's easy to find and replace later.
const FALLBACK_LOCATION = { latitude: -6.7924, longitude: 39.2083 };

// The shell for every logged-in customer screen: top bar, side menu,
// bottom nav bar, and the change-password modal are all owned here so
// they stay put while the body underneath swaps between Home (the map),
// Bookings, Messages, and Account depending on the active tab.
export default function CustomerHomeScreen({ user, token, onLogout, onAvatarUpdated }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isPasswordSuccessVisible, setPasswordSuccessVisible] = useState(false);
  // Set right before switching to the Messages tab (e.g. from "Need
  // Support" in the side menu) so MessagesScreen opens that thread
  // immediately instead of landing on the conversation list.
  const [messagesTarget, setMessagesTarget] = useState<string | null>(null);

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
    // Booking flow itself isn't built yet - selecting the technician is
    // the visible feedback for now. Once it exists, this is also where a
    // new entry would be added for BookingsScreen to pick up.
    setSelectedTechnicianId(technician.id);
  }, []);

  function openAccount() {
    setActiveTab("account");
    setMenuOpen(false);
  }

  function openChangePassword() {
    setMenuOpen(false);
    setChangePasswordOpen(true);
  }

  function openSupport() {
    setMessagesTarget(SUPPORT_CONVERSATION_ID);
    setActiveTab("messages");
    setMenuOpen(false);
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
          onPressProfile={openAccount}
          onPressMenu={() => setMenuOpen(true)}
        />

        {activeTab === "home" && (
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
        )}

        <View style={styles.body}>
          {activeTab === "home" && (
            <MapSection
              technicians={technicians}
              userLocation={FALLBACK_LOCATION}
              radiusKm={NEARBY_RADIUS_KM}
              onSelectTechnician={setSelectedTechnicianId}
              selectedTechnicianId={selectedTechnicianId}
              onBookTechnician={handleBookTechnician}
              onDiscardTechnician={handleDiscardTechnician}
            />
          )}
          {activeTab === "bookings" && <BookingsScreen token={token} />}
          {activeTab === "messages" && (
            <MessagesScreen
              token={token}
              initialConversationId={messagesTarget}
              onConversationOpened={() => setMessagesTarget(null)}
            />
          )}
          {activeTab === "account" && (
            <AccountScreen user={user} token={token} onLogout={onLogout} onAvatarUpdated={onAvatarUpdated} />
          )}
        </View>

        {/* This wrapper only contains the nav bar (no flex/explicit height),
            so it naturally hugs the nav bar's own size. The compass button
            is absolutely positioned within it at top: -half-its-height,
            which puts its vertical center exactly on this wrapper's top
            edge - i.e. the map/nav-bar boundary - giving a precise 50/50
            straddle no matter how tall the nav bar ends up being. Only
            shown on the Home tab, since it's a map control. */}
        <View style={styles.navWrap}>
          {activeTab === "home" && <RecenterCompassButton onPress={loadTechnicians} />}
          <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>
      </View>

      <SideMenu
        visible={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user.fullName}
        email={user.email}
        avatarUrl={user.avatarUrl}
        lastActiveAt={user.lastActiveAt}
        onViewProfile={openAccount}
        onChangePassword={openChangePassword}
        onNeedSupport={openSupport}
      />

      <ChangePasswordModal
        visible={isChangePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        token={token}
        email={user.email}
        onSuccess={() => setPasswordSuccessVisible(true)}
      />

      <SuccessModal
        visible={isPasswordSuccessVisible}
        message={t("changePassword.success")}
        onClose={() => setPasswordSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Edge-to-edge now: the map fills the whole body area itself (per the
  // wireframe), so no horizontal padding or rounded card wrapper here.
  body: { flex: 1 },
  navWrap: { position: "relative" },
});
