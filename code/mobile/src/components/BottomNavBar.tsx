import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

export type NavTab = "home" | "bookings" | "messages" | "account";

type TabDef = { key: NavTab; label: string; icon: keyof typeof Ionicons.glyphMap };

const TABS: TabDef[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "bookings", label: "Bookings", icon: "calendar-outline" },
  { key: "messages", label: "Messages", icon: "chatbubbles-outline" },
  { key: "account", label: "Account", icon: "person-outline" },
];

type Props = {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  /** Unread message count; the badge is hidden entirely when 0 rather than showing a fake "0". */
  unreadMessageCount?: number;
};

export default function BottomNavBar({ activeTab, onChangeTab, unreadMessageCount = 0 }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.backgroundElevated, borderTopColor: colors.border, paddingBottom: spacing.sm }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        // Every tab icon here has a matching filled variant in Ionicons
        // (e.g. "home-outline" -> "home"), so swapping to the filled form
        // for the active tab is a safe string transform, not a lookup.
        const iconName = isActive ? (tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : tab.icon;
        const tint = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View>
              <Ionicons name={iconName} size={22} color={tint} />
              {tab.key === "messages" && unreadMessageCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.backgroundElevated }]} />
              )}
            </View>
            <Text style={{ color: tint, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs, marginTop: 4 }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -6, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
});
