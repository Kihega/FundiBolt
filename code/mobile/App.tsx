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
