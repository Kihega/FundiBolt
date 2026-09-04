import React, { useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity, StyleSheet, SafeAreaView, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import BrandWordmark from "../components/BrandWordmark";
import type { SignupRole } from "./SignupScreen";

type Props = {
  onLogin: () => void;
  onSignup: (role: SignupRole) => void;
};

const ROLE_OPTIONS: { role: SignupRole; icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    role: "fundi",
    icon: "construct-outline",
    title: "Register as Technician",
    body: "List your skills and start getting booked for plumbing, electrical, and other jobs near you.",
  },
  {
    role: "customer",
    icon: "home-outline",
    title: "Register as Customer",
    body: "Find and book verified, trusted technicians for jobs around your home, fast.",
  },
];

function RoleCard({
  icon,
  title,
  body,
  delay,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  delay: number;
  onPress: () => void;
}) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginTop: spacing.sm }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
      >
        <View style={[styles.cardIcon, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
            {title}
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 }}>
            {body}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function WelcomeScreen({ onLogin, onSignup }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const { maxContentWidth } = useResponsive();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(12)).current;
  const linkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(headlineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headlineTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.timing(linkOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headlineOpacity, headlineTranslateY, linkOpacity, logoOpacity, logoScale]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={{ width: "100%", maxWidth: maxContentWidth, alignItems: "center" }}>
          {/* Logo sits inline at the start of the "FundiBolt" wordmark row.
              The logo keeps its own scale-in entrance and the wordmark keeps
              its own fade/slide entrance - they're just laid out side by
              side now instead of stacked. */}
          <View style={styles.brandRow}>
            <Animated.Image
              source={require("../../assets/logo.png")}
              style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
              resizeMode="contain"
            />
            <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineTranslateY }] }}>
              <BrandWordmark size={fontSize.display} />
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineTranslateY }], alignItems: "center" }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fontFamily.headingSemiBold,
                fontSize: fontSize.xl,
                marginTop: spacing.md,
                textAlign: "center",
              }}
            >
              Find trusted local technicians,{"\n"}fast.
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamily.bodyRegular,
                fontSize: fontSize.sm,
                marginTop: spacing.xs,
                textAlign: "center",
              }}
            >
              Tell us which one you are, so we can set up the right dashboard for you.
            </Text>
          </Animated.View>

          <View style={{ width: "100%", marginTop: spacing.xl }}>
            {ROLE_OPTIONS.map((option, i) => (
              <RoleCard
                key={option.role}
                icon={option.icon}
                title={option.title}
                body={option.body}
                delay={400 + i * 150}
                onPress={() => onSignup(option.role)}
              />
            ))}
          </View>

          {/* Sign-in link now sits just below the cards as part of the same
              centered content group, instead of being pinned to the very
              bottom of the screen. */}
          <Animated.View style={{ opacity: linkOpacity, marginTop: spacing.md }}>
            <TouchableOpacity onPress={onLogin} style={{ alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
                Already have an account? <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logo: { width: 56, height: 56, marginRight: 8 },
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1 },
  cardIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
});
