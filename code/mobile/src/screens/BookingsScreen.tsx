import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { ThemeColors } from "../theme/colors";
import { Booking, BookingStatus, fetchBookings } from "../services/bookings";
import Avatar from "../components/Avatar";

type Props = { token: string };

// A booking's status reflects how the technician responded to the
// tender: "pending" until they respond, "active" once they accept it,
// "rejected" if they decline.
const STATUS_COLOR: Record<BookingStatus, (colors: ThemeColors) => { bg: string; text: string }> = {
  active: (colors) => ({ bg: colors.success, text: "#FFFFFF" }),
  pending: (colors) => ({ bg: colors.warning, text: "#1A1A1A" }),
  rejected: (colors) => ({ bg: colors.error, text: "#FFFFFF" }),
};

export default function BookingsScreen({ token }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const results = await fetchBookings(token);
    setBookings(results);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.xl, marginBottom: spacing.md }}>
          {t("bookings.title")}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: "center" }}>
            {t("bookings.empty")}
          </Text>
        </View>
      }
      renderItem={({ item }) => <BookingCard booking={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();

  const statusColor = STATUS_COLOR[booking.status](colors);
  const date = new Date(booking.scheduledFor);
  const dateLabel = Number.isNaN(date.getTime())
    ? booking.scheduledFor
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <Avatar uri={booking.technicianAvatarUrl} name={booking.technicianName} size={44} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.sm }}>
          {booking.technicianName}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 2 }}>
          {booking.service}
        </Text>
        <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 2 }}>{dateLabel}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderRadius: radius.full }]}>
        <Text style={{ color: statusColor.text, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs }}>
          {t(`bookings.status.${booking.status}`)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
});
