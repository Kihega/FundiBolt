import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = { onFinish: () => void };

export default function SplashScreen({ onFinish }: Props) {
  const { colors, fontFamily, fontSize } = useTheme();

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    // Gentle warm glow breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Brand text: soft blink-in flicker, then settles into place
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 0.25, duration: 80, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 0.5, duration: 90, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, []);

  const ringScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.1] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoWrap}>
        <Animated.View
          style={[
            styles.glowRing,
            { backgroundColor: colors.glowPrimary, transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.glowRingInner,
            { backgroundColor: colors.glowSecondary, transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        <Animated.Image
          source={require("../../assets/logo.png")}
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </View>

      <Animated.Text
        style={[
          styles.brandText,
          {
            color: colors.textPrimary,
            fontFamily: fontFamily.headingBold,
            fontSize: fontSize.brand,
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            textShadowColor: colors.glowPrimary,
            textShadowRadius: 8,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        FundiBolt
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  glowRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowRingInner: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  logo: {
    width: 150,
    height: 150,
  },
  brandText: {
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
