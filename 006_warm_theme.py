#!/usr/bin/env python3
"""
FundiBolt - Patch 006: Replace neon theme with warm/minimal theme
Run this from the project ROOT folder (~/FundiBolt):
    cd ~/FundiBolt
    python3 006_warm_theme.py

After running:
    cd code/mobile
    npx expo install @expo-google-fonts/lora
    npm uninstall @expo-google-fonts/poppins   # no longer used
    npx expo start -c   # -c clears the Metro cache so font changes pick up cleanly
"""

import os

ROOT = os.getcwd()

def write_file(path, content):
    full_path = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full_path) or ".", exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content.lstrip("\n"))
    print(f"[written] {path}")


# ---------------------------------------------------------------------------
# COLORS - warm, minimal palette (cream/charcoal, terracotta/amber accents)
# ---------------------------------------------------------------------------

write_file("code/mobile/src/theme/colors.ts", """
// FundiBolt color system - warm, minimal aesthetic.
// Cream/charcoal backgrounds, terracotta + amber accents, muted olive green
// as a nod to the original logo's green without going neon/techy.

export const darkColors = {
  background: "#211C17",
  backgroundElevated: "#2A241D",
  surface: "#2A241D",
  surfaceElevated: "#332C23",
  border: "#453C30",

  primary: "#D98E4A",       // warm amber
  primaryDark: "#B76E2F",
  secondary: "#8FA377",     // muted olive green
  secondaryDark: "#6B8256",
  accent: "#E0A868",        // soft amber highlight
  accentDark: "#C1633D",    // terracotta

  textPrimary: "#F5EFE6",
  textSecondary: "#C9BFAF",
  textMuted: "#8F8574",
  placeholder: "#8F8574",

  success: "#8FA377",
  error: "#D9714F",
  warning: "#E0B368",

  glowPrimary: "#E0A868",
  glowSecondary: "#D98E4A",
};

export const lightColors = {
  background: "#F7F3EC",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F0EAE0",
  border: "#E5DDD0",

  primary: "#C1633D",       // terracotta
  primaryDark: "#A34E2C",
  secondary: "#7A8B69",     // muted olive green
  secondaryDark: "#5C6B4E",
  accent: "#D98E4A",        // warm amber
  accentDark: "#B76E2F",

  textPrimary: "#2B241D",
  textSecondary: "#6B5F52",
  textMuted: "#9C9184",
  placeholder: "#9C9184",

  success: "#6B8F52",
  error: "#B3492F",
  warning: "#D9A441",

  glowPrimary: "#E8A868",
  glowSecondary: "#C1633D",
};

export type ThemeColors = typeof darkColors;
""")


# ---------------------------------------------------------------------------
# TYPOGRAPHY - Lora (serif, warm/editorial) for headings, Inter stays for body
# ---------------------------------------------------------------------------

write_file("code/mobile/src/theme/typography.ts", """
// Lora for headings/branding (warm, editorial serif - calmer than a tech/neon feel)
// Inter for body text (clean, highly legible)

export const fontFamily = {
  headingBold: "Lora_700Bold",
  headingSemiBold: "Lora_600SemiBold",
  headingMedium: "Lora_500Medium",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
  brand: 40,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
""")


# ---------------------------------------------------------------------------
# SPLASH SCREEN - softer, warm glow instead of neon pulse
# ---------------------------------------------------------------------------

write_file("code/mobile/src/screens/SplashScreen.tsx", """
import React, { useEffect, useRef } from "react";
import { View, Image, Animated, StyleSheet, Easing } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = { onFinish: () => void };

export default function SplashScreen({ onFinish }: Props) {
  const { colors, fontFamily, fontSize } = useTheme();

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    // Gentle warm glow breathing loop - subtler than a neon pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Brand text entrance
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(onFinish, 2600);
    return () => clearTimeout(timer);
  }, []);

  const ringScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.1] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoWrap}>
        {/* Soft warm glow rings - understated, not neon */}
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
    marginBottom: 24,
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
    letterSpacing: 0.5,
  },
});
""")


# ---------------------------------------------------------------------------
# APP.TSX - swap Poppins font loading for Lora
# ---------------------------------------------------------------------------

write_file("code/mobile/App.tsx", """
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreenNative from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Lora_500Medium, Lora_600SemiBold, Lora_700Bold } from "@expo-google-fonts/lora";

import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import SplashScreen from "./src/screens/SplashScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";

SplashScreenNative.preventAutoHideAsync();

type Screen = "splash" | "welcome" | "login" | "signup" | "home";

function Root() {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>("splash");
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenNative.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) return null;

  if (screen === "splash") {
    return <SplashScreen onFinish={() => setScreen("welcome")} />;
  }

  if (screen === "welcome") {
    return <WelcomeScreen onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />;
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onLoginSuccess={(token) => {
          setAuthToken(token);
          setScreen("home");
        }}
        onGoToSignup={() => setScreen("signup")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupScreen
        onSignupSuccess={(token) => {
          setAuthToken(token);
          setScreen("home");
        }}
        onGoToLogin={() => setScreen("login")}
      />
    );
  }

  // Placeholder home - next patch will build this out properly
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
""")

print("\nDone. Next steps:")
print("  cd code/mobile")
print("  npx expo install @expo-google-fonts/lora")
print("  npm uninstall @expo-google-fonts/poppins")
print("  npx expo start -c")
