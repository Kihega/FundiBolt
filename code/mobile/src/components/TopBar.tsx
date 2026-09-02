import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { getOnlineStatus } from "../utils/onlineStatus";
import BrandWordmark from "./BrandWordmark";
import Avatar from "./Avatar";

type Props = {
  userName: string;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  onPressProfile: () => void;
  /** Opens the side drawer/menu. Optional so existing callers keep working; defaults to a disabled no-op until a real drawer exists. */
  onPressMenu?: () => void;
};

// Home screen header, per the approved wireframe: hamburger menu on the far
// left, logo + "FundiBolt" wordmark next to it, and the profile avatar
// (with a green "online" dot) on the right.
export default function TopBar({ userName, avatarUrl, lastActiveAt, onPressProfile, onPressMenu }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  const { isOnline } = getOnlineStatus(lastActiveAt);

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={styles.brandRow}>
        <TouchableOpacity
          onPress={onPressMenu}
          disabled={!onPressMenu}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <BrandWordmark size={fontSize.xl} />
      </View>

      <TouchableOpacity onPress={onPressProfile} accessibilityRole="button" accessibilityLabel="Open profile">
        <Avatar uri={avatarUrl} name={userName} size={44} isOnline={isOnline} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  menuButton: { marginRight: 10, padding: 2 },
  logo: { width: 32, height: 32, marginRight: 6 },
});
