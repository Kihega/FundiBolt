import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";

type Props = {
  onLogout: () => void;
};

const PLACEHOLDER_CARDS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "search-outline", title: "Find a Technician", body: "Search coming in the next build - technician search & profiles." },
  { icon: "calendar-outline", title: "My Bookings", body: "Your upcoming and past bookings will show up here." },
  { icon: "chatbubbles-outline", title: "Messages", body: "Chat with technicians about your job details." },
  { icon: "person-outline", title: "Profile", body: "Manage your account details and preferences." },
];

export default function HomeScreen({ onLogout }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { maxContentWidth } = useResponsive();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
                Welcome to
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingBold, fontSize: fontSize.xxl }}>
                FundiBolt
              </Text>
            </View>
            <TouchableOpacity
              onPress={onLogout}
              style={[styles.logoutButton, { backgroundColor: colors.surface, borderRadius: radius.full }]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.base, marginBottom: spacing.lg }}>
            You're signed in. This is a placeholder dashboard - the real technician search, bookings, and chat screens are next on the roadmap.
          </Text>

          {PLACEHOLDER_CARDS.map((card) => (
            <View
              key={card.title}
              style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}>
                <Ionicons name={card.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
                  {card.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 2 }}>
                  {card.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoutButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", alignItems: "center", padding: 14 },
  cardIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
