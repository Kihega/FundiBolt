import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { SUPPORT_CONVERSATION_ID } from "../services/messages";
import TopBar from "../components/TopBar";
import BottomNavBar, { NavTab } from "../components/BottomNavBar";
import SideMenu from "../components/SideMenu";
import ChangePasswordModal from "../components/ChangePasswordModal";
import SuccessModal from "../components/SuccessModal";
import TechnicianProfileScreen from "./TechnicianProfileScreen";
import BookingsScreen from "./BookingsScreen";
import MessagesScreen from "./MessagesScreen";

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
  onAvatarUpdated: (avatarUrl: string) => void;
  onProfileUpdated: (patch: Partial<AuthUser>) => void;
};

// Same shell as CustomerHomeScreen (top bar, side menu, bottom nav bar,
// change-password modal), with two deliberate differences per item 1/4:
//   - no SearchBar (a technician isn't searching for other technicians)
//   - the Account tab / "View Profile" opens TechnicianProfileScreen
//     instead of the customer AccountScreen
// The Home tab's live booking-location map (item 2) and Bookings screen's
// accept/reject cards (item 3) are staged as their own follow-up patch -
// showing a placeholder here rather than the customer's "nearby
// technicians" map, which wouldn't make sense on a technician's own home
// screen.
export default function TechnicianHomeScreen({ user, token, onLogout, onAvatarUpdated, onProfileUpdated }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isPasswordSuccessVisible, setPasswordSuccessVisible] = useState(false);
  const [messagesTarget, setMessagesTarget] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}>
        <TopBar
          userName={user.fullName}
          avatarUrl={user.avatarUrl}
          onPressProfile={openAccount}
          onPressMenu={() => setMenuOpen(true)}
        />

        <View style={styles.body}>
          {activeTab === "home" && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
              <Ionicons name="map-outline" size={40} color={colors.textMuted} />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fontFamily.bodyMedium,
                  fontSize: fontSize.base,
                  marginTop: spacing.md,
                  textAlign: "center",
                }}
              >
                Your booking map is coming in the next update.
              </Text>
            </View>
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
            <TechnicianProfileScreen
              user={user}
              token={token}
              onLogout={onLogout}
              onAvatarUpdated={onAvatarUpdated}
              onProfileUpdated={onProfileUpdated}
            />
          )}
        </View>

        <View style={styles.navWrap}>
          <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>
      </View>

      <SideMenu
        visible={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user.fullName}
        email={user.email}
        avatarUrl={user.avatarUrl}
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
  body: { flex: 1 },
  navWrap: { position: "relative" },
});
