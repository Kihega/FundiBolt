import React, { useEffect, useRef } from "react";
import { View, Image, Text, Animated, StyleSheet, SafeAreaView, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import GradientButton from "../components/GradientButton";
import BrandWordmark from "../components/BrandWordmark";

type Props = {
  onLogin: () => void;
  onSignup: () => void;
};

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "shield-checkmark-outline", title: "Verified Fundis", body: "Every fundi is reviewed and approved before they can accept jobs." },
  { icon: "flash-outline", title: "Fast Booking", body: "Find and book a nearby fundi in minutes, not days." },
  { icon: "chatbubbles-outline", title: "Direct Chat", body: "Message your fundi directly to sort out job details before they arrive." },
];

function AnimatedCard({ icon, title, body, delay }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; delay: number }) {
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
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          opacity,
          transform: [{ translateY }],
          marginTop: spacing.sm,
        },
      ]}
    >
      <View style={[styles.cardIcon, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>
          {title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 2 }}>
          {body}
        </Text>
      </View>
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
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

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
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={{ width: "100%", maxWidth: maxContentWidth, alignItems: "center" }}>
          {/* Logo now sits inline at the start of the "FundiBolt" wordmark row.
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
              Find trusted local fundis,{"\n"}fast.
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
              Verified plumbers, electricians, and more - just around the corner.
            </Text>
          </Animated.View>

          <View style={{ width: "100%", marginTop: spacing.xl }}>
            {FEATURES.map((f, i) => (
              <AnimatedCard key={f.title} icon={f.icon} title={f.title} body={f.body} delay={400 + i * 150} />
            ))}
          </View>
        </View>
      </View>

      <Animated.View
        style={{
          opacity: buttonsOpacity,
          width: "100%",
          maxWidth: maxContentWidth,
          alignSelf: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        }}
      >
        <GradientButton label="Log in" onPress={onLogin} />
        <GradientButton label="Create Account" onPress={onSignup} variant="outline" style={{ marginTop: spacing.sm }} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logo: { width: 56, height: 56, marginRight: 8 },
  card: { flexDirection: "row", alignItems: "center", padding: 14 },
  cardIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
