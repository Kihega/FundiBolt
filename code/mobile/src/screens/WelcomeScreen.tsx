import React from "react";
import { View, Image, Text, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import GradientButton from "../components/GradientButton";

type Props = {
  onLogin: () => void;
  onSignup: () => void;
};

export default function WelcomeScreen({ onLogin, onSignup }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
          WELCOME TO
        </Text>
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingBold, fontSize: fontSize.display, marginTop: 4 }}>
          FundiBolt
        </Text>

        <View style={{ width: "100%", marginTop: spacing.xl }}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
              Verified Fundis
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 4 }}>
              Every fundi is reviewed and approved before they can accept jobs.
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.sm }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
              Fast Booking
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 4 }}>
              Find and book a nearby fundi in minutes, not days.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <GradientButton label="Log in" onPress={onLogin} />
        <GradientButton
          label="Create Account"
          onPress={onSignup}
          variant="outline"
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logo: { width: 90, height: 90, marginBottom: 16 },
  card: { padding: 16 },
});
