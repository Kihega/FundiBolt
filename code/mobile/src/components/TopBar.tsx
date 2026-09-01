import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { getOnlineStatus } from "../utils/onlineStatus";
import BrandWordmark from "./BrandWordmark";
import Avatar from "./Avatar";

type Props = {
  userName: string;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  onPressProfile: () => void;
};

// Home screen header: logo + "FundiBolt" wordmark on the left, profile
// avatar with a green "online" dot on the right (per the approved home
// screen design). The dot only shows while the user was active within the
// last ONLINE_THRESHOLD_MINUTES - see utils/onlineStatus.ts.
export default function TopBar({ userName, avatarUrl, lastActiveAt, onPressProfile }: Props) {
  const { spacing, fontSize } = useTheme();
  const { isOnline } = getOnlineStatus(lastActiveAt);

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={styles.brandRow}>
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
  logo: { width: 32, height: 32, marginRight: 6 },
});
